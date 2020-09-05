import "phaser";

import * as PF from "pathfinding";

import {TILE_SIZE, TARGET_DEPTH, MIN_ZOOM, MAX_ZOOM} from "./constants";
import {TileGrid} from "./tile_grid";
import {generate_bsp} from "./level_gen";
import {Actor} from "./actor";
import {mouse_click_normal, mouse_click_target, mouse_click_throw_tgt} from "./handle_input";
import {move_actors, move_projectiles} from "./movement";
import {process_turns} from "./turn_logic";
import * as util from "./util";
import {FloatingText} from "./floating_text";
import {Item} from "./item";
import * as factory from "./factory";
import {Projectile, initiate_shot} from "./projectile";
import {item_stats} from "./stats";
import {HUDScene} from "./hud_scene";

export enum InputMode {
  NORMAL,
  TARGET,
  THROW_TGT,
}

export class LevelInfo {
  grid: TileGrid;
  items: Array<Item>;
  enemies: Array<Actor>;
}

export class MainScene extends Phaser.Scene {
  controls: Phaser.Cameras.Controls.FixedKeyControl;
  actors: Array<Actor>;
  curr_turn: number;
  grid: TileGrid;
  items: Array<Item>;
  projectiles: Array<Projectile>;

  floating_texts: Array<FloatingText>;

  scrolled: boolean;
  scrolled_x: number;
  scrolled_y: number;
  down_button: number;

  input_mode: InputMode;

  target_render: Phaser.GameObjects.Image;
  target_x: number;
  target_y: number;

  hud: HUDScene;

  level_num: number;
  level_store: Array<LevelInfo>;

  //debug_str: Array<string>;
  //debug_txt: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MainScene"});
  }

  preload(): void {
  }

  create(data): void {
    /*
    this.debug_str = ["0: up", "1: up", "2: up"];
    this.debug_txt = this.add.text(100, 100, "", { color: "blue", stroke: "blue", fontSize: 36});
    this.debug_txt.setText(this.debug_str.join("\n"));
    this.debug_txt.setScrollFactor(0);
    this.debug_txt.depth = 3000;
    */

    this.level_num = data.level_num;
    this.level_store = data.level_store;
    if (this.level_store == null || this.level_store == undefined) {
      this.level_store = [];
    }

    console.log("CREATING LEVEL " + this.level_num);

    let loaded_level = false;
    if (this.level_num >= this.level_store.length) {
      this.create_level_grid();
      this.items = [];
      this.actors = [];
    } else {
      this.grid = this.level_store[this.level_num].grid;
      this.items = this.level_store[this.level_num].items;
      this.actors = this.level_store[this.level_num].enemies;

      for (let item of this.items) {
        item.init_textures(this);
      }
      for (let actor of this.actors) {
        actor.init_textures(this);
      }

      loaded_level = true;
    }
    this.create_level_textures();

    let excludes = [];
    if (!loaded_level) {
      let [up_x, up_y] = util.rand_tile(this);
      this.grid.set_stairs_up(up_x, up_y);
    }
    excludes.push(this.grid.stairs_up);

    if (this.level_num > 0) {
      if (!loaded_level) {
        let [down_x, down_y] = util.rand_tile(this, excludes=excludes);
        this.grid.set_stairs_down(down_x, down_y);
      }
      excludes.push(this.grid.stairs_down);
    }

    // ----- create actors -----

    let player = data.player;
    if (player == undefined || player == null) {
      let [px, py] = util.rand_tile(this, excludes=excludes);
      player = factory.create_player(this, px, py);
    } else {
      if (data.prev_level_num < this.level_num) {
        player.tx = this.grid.stairs_down[0];
        player.ty = this.grid.stairs_down[1];
      } else {
        player.tx = this.grid.stairs_up[0];
        player.ty = this.grid.stairs_up[1];
      }
      let [rx, ry] = util.tile_to_render_coords(player.tx, player.ty);
      player.rx = rx;
      player.ry = ry;
      player.init_textures(this);
    }
    player.camera = this.cameras.main;
    player.camera.centerOn(player.rx, player.ry);

    this.actors.unshift(player);

    //player.camera.setZoom(0.5);

    let num_enemies = this.level_num*2 + 1;
    let num_orbs = 6;
    let num_items = 1;

    if (!loaded_level) {
      console.log("Creating enemies");
      for (let i = 0; i < num_enemies; i++) {
        let [x, y] = util.rand_tile_no_actor(this, excludes=excludes);
        this.actors.push(factory.create_random_enemy(this, x, y));
      }
    }

    this.curr_turn = 0;

    // ----- create items -----

    console.log("Creating items");

    if (!loaded_level) {
      for (let i = 0; i < num_orbs; i++) {
        let [x, y] = util.rand_tile_no_item(this, excludes=excludes);
        this.items.push(factory.create_item(this, "health_orb", x, y));
      }
      for (let i = 0; i < num_orbs; i++) {
        let [x, y] = util.rand_tile_no_item(this, excludes=excludes);
        this.items.push(factory.create_item(this, "cognition_orb", x, y));
      }
      for (let i = 0; i < 2; i++) {
        let [x, y] = util.rand_tile_no_item(this, excludes=excludes);
        this.items.push(factory.create_item(this, "rejuvination_orb", x, y));
      }

      for (let i = 0; i < num_items; i++) {
        let [x, y] = util.rand_tile_no_item(this, excludes=excludes);
        this.items.push(factory.create_random_item(this, x, y));
      }
    }

    this.projectiles = [];

    // ----- updates -------

    this.grid.update_visibility(player.tx, player.ty, player.vision_dist);
    this.update_entity_visibility();

    // ----- extras -------

    this.input_mode = InputMode.NORMAL;
    this.target_render = this.add.image(0, 0, "target");
    this.target_render.setScale(0.5);
    this.target_render.depth = TARGET_DEPTH;
    this.target_render.visible = false;
    this.target_x = 0;
    this.target_y = 0;

    const cursors = this.input.keyboard.createCursorKeys();
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 0.5
    });

    this.input.addPointer();

    this.input.keyboard.on("keydown_W", () => {
      this.actors[0].actions = [{type: "wait", energy: 100}];
    });
    this.input.keyboard.on("keydown_B", () => {
      this.hud.inventory.toggle();
    });
    this.input.keyboard.on("keydown_G", () => {
      this.pickup_item();
    });
    this.input.keyboard.on("keydown_T", () => {
      if (this.input_mode == InputMode.NORMAL) {
        this.enter_target_mode();
      }
      else if (this.input_mode == InputMode.TARGET) {
        this.hud.buttons_base[3].setTexture("UIImages/button_small_up");
        this.input_mode = InputMode.NORMAL;
        this.target_render.visible = false;
      }
      else if (this.input_mode == InputMode.THROW_TGT) {
        console.log("I don't know what to do with throw tgt mode -> target click");
      }
      else {
        console.log("UNKNOWN INPUT MODE!!! " + this.input_mode);
      }
    });
    this.input.keyboard.on("keydown_A", () => {
      this.attack();
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.scrolled = false;
      this.scrolled_x = 0;
      this.scrolled_y = 0;
      this.down_button = -1;
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        let other_pointer = pointer.id == 1 ?  this.input.pointer2 : this.input.pointer1;
        let dx0 = pointer.prevPosition.x - other_pointer.x;
        let dy0 = pointer.prevPosition.y - other_pointer.y;
        let dist0 = Math.sqrt(dx0*dx0 + dy0*dy0);
        let dx1 = pointer.x - other_pointer.x;
        let dy1 = pointer.y - other_pointer.y;
        let dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);

        if (dist1 > dist0) {
          this.setZoom(0.05);
        } else {
          this.setZoom(-0.05);
        }

        return;
      }

      if (!pointer.isDown) {
        return;
      }

      let dx = pointer.x - pointer.prevPosition.x; // () / zoom
      let dy = pointer.y - pointer.prevPosition.y;
      this.cameras.main.scrollX -= dx;
      this.cameras.main.scrollY -= dy;
      this.scrolled = true;
      this.scrolled_x += dx;
      this.scrolled_y += dy;
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.down_button >= 0) {
        this.hud.buttons_base[this.down_button].setTexture("UIImages/button_small_up");
      }

      if (this.scrolled && Math.abs(this.scrolled_x) + Math.abs(this.scrolled_y) > 5) {
        return;
      }

      if (this.hud.inventory.showing) {
        this.hud.inventory.hide();
      } else {
        if (this.input_mode == InputMode.NORMAL) {
          mouse_click_normal(this, pointer, this.cameras.main, this.actors, this.grid);
        }
        else if (this.input_mode == InputMode.TARGET) {
          mouse_click_target(this, pointer);
        }
        else if (this.input_mode == InputMode.THROW_TGT) {
          mouse_click_throw_tgt(this, pointer, this.cameras.main, this.actors, this.grid);
        }
        else {
          console.log("UNIMPLEMNTED INPUT MODE " + this.input_mode);
        }
      }
    });
    this.input.on("wheel", (pointer, objs, dx, dy, dz) => {
      this.setZoom(-dy/1000);
    });

    // ----- UI -----

    this.floating_texts = [];

    this.hud = new HUDScene(this, data.inventory);
    this.scene.add("HUDScene", this.hud, true);
  }

  setZoom(dz: number): void {
    this.cameras.main.setZoom(this.cameras.main.zoom + dz);
    if (this.cameras.main.zoom < MIN_ZOOM) {
      this.cameras.main.setZoom(MIN_ZOOM);
    }
    if (this.cameras.main.zoom > MAX_ZOOM) {
      this.cameras.main.setZoom(MAX_ZOOM);
    }
  }

  create_level_grid(): void {
    let level_width = 40;
    let level_height = 40;

    let tiles = generate_bsp(level_width, level_height);
    this.grid = new TileGrid(tiles, level_width, level_height);
  }

  create_level_textures(): void {
    let tile_name = "prison";
    if (this.level_num <= 10) { tile_name = "prison"; }
    else if (this.level_num <= 20) { tile_name = "dark_lab"; }
    else if (this.level_num <= 30) { tile_name = "armory"; }
    else if (this.level_num <= 40) { tile_name = "advanced_research_facility"; }
    else { tile_name = "executive_offices"; }

    const tilemap = this.make.tilemap({data: this.grid.tiles, tileWidth: 32, tileHeight: 32});
    // note margin/spacing (1/2) are for the extruded image
    const tileset = tilemap.addTilesetImage(
      tile_name + "_tiles_c_e", tile_name + "_tiles_c_e", 32, 32, 1, 2);
    this.grid.vis_layer = tilemap.createDynamicLayer(0, tileset);
  }


  enter_target_mode(): void {
    this.hud.buttons_base[3].setTexture("UIImages/button_small_checked");
    this.input_mode = InputMode.TARGET;
    this.target_render.visible = true;

    let pl_x = this.actors[0].tx;
    let pl_y = this.actors[0].ty;
    let actor = util.closest_actor(this.grid, this.actors, pl_x, pl_y);

    if (actor == null) {
      this.target_x = pl_x + 1;
      this.target_y = pl_y;
    } else {
      this.target_x = actor.tx;
      this.target_y = actor.ty;
    }

    let [rx, ry] = util.tile_to_render_coords(this.target_x, this.target_y);
    this.target_render.x = rx;
    this.target_render.y = ry;
  }


  new_floating_text(text: string, x: number, y: number, style: string, delay = 0) {
    this.floating_texts.push(new FloatingText(this, text, x, y, style, delay));
  }

  attack(): void {
    let weapon = this.hud.inventory.get_weapon();
    let weapon_name = "fist";
    if (weapon != null) {
      weapon_name = weapon.name;
    }

    if (item_stats[weapon_name]["R"]) {
      if (this.input_mode == InputMode.NORMAL) {
        this.enter_target_mode();
      }
      else if (this.input_mode == InputMode.TARGET) {
        initiate_shot(
          this,
          this.actors[0],
          this.target_x,
          this.target_y);
        this.input_mode = InputMode.NORMAL;
        this.hud.buttons_base[3].setTexture("UIImages/button_small_up");
        this.target_render.visible = false;
      }
      else {
        console.log("cannot perform attack, we're in throw mode!!!");
      }
    } else {
      this.melee_attack();
    }
  }

  melee_attack(): void {
    let tx = this.actors[0].tx;
    let ty = this.actors[0].ty;
    let id = null;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx == 0 && dy == 0) {
          continue;
        }

        id = util.actor_at(this.actors, tx + dx, ty + dy);
        if (id != null) {
          break;
        }
      }
      if (id != null) {
        break;
      }
    }

    if (id != null) {
      this.actors[0].actions = [{type: "attack", id: id, energy: 100}];
    }
  }

  pickup_item(): boolean {
    let tx = this.actors[0].tx;
    let ty = this.actors[0].ty;
    let id = util.item_at(this.items, tx, ty);
    if (id != null) {
      if (this.items[id].name == "health_orb") {
        let player = this.actors[0];
        let max_health = player.max_health;
        let heal_amount = Math.round(0.4 * max_health);
        player.health = Math.min(player.health + heal_amount, max_health);

        this.items[id].alive = false;
        this.hud.update_bars();
        this.new_floating_text(heal_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "health");
        return true;
      }
      else if (this.items[id].name == "cognition_orb") {
        let player = this.actors[0];
        let max_cognition = player.max_cognition;
        let cog_amount = Math.round(0.4 * max_cognition);
        player.cognition = Math.min(player.cognition + cog_amount, max_cognition);

        this.items[id].alive = false;
        this.hud.update_bars();
        this.new_floating_text(cog_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "cognition");
        player.update_vision_size();
        this.grid.update_visibility(player.tx, player.ty, player.vision_dist);
        this.update_entity_visibility();
        return true;
      }
      else if (this.items[id].name == "rejuvination_orb") {
        let player = this.actors[0];
        let max_health = player.max_health;
        let heal_amount = Math.round(0.4 * max_health);
        player.health = Math.min(player.health + heal_amount, max_health);

        let max_cognition = player.max_cognition;
        let cog_amount = Math.round(0.4 * max_cognition);
        player.cognition = Math.min(player.cognition + cog_amount, max_cognition);

        this.items[id].alive = false;
        this.hud.update_bars();
        this.new_floating_text(heal_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "health");
        this.new_floating_text(cog_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "cognition", 0.3);
        player.update_vision_size();
        this.grid.update_visibility(player.tx, player.ty, player.vision_dist);
        this.update_entity_visibility();
        return true;
      }
      else {
        if (this.hud.inventory.try_add(this.items[id])) {
          let added = this.items.splice(id, 1);
          return true;
        }
        return false;
      }
    }
  }

  update_entity_visibility() {
    for (let actor of this.actors) {
      actor.update_visible(this.grid);
    }
    for (let item of this.items) {
      item.update_visible(this.grid);
    }
  }

  update(_time: number, delta_ms: number): void {
    // input - note we have a callback defined in create
    this.controls.update(delta_ms)

    // logic
    if (this.projectiles.length == 0) {
      process_turns(this);
    }

    move_actors(this.actors, this.grid, delta_ms);
    move_projectiles(this.projectiles, delta_ms);
    for (let floating_text of this.floating_texts) {
      floating_text.update(delta_ms);
    }

    this.kill_dead_objects();
  }

  kill_dead_objects() {
    for (let actor of this.actors) {
      if (!actor.alive) {
        actor.destroy_textures();
      }
    }
    for (let floating_text of this.floating_texts) {
      if (!floating_text.alive) {
        floating_text.obj.destroy();
      }
    }
    for (let item of this.items) {
      if (!item.alive) {
        item.destroy_textures();
      }
    }
    for (let proj of this.projectiles) {
      if (!proj.alive) {
        proj.destroy_textures();
      }
    }

    this.actors = this.actors.filter((actor: Actor) => { return actor.alive; });
    this.floating_texts = this.floating_texts.filter((ft: FloatingText) => { return ft.alive; });
    this.items = this.items.filter((item: Item) => { return item.alive; });
    this.projectiles = this.projectiles.filter((proj: Projectile) => { return proj.alive; });
  }
}

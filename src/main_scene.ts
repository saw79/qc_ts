import "phaser";

import * as PF from "pathfinding";
import {NinePatch} from "@koreez/phaser3-ninepatch";

import {TILE_SIZE, BUTTONS_DEPTH, HUD_DEPTH} from "./constants";
import {load_all, create_anims} from "./resource_manager";
import {TileGrid} from "./tile_grid";
import {Actor} from "./actor";
import {mouse_click} from "./handle_input";
import {move_actors} from "./movement";
import {process_turns} from "./turn_logic";
import * as util from "./util";
import {FloatingText} from "./floating_text";
import {Item, make_display_name} from "./item";
import * as factory from "./factory";
import {Inventory} from "./inventory";

export class MainScene extends Phaser.Scene {
  controls: Phaser.Cameras.Controls.FixedKeyControl;
  actors: Array<Actor>;
  curr_turn: number;
  grid: TileGrid;
  items: Array<Item>;

  health_comps: Record<string, any>;
  cog_comps: Record<string, any>;

  floating_texts: Array<FloatingText>;

  scrolled: boolean;

  buttons_base: Array<Phaser.GameObjects.Image>;
  buttons_skin: Array<Phaser.GameObjects.Image>;

  inventory: Inventory;

  constructor() {
    super({ key: "MainScene"});
  }

  preload(): void {
    load_all(this);
  }

  create(): void {
    create_anims(this);

    let level_width = 30;
    let level_height = 20;

    this.grid = new TileGrid(level_width, level_height, "test");
    const tilemap = this.make.tilemap({data: this.grid.tiles, tileWidth: 32, tileHeight: 32});
    const tileset = tilemap.addTilesetImage(
      "prison_tiles_extruded", "prison_tiles_extruded", 32, 32, 1, 2);
    this.grid.vis_layer = tilemap.createDynamicLayer(0, tileset);

    // ----- create actors -----

    this.actors = [];

    let player = factory.create_player(this, 1, 1);
    player.camera = this.cameras.main;
    player.camera.centerOn(player.rx, player.ry);
    this.actors.push(player);

    let num_enemies = 10;
    let num_orbs = 10;
    let num_items = 30;

    for (let i = 0; i < num_enemies; i++) {
      let [x, y] = util.rand_tile_no_actor(this);
      this.actors.push(factory.create_random_enemy(this, x, y));
    }

    this.curr_turn = 0;

    // ----- create items -----

    this.items = [];

    for (let i = 0; i < num_orbs; i++) {
      let [x, y] = util.rand_tile_no_item(this);
      this.items.push(factory.create_item(this, "health_orb", x, y));
    }
    for (let i = 0; i < num_orbs; i++) {
      let [x, y] = util.rand_tile_no_item(this);
      this.items.push(factory.create_item(this, "cognition_orb", x, y));
    }
    for (let i = 0; i < num_orbs; i++) {
      let [x, y] = util.rand_tile_no_item(this);
      this.items.push(factory.create_item(this, "rejuvination_orb", x, y));
    }

    for (let i = 0; i < num_items; i++) {
      let [x, y] = util.rand_tile_no_item(this);
      this.items.push(factory.create_random_item(this, x, y));
    }

    // ----- updates -------

    this.grid.update_visibility(1, 1, player.vision_dist);
    this.update_entity_visibility();

    // ----- extras -------

    const cursors = this.input.keyboard.createCursorKeys();
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 0.5
    });

    this.input.keyboard.on("keydown_W", () => {
      this.actors[0].actions = [{type: "wait"}];
    });
    this.input.keyboard.on("keydown_B", () => {
      this.inventory.toggle();
    });
    this.input.keyboard.on("keydown_G", () => {
      this.pickup_item();
    });
    this.input.keyboard.on("keydown_T", () => {
    });
    this.input.keyboard.on("keydown_A", () => {
      this.attack();
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.scrolled = false;
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }

      this.cameras.main.scrollX -= pointer.x - pointer.prevPosition.x; // () / zoom
      this.cameras.main.scrollY -= pointer.y - pointer.prevPosition.y;
      this.scrolled = true;
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.scrolled) {
        if (this.inventory.showing) {
          this.inventory.hide();
        } else {
          mouse_click(this, pointer, this.cameras.main, this.actors, this.grid);
        }
      }
    });

    // ----- UI -----

    // health
    this.health_comps = {};
    this.health_comps["bg"] = this.add.image(0, 0, "health_background");
    this.health_comps["fill"] = this.add.image(0, 0, "health_fill");
    this.health_comps["cover"] = new NinePatch(this, 0, 0, 74, 40, "status_cover", null, {
      top: 0,
      bottom: 0,
      left: 11,
      right: 11
    });
    this.add.existing(this.health_comps["cover"]);

    // cognition
    this.cog_comps = {};
    this.cog_comps["bg"] = this.add.image(0, 0, "health_background");
    this.cog_comps["fill"] = this.add.image(0, 0, "cog_fill");
    this.cog_comps["cover"] = new NinePatch(this, 0, 0, 74, 40, "status_cover", null, {
      top: 0,
      bottom: 0,
      left: 11,
      right: 11
    });
    this.add.existing(this.cog_comps["cover"]);

    for (let key in this.health_comps) {
      this.health_comps[key].y = TILE_SIZE / 2;
      if (key != "cover") {
        this.health_comps[key].displayHeight = TILE_SIZE / 2;
      }
      this.health_comps[key].setScrollFactor(0);
    }
    for (let key in this.cog_comps) {
      this.cog_comps[key].y = TILE_SIZE;
      if (key != "cover") {
        this.cog_comps[key].displayHeight = TILE_SIZE / 2;
      }
      this.cog_comps[key].setScrollFactor(0);
    }

    this.update_bars();

    this.floating_texts = [];

    // ----- buttons ------

    let button_size = 2*TILE_SIZE;
    let pad_size = TILE_SIZE/2;
    let game_width = +(this.game.config.width);
    let hud_width = 5*button_size + 6*pad_size;

    if (game_width < hud_width) {
      console.log("fixing buttons");
      button_size *= game_width/hud_width;
      pad_size *= game_width/hud_width;
    }

    let y = +(this.game.config.height) - pad_size - button_size/2;
    let idx = 0;
    let names = ["wait", "bag", "grab", "target"];
    this.buttons_base = [];
    this.buttons_skin = [];
    for (let i = -2; i <= 2; i++) {
      let x = game_width/2 +  i*(pad_size + button_size);
      let btn_base = this.add.image(x, y, "UIImages/button_small_up");
      btn_base.displayWidth = button_size;
      btn_base.displayHeight = button_size;
      btn_base.depth = BUTTONS_DEPTH;
      btn_base.setScrollFactor(0);
      btn_base.setInteractive()

      btn_base.on('pointerdown', () => {
        btn_base.setTexture("UIImages/button_small_down");
      });

      this.buttons_base.push(btn_base);


      let key = idx < 4 ? "UIImages/btn_" + names[idx] + "_skin" : "fist";
      let btn_skin = this.add.image(x, y, key);
      if (idx < 4) {
        btn_skin.displayWidth = button_size/2;
        btn_skin.displayHeight = button_size/2;
      } else {
        btn_skin.displayWidth = button_size*0.75;
        btn_skin.displayHeight = button_size*0.75;
      }
      btn_skin.depth = BUTTONS_DEPTH + 1;
      btn_skin.setScrollFactor(0);

      this.buttons_skin.push(btn_skin);


      idx += 1;
    }

    this.buttons_base[0].on('pointerup', this.click_wait, this);
    this.buttons_base[1].on('pointerup', this.click_bag, this);
    this.buttons_base[2].on('pointerup', this.click_grab, this);
    this.buttons_base[3].on('pointerup', this.click_target, this);
    this.buttons_base[4].on('pointerup', this.click_attack, this);

    this.inventory = new Inventory(this);
  }

  click_wait(pointer, localX, localY, event) {
    this.actors[0].actions = [{type: "wait"}];
    this.buttons_base[0].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_bag(pointer, localX, localY, event) {
    this.inventory.toggle();
    this.buttons_base[1].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_grab(pointer, localX, localY, event) {
    this.pickup_item();
    this.buttons_base[2].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_target(pointer, localX, localY, event) {
    console.log("target (TODO)");
    this.buttons_base[3].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_attack(pointer, localX, localY, event) {
    this.attack();
    this.buttons_base[4].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  update_bars() {
    let max_width = +(this.game.config.width) - TILE_SIZE;
    const full_width_hps = 50;

    // health
    let hb_w_max = this.actors[0].max_health * max_width / full_width_hps;
    let hb_w_cur = this.actors[0].health * max_width / full_width_hps;

    this.health_comps["bg"].displayWidth = hb_w_max;
    this.health_comps["bg"].x = hb_w_max/2 + TILE_SIZE/2;
    this.health_comps["fill"].displayWidth = hb_w_cur;
    this.health_comps["fill"].x = hb_w_cur/2 + TILE_SIZE/2;
    this.health_comps["cover"].resize(hb_w_max, TILE_SIZE/2);
    this.health_comps["cover"].x = hb_w_max/2 + TILE_SIZE/2;

    // cognition
    let cb_w_max = this.actors[0].max_cognition * max_width / full_width_hps;
    let cb_w_cur = this.actors[0].cognition * max_width / full_width_hps;

    this.cog_comps["bg"].displayWidth = cb_w_max;
    this.cog_comps["bg"].x = cb_w_max/2 + TILE_SIZE/2;
    this.cog_comps["fill"].displayWidth = cb_w_cur;
    this.cog_comps["fill"].x = cb_w_cur/2 + TILE_SIZE/2;
    this.cog_comps["cover"].resize(cb_w_max, TILE_SIZE/2);
    this.cog_comps["cover"].x = cb_w_max/2 + TILE_SIZE/2;
  }

  new_floating_text(text: string, x: number, y: number, style: string, delay = 0) {
    this.floating_texts.push(new FloatingText(this, text, x, y, style, delay));
  }

  attack(): void {
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
      this.actors[0].actions = [{type: "attack", id: id}];
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
        this.update_bars();
        this.new_floating_text(heal_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "health");
        return true;
      }
      else if (this.items[id].name == "cognition_orb") {
        let player = this.actors[0];
        let max_cognition = player.max_cognition;
        let cog_amount = Math.round(0.4 * max_cognition);
        player.cognition = Math.min(player.cognition + cog_amount, max_cognition);

        this.items[id].alive = false;
        this.update_bars();
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
        this.update_bars();
        this.new_floating_text(heal_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "health");
        this.new_floating_text(cog_amount.toString(), player.rx, player.ry - TILE_SIZE/2, "cognition", 0.3);
        player.update_vision_size();
        this.grid.update_visibility(player.tx, player.ty, player.vision_dist);
        this.update_entity_visibility();
        return true;
      }
      else {
        if (this.inventory.try_add(this.items[id])) {
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
    this.curr_turn = process_turns(this, this.actors, this.curr_turn, this.grid);
    move_actors(this.actors, this.grid, delta_ms);
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

    this.actors = this.actors.filter((actor: Actor) => { return actor.alive; });
    this.floating_texts = this.floating_texts.filter((ft: FloatingText) => { return ft.alive; });
    this.items = this.items.filter((item: Item) => { return item.alive; });
  }
}

import "phaser";

import * as PF from "pathfinding";
import {NinePatch} from "@koreez/phaser3-ninepatch";

import {TILE_SIZE} from "./constants";
import {load_all, create_anims} from "./resource_manager";
import {TileGrid} from "./tile_grid";
import {Actor} from "./actor";
import {mouse_click} from "./handle_input";
import {move_actors} from "./movement";
import {process_turns} from "./turn_logic";
import {rand_int, actor_at, item_at} from "./util";
import {FloatingText} from "./floating_text";
import {Item} from "./item";

export class MainScene extends Phaser.Scene {
  controls: Phaser.Cameras.Controls.FixedKeyControl;
  actors: Array<Actor>;
  curr_turn: number;
  grid: TileGrid;
  items: Array<Item>;

  health_comps: Record<string, any>;
  cog_comps: Record<string, any>;

  floating_texts: Array<FloatingText>;

  constructor() {
    super({ key: "MainScene"});
  }

  preload(): void {
    load_all(this);
  }

  create(): void {
    create_anims(this);

    // set scale so there's 14 tiles vertically
    /*
    let curr_tiles = +(this.game.config.height) / TILE_SIZE;
    let aspect = +(this.game.config.width) / +(this.game.config.height);
    let desired_height = +(this.game.config.height) * 14/curr_tiles;
    let desired_width = desired_height * aspect;
    this.scale.setGameSize(desired_width, desired_height);
    */

    let level_width = 30;
    let level_height = 20;

    this.grid = new TileGrid(level_width, level_height, "test");
    const tilemap = this.make.tilemap({data: this.grid.tiles, tileWidth: 32, tileHeight: 32});
    const tileset = tilemap.addTilesetImage(
      "prison_tiles_extruded", "prison_tiles_extruded", 32, 32, 1, 2);
    this.grid.vis_layer = tilemap.createDynamicLayer(0, tileset);

    // ----- create actors -----

    this.actors = [];

    let player = new Actor(this, "player_none", 1, 1);
    player.camera = this.cameras.main;
    player.camera.centerOn(player.rx, player.ry);
    this.actors.push(player);

    let num_enemies = 4;

    for (let i = 0; i < num_enemies; i++) {
      let x = 0;
      let y = 0;
      do {
        x = rand_int(level_width-2) + 1;
        y = rand_int(level_height-2) + 1;
      } while (actor_at(this.actors, x, y) != null);
      let actor = new Actor(this, "prison_guard", x, y);
      this.actors.push(actor);
    }

    this.curr_turn = 0;

    // ----- create items -----

    this.items = [];
    let num_orbs = 6;

    for (let i = 0; i < num_orbs; i++) {
      let x = 0;
      let y = 0;
      do {
        x = rand_int(level_width-2) + 1;
        y = rand_int(level_height-2) + 1;
      } while (item_at(this.items, x, y) != null);
      let orb = new Item(this, "health_orb", x, y);
      orb.render_comp.setScale(0.5);
      orb.render_comp.anims.play(orb.name);
      this.items.push(orb);
    }
    for (let i = 0; i < num_orbs; i++) {
      let x = 0;
      let y = 0;
      do {
        x = rand_int(level_width-2) + 1;
        y = rand_int(level_height-2) + 1;
      } while (item_at(this.items, x, y) != null);
      let orb = new Item(this, "cognition_orb", x, y);
      orb.render_comp.setScale(0.5);
      orb.render_comp.anims.play(orb.name);
      this.items.push(orb);
    }
    for (let i = 0; i < 2; i++) {
      let x = 0;
      let y = 0;
      do {
        x = rand_int(level_width-2) + 1;
        y = rand_int(level_height-2) + 1;
      } while (item_at(this.items, x, y) != null);
      let orb = new Item(this, "rejuvination_orb", x, y);
      orb.render_comp.setScale(0.5);
      orb.render_comp.anims.play(orb.name);
      this.items.push(orb);
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

    // dragstart, dragend
    this.input.keyboard.on("keydown_W", () => {
      this.actors[0].actions = [{type: "wait"}];
    });
    this.input.keyboard.on("keydown_A", () => {
      let tx = this.actors[0].tx;
      let ty = this.actors[0].ty;
      let id = null;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx == 0 && dy == 0) {
            continue;
          }

          id = actor_at(this.actors, tx + dx, ty + dy);
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
    });
    this.input.keyboard.on("keydown_G", () => {
      this.pickup_item();
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      mouse_click(this, pointer, this.cameras.main, this.actors, this.grid);
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
  }

  update_bars() {
    let max_width = +(this.game.config.width) - TILE_SIZE;

    // health
    let hb_w_max = this.actors[0].max_health * max_width / 100;
    let hb_w_cur = this.actors[0].health * max_width / 100;

    this.health_comps["bg"].displayWidth = hb_w_max;
    this.health_comps["bg"].x = hb_w_max/2 + TILE_SIZE/2;
    this.health_comps["fill"].displayWidth = hb_w_cur;
    this.health_comps["fill"].x = hb_w_cur/2 + TILE_SIZE/2;
    this.health_comps["cover"].resize(hb_w_max, TILE_SIZE/2);
    this.health_comps["cover"].x = hb_w_max/2 + TILE_SIZE/2;

    // cognition
    let cb_w_max = this.actors[0].max_cognition * max_width / 100;
    let cb_w_cur = this.actors[0].cognition * max_width / 100;

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

  pickup_item(): boolean {
    let tx = this.actors[0].tx;
    let ty = this.actors[0].ty;
    let id = item_at(this.items, tx, ty);
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
        console.log("unknown item " + this.items[id].name + "!");
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

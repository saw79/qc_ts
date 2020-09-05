import "phaser";

import {NinePatch} from "@koreez/phaser3-ninepatch";

import {TILE_SIZE, BUTTONS_DEPTH, HUD_DEPTH} from "./constants";
import {MainScene, InputMode} from "./main_scene";
import {Inventory} from "./inventory";

export class HUDScene extends Phaser.Scene {
  main_scene: MainScene;

  health_comps: Record<string, any>;
  cog_comps: Record<string, any>;

  buttons_base: Array<Phaser.GameObjects.Image>;
  buttons_skin: Array<Phaser.GameObjects.Image>;

  inventory: Inventory;

  constructor(main_scene: MainScene, inventory: Inventory) {
    super({ key: "HUDScene" });
    this.main_scene = main_scene;
    this.inventory = inventory;
  }

  preload(): void {
  }

  create(): void {
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
      this.health_comps[key].depth = HUD_DEPTH;
    }
    for (let key in this.cog_comps) {
      this.cog_comps[key].y = TILE_SIZE;
      if (key != "cover") {
        this.cog_comps[key].displayHeight = TILE_SIZE / 2;
      }
      this.cog_comps[key].setScrollFactor(0);
      this.cog_comps[key].depth = HUD_DEPTH;
    }

    this.update_bars();

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

    this.buttons_base[0].on('pointerdown', (p,lx,ly,ev) => {
      this.buttons_base[0].setTexture("UIImages/button_small_down");
      this.main_scene.down_button = 0;
      ev.stopPropagation();
    });
    this.buttons_base[1].on('pointerdown', (p,lx,ly,ev) => {
      this.buttons_base[1].setTexture("UIImages/button_small_down");
      this.main_scene.down_button = 1;
      ev.stopPropagation();
    });
    this.buttons_base[2].on('pointerdown', (p,lx,ly,ev) => {
      this.buttons_base[2].setTexture("UIImages/button_small_down");
      this.main_scene.down_button = 2;
      ev.stopPropagation();
    });
    this.buttons_base[3].on('pointerdown', (p,lx,ly,ev) => {
      this.buttons_base[3].setTexture("UIImages/button_small_down");
      this.main_scene.down_button = 3;
      ev.stopPropagation();
    });
    this.buttons_base[4].on('pointerdown', (p,lx,ly,ev) => {
      this.buttons_base[4].setTexture("UIImages/button_small_down");
      this.main_scene.down_button = 4;
      ev.stopPropagation();
    });
    this.buttons_base[0].on('pointerup', this.click_wait, this);
    this.buttons_base[1].on('pointerup', this.click_bag, this);
    this.buttons_base[2].on('pointerup', this.click_grab, this);
    this.buttons_base[3].on('pointerup', this.click_target, this);
    this.buttons_base[4].on('pointerup', this.click_attack, this);

    if (this.inventory == undefined || this.inventory == null) {
      this.inventory = new Inventory(this.main_scene);
    } else {
      this.inventory.init_textures(this.main_scene);
    }
  }

  update_bars() {
    let max_width = +(this.game.config.width) - TILE_SIZE;
    const full_width_hps = 50;

    let player = this.main_scene.actors[0];

    // health
    let hb_w_max = player.max_health * max_width / full_width_hps;
    let hb_w_cur = player.health * max_width / full_width_hps;

    this.health_comps["bg"].displayWidth = hb_w_max;
    this.health_comps["bg"].x = hb_w_max/2 + TILE_SIZE/2;
    this.health_comps["fill"].displayWidth = hb_w_cur;
    this.health_comps["fill"].x = hb_w_cur/2 + TILE_SIZE/2;
    this.health_comps["cover"].resize(hb_w_max, TILE_SIZE/2);
    this.health_comps["cover"].x = hb_w_max/2 + TILE_SIZE/2;

    // cognition
    let cb_w_max = player.max_cognition * max_width / full_width_hps;
    let cb_w_cur = player.cognition * max_width / full_width_hps;

    this.cog_comps["bg"].displayWidth = cb_w_max;
    this.cog_comps["bg"].x = cb_w_max/2 + TILE_SIZE/2;
    this.cog_comps["fill"].displayWidth = cb_w_cur;
    this.cog_comps["fill"].x = cb_w_cur/2 + TILE_SIZE/2;
    this.cog_comps["cover"].resize(cb_w_max, TILE_SIZE/2);
    this.cog_comps["cover"].x = cb_w_max/2 + TILE_SIZE/2;
  }

  click_wait(pointer, localX, localY, event) {
    if (this.main_scene.down_button < 0) {
      return;
    }
    this.main_scene.actors[0].actions = [{type: "wait", energy: 100}];
    this.buttons_base[0].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_bag(pointer, localX, localY, event) {
    if (this.main_scene.down_button < 0) {
      return;
    }
    this.inventory.toggle();
    this.buttons_base[1].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_grab(pointer, localX, localY, event) {
    if (this.main_scene.down_button < 0) {
      return;
    }
    this.main_scene.pickup_item();
    this.buttons_base[2].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }

  click_target(pointer, localX, localY, event) {
    if (this.main_scene.down_button < 0) {
      return;
    }
    if (this.main_scene.input_mode == InputMode.NORMAL) {
      this.main_scene.enter_target_mode();
    }
    else if (this.main_scene.input_mode == InputMode.TARGET) {
      this.buttons_base[3].setTexture("UIImages/button_small_up");
      this.main_scene.input_mode = InputMode.NORMAL;
      this.main_scene.target_render.visible = false;
    }
    else if (this.main_scene.input_mode == InputMode.THROW_TGT) {
      console.log("I don't know what to do with throw tgt mode -> target click");
    }
    else {
      console.log("UNKNOWN INPUT MODE!!! " + this.main_scene.input_mode);
    }

    event.stopPropagation();
  }

  click_attack(pointer, localX, localY, event) {
    if (this.main_scene.down_button < 0) {
      return;
    }
    this.main_scene.attack();

    this.buttons_base[4].setTexture("UIImages/button_small_up");
    event.stopPropagation();
  }
}

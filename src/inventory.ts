import {MainScene} from "./main_scene";
import {TILE_SIZE, INV_DEPTH} from "./constants";
import {Item, ItemType} from "./item";
import {item_stats} from "./stats";

const EQUIP_ROWS: number = 2
const INV_ROWS: number = 5
const COLS: number = 4;

export class Inventory {
  scene: MainScene;
  equip_bgs: Array<Array<Phaser.GameObjects.Image>>;
  inv_bgs: Array<Array<Phaser.GameObjects.Image>>;
  equip_items: Array<Array<null | Item>>;
  inv_items: Array<Array<null | Item>>;
  showing: boolean;

  selected: null | [number, number, boolean];

  x0: number;
  y0: number;
  slot_size: number;
  menu_w: number;
  menu_h: number;

  menu_bg: Phaser.GameObjects.Image;
  menu_label: Phaser.GameObjects.Text;
  menu_buttons: Record<string, [Phaser.GameObjects.Image, Phaser.GameObjects.Text]>;

  constructor(scene: MainScene) {
    this.scene = scene;
    let width = +(scene.game.config.width);
    let height = +(scene.game.config.height);

    this.x0 = TILE_SIZE/2;
    this.y0 = TILE_SIZE*2.5;

    let max_slot_width = Math.round((width - 2*this.x0) / COLS);
    let max_slot_height = Math.round((height - this.y0 - 3*TILE_SIZE) / (EQUIP_ROWS+INV_ROWS));

    this.slot_size = TILE_SIZE*2;
    this.slot_size = Math.min(this.slot_size, max_slot_width);
    this.slot_size = Math.min(this.slot_size, max_slot_height);

    let x: number;
    let y: number;
    this.equip_bgs = new Array(EQUIP_ROWS);
    this.equip_items = new Array(EQUIP_ROWS);
    for (let r = 0; r < EQUIP_ROWS; r++) {
      this.equip_bgs[r] = new Array(COLS);
      this.equip_items[r] = new Array(COLS);
      for (let c = 0; c < COLS; c++) {
        [x, y] = this.rc2xy(r, c);

        let bg = scene.add.image(x, y, "UIImages/btn_equipped_up");
        bg.displayWidth = this.slot_size;
        bg.displayHeight = this.slot_size;
        bg.visible = false;
        bg.setScrollFactor(0);
        bg.depth = INV_DEPTH;

        bg.setInteractive();
        bg.on('pointerup', (p, lx, ly, ev) => {
          this.click_equip(r, c);
          ev.stopPropagation();
        }, this);

        this.equip_bgs[r][c] = bg;

        this.equip_items[r][c] = null;
      }
    }

    this.inv_bgs = new Array(INV_ROWS);
    this.inv_items = new Array(INV_ROWS);
    for (let r = 0; r < INV_ROWS; r++) {
      this.inv_bgs[r] = new Array(COLS);
      this.inv_items[r] = new Array(COLS);
      for (let c = 0; c < COLS; c++) {
        [x, y] = this.rc2xy(r + 2, c);

        let bg = scene.add.image(x, y, "UIImages/btn_inventory_up");
        bg.displayWidth = this.slot_size;
        bg.displayHeight = this.slot_size;
        bg.visible = false;
        bg.setScrollFactor(0);
        bg.depth = INV_DEPTH;

        bg.setInteractive();
        bg.on('pointerup', (p, lx, ly, ev) => {
          this.click_inv(r, c);
          ev.stopPropagation();
        }, this);

        this.inv_bgs[r][c] = bg;

        this.inv_items[r][c] = null;
      }
    }

    this.showing = false;
    this.selected = null;

    this.menu_w = this.slot_size * 2;
    this.menu_h = this.slot_size / 2;

    this.menu_bg = scene.add.image(0, 0, "UIImages/label_bg");
    this.menu_bg.visible = false;
    this.menu_bg.setScrollFactor(0);
    this.menu_bg.depth = INV_DEPTH + 2;

    this.menu_label = scene.add.text(0, 0, "");
    this.menu_label.visible = false;
    this.menu_label.setScrollFactor(0);
    this.menu_label.depth = INV_DEPTH + 3;
    this.menu_label.setColor("yellow");

    this.menu_buttons = {
      "equip": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Equip")],
      "unequip": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Unequip")],
      "use": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Use")],
      "throw": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Throw")],
      "drop": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Drop")],
      "info": [
        scene.add.image(0, 0, "UIImages/button_wide_up"),
        scene.add.text(0, 0, "Info")],
    };

    for (let key in this.menu_buttons) {
      this.menu_buttons[key][0].displayWidth = this.menu_w;
      this.menu_buttons[key][0].displayHeight = this.menu_h;
      this.menu_buttons[key][0].visible = false;
      this.menu_buttons[key][0].setScrollFactor(0);
      this.menu_buttons[key][0].depth = INV_DEPTH + 3;

      this.menu_buttons[key][0].setInteractive();

      this.menu_buttons[key][0].on("pointerdown", (p, lx, ly, ev) => {
        this.menu_buttons[key][0].setTexture("UIImages/button_wide_down");
        ev.stopPropagation();
      }, this);

      if (key == "equip") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_equip();
          ev.stopPropagation();
        }, this);
      }
      else if (key == "unequip") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_unequip();
          ev.stopPropagation();
        }, this);
      }
      else if (key == "use") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_use();
          ev.stopPropagation();
        }, this);
      }
      else if (key == "throw") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_throw();
          ev.stopPropagation();
        }, this);
      }
      else if (key == "drop") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_drop();
          ev.stopPropagation();
        }, this);
      }
      else if (key == "info") {
        this.menu_buttons[key][0].on("pointerup", (p, lx, ly, ev) => {
          this.menu_buttons[key][0].setTexture("UIImages/button_wide_up");
          this.menu_info();
          ev.stopPropagation();
        }, this);
      }
      else {
        console.log("UNIMPLEMENTED MENU BUTTON " + key);
      }

      this.menu_buttons[key][1].visible = false;
      this.menu_buttons[key][1].setScrollFactor(0);
      this.menu_buttons[key][1].depth = INV_DEPTH + 3;
      this.menu_buttons[key][1].setAlign("center");
      this.menu_buttons[key][1].setColor("yellow");
    }
  }

  try_add(item: Item): boolean {
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.inv_items[r][c] == null) {
          this.inv_items[r][c] = item;
          let [x, y] = this.rc2xy(r + 2, c);
          item.render_comp.x = x;
          item.render_comp.y = y;
          item.render_comp.setScrollFactor(0);
          item.render_comp.depth = INV_DEPTH + 1;
          item.render_comp.visible = this.showing;

          return true;
        }
      }
    }

    return false;
  }

  click_equip(r: number, c: number): void {
    if (this.selected != null) {
      this.unselect_all();
    } else {
      this.select_equip(r, c);
    }
  }

  click_inv(r: number, c: number): void {
    if (this.selected != null) {
      this.unselect_all();
    } else {
      this.select_inv(r, c);
    }
  }

  select_equip(r: number, c: number): void {
    if (this.equip_items[r][c] == null) {
      return;
    }

    this.equip_bgs[r][c].setTexture("UIImages/btn_equipped_checked");
    this.selected = [r, c, true];

    let menu_button_names = [];
    menu_button_names.push("unequip");
    menu_button_names.push("throw");
    menu_button_names.push("drop");
    menu_button_names.push("info");

    let [x0, y0] = this.rc2xy(r, c);
    x0 += this.slot_size/2;
    y0 -= this.slot_size/2;

    let bg_w = this.menu_w;
    let bg_h = this.menu_h * (menu_button_names.length + 1);

    this.menu_bg.x = x0 + bg_w/2;
    this.menu_bg.y = y0 + bg_h/2;
    this.menu_bg.displayWidth = bg_w;
    this.menu_bg.displayHeight = bg_h;
    this.menu_bg.visible = true;

    this.menu_label.text = this.equip_items[r][c].display_name;
    this.menu_label.x = x0 + 5;
    this.menu_label.y = y0 + 10;
    this.menu_label.visible = true;

    for (let i = 0; i < menu_button_names.length; i++) {
      let key = menu_button_names[i];
      this.menu_buttons[key][0].x = x0 + this.menu_w/2;
      this.menu_buttons[key][0].y = y0 + this.menu_h/2 + (i+1)*this.menu_h;
      this.menu_buttons[key][0].visible = true;

      this.menu_buttons[key][1].x = x0 + this.menu_w/2;
      this.menu_buttons[key][1].y = y0 + this.menu_h/2 + (i+1)*this.menu_h;
      this.menu_buttons[key][1].x -= this.menu_buttons[key][1].displayWidth/2;
      this.menu_buttons[key][1].y -= this.menu_buttons[key][1].displayHeight/2;
      this.menu_buttons[key][1].visible = true;
    }

  }

  select_inv(r: number, c: number): void {
    if (this.inv_items[r][c] == null) {
      return;
    }

    this.inv_bgs[r][c].setTexture("UIImages/btn_inventory_checked");
    this.selected = [r, c, false];

    let menu_button_names = [];
    if (this.inv_items[r][c].equippable) {
      menu_button_names.push("equip");
    }
    if (this.inv_items[r][c].usable) {
      menu_button_names.push("use");
    }
    menu_button_names.push("throw");
    menu_button_names.push("drop");
    menu_button_names.push("info");

    let [x0, y0] = this.rc2xy(r + 2, c);
    x0 += this.slot_size/2;
    y0 -= this.slot_size/2;

    let bg_w = this.menu_w;
    let bg_h = this.menu_h * (menu_button_names.length + 1);

    this.menu_bg.x = x0 + bg_w/2;
    this.menu_bg.y = y0 + bg_h/2;
    this.menu_bg.displayWidth = bg_w;
    this.menu_bg.displayHeight = bg_h;
    this.menu_bg.visible = true;

    this.menu_label.text = this.inv_items[r][c].display_name;
    this.menu_label.x = x0 + 5;
    this.menu_label.y = y0 + 10;
    this.menu_label.visible = true;

    for (let i = 0; i < menu_button_names.length; i++) {
      let key = menu_button_names[i];
      this.menu_buttons[key][0].x = x0 + this.menu_w/2;
      this.menu_buttons[key][0].y = y0 + this.menu_h/2 + (i+1)*this.menu_h;
      this.menu_buttons[key][0].visible = true;

      this.menu_buttons[key][1].x = x0 + this.menu_w/2;
      this.menu_buttons[key][1].y = y0 + this.menu_h/2 + (i+1)*this.menu_h;
      this.menu_buttons[key][1].x -= this.menu_buttons[key][1].displayWidth/2;
      this.menu_buttons[key][1].y -= this.menu_buttons[key][1].displayHeight/2;
      this.menu_buttons[key][1].visible = true;
    }
  }

  unselect_all(): void {
    for (let r = 0; r < EQUIP_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.equip_bgs[r][c].setTexture("UIImages/btn_equipped_up");
      }
    }
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.inv_bgs[r][c].setTexture("UIImages/btn_inventory_up");
      }
    }
    this.selected = null;

    this.menu_bg.visible = false;
    this.menu_label.visible = false;
    for (let key in this.menu_buttons) {
      this.menu_buttons[key][0].visible = false;
      this.menu_buttons[key][1].visible = false;
    }
  }

  menu_equip(): void {
    if (this.selected == null) {
      console.log("E - shouldn't get here, equipping unselected?");
      return;
    }

    let [ri, ci, is_equip] = this.selected;
    if (is_equip) {
      console.log("uniequp no tyet implemented");
      return;
    }

    let re: number;
    let ce: number;

    if (this.inv_items[ri][ci].type == ItemType.WEAPON) {
      [re, ce] = [0, 0];
    }
    else if (this.inv_items[ri][ci].type == ItemType.ARMOR) {
      [re, ce] = [0, 1];
    }
    else {
      console.log("item type " + this.inv_items[ri][ci].type + " equip not implemented");
      return;
    }

    let prev = null;
    if (this.equip_items[re][ce] != null) {
      prev = this.equip_items[re][ce];
    }

    this.equip_items[re][ce] = this.inv_items[ri][ci];
    this.inv_items[ri][ci] = prev;
    let [xe, ye] = this.rc2xy(re, ce);
    this.equip_items[re][ce].render_comp.x = xe;
    this.equip_items[re][ce].render_comp.y = ye;

    if (prev != null) {
      let [xi, yi] = this.rc2xy(ri + 2, ci);
      this.inv_items[ri][ci].render_comp.x = xi;
      this.inv_items[ri][ci].render_comp.y = yi;
    }

    this.unselect_all();
    this.hide_menu();

    if (this.equip_items[re][ce].type == ItemType.WEAPON) {
      let weapon_name = this.equip_items[re][ce].name;

      this.scene.actors[0].damage = item_stats[weapon_name]["D"];
      this.scene.actors[0].damage_std = item_stats[weapon_name]["S"];

      this.scene.buttons_skin[4].setTexture(weapon_name);
    }
    else if (this.equip_items[re][ce].type == ItemType.ARMOR) {
      let armor_name = this.equip_items[re][ce].name;

      this.scene.actors[0].name = "player_" + armor_name;
      this.scene.actors[0].render_comp.destroy();
      this.scene.actors[0].render_comp = this.scene.add.sprite(
        this.scene.actors[0].rx, this.scene.actors[0].ry,
        "player_" + armor_name);

      this.scene.actors[0].absorption = item_stats[armor_name]["A"];
    }
  }

  menu_unequip(): void {
    console.log("menu unequip");
  }

  menu_use(): void {
    console.log("menu use");
  }

  menu_throw(): void {
    console.log("menu throw");
  }

  menu_drop(): void {
    console.log("menu drop");
  }

  menu_info(): void {
    console.log("menu info");
  }

  hide_menu(): void {
    this.menu_bg.visible = false;
    this.menu_label.visible = false;
    for (let key in this.menu_buttons) {
      this.menu_buttons[key][0].visible = false;
      this.menu_buttons[key][1].visible = false;
    }
  }

  toggle(): void {
    if (this.showing) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    for (let r = 0; r < EQUIP_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.equip_bgs[r][c].visible = true;
        if (this.equip_items[r][c] != null) {
          this.equip_items[r][c].render_comp.visible = true;
        }
      }
    }
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.inv_bgs[r][c].visible = true;
        if (this.inv_items[r][c] != null) {
          this.inv_items[r][c].render_comp.visible = true;
        }
      }
    }

    this.showing = true;
  }

  hide(): void {
    for (let r = 0; r < EQUIP_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.equip_bgs[r][c].visible = false;
        if (this.equip_items[r][c] != null) {
          this.equip_items[r][c].render_comp.visible = false;
        }
      }
    }
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.inv_bgs[r][c].visible = false;
        if (this.inv_items[r][c] != null) {
          this.inv_items[r][c].render_comp.visible = false;
        }
      }
    }

    this.showing = false;
    this.unselect_all();
  }

  rc2xy(r: number, c: number): [number, number] {
    let x = c*this.slot_size + (this.slot_size/2) + this.x0;
    let y = r*this.slot_size + (this.slot_size/2) + this.y0;

    return [x, y];
  }

  xy2rc(x: number, y: number): [number, number] {
    let c = (x - this.x0 - this.slot_size/2) / this.slot_size;
    let r = (y - this.y0 - this.slot_size/2) / this.slot_size;
    c = Math.floor(c);
    r = Math.floor(r);

    return [r, c];
  }
}

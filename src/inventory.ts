import {MainScene} from "./main_scene";
import {TILE_SIZE, INV_DEPTH} from "./constants";
import {Item} from "./item";

const EQUIP_ROWS: number = 2
const INV_ROWS: number = 5
const COLS: number = 4;

export class Inventory {
  equip_bgs: Array<Array<Phaser.GameObjects.Image>>;
  inv_bgs: Array<Array<Phaser.GameObjects.Image>>;
  equip_items: Array<Array<null | Item>>;
  inv_items: Array<Array<null | Item>>;
  showing: boolean;

  x0: number;
  y0: number;
  slot_size: number;

  constructor(scene: MainScene) {
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

        this.inv_bgs[r][c] = bg;

        this.inv_items[r][c] = null;
      }
    }

    this.showing = false;
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
          item.on_ground = false;

          return true;
        }
      }
    }

    return false;
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

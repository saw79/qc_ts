import {MainScene} from "./main_scene";
import {TILE_SIZE, ITEM_DEPTH, MINE_RADIUS} from "./constants";
import {tile_to_render_coords, make_display_name} from "./util";
import {TileGrid, Visibility} from "./tile_grid";

export enum ItemType {
  ORB,
  WEAPON,
  ARMOR,
  GLOVES,
  BOOTS,
  ABILITY_CHIP,
  MATERIAL,
}

export class Item {
  name: string;
  tx: number;
  ty: number;
  rx: number;
  ry: number;
  alive: boolean;

  render_comp: any;
  sub_textures: Array<Phaser.GameObjects.Image>;

  type: ItemType;

  equippable: boolean;
  usable: boolean;

  display_name: string;

  active: boolean;
  triggered: boolean;
  turns_left: number;

  constructor(scene: MainScene, name: string, x: number, y: number) {
    this.name = name;
    this.tx = x;
    this.ty = y;
    this.alive = true;

    this.init_textures(scene);

    this.equippable = false;
    this.usable = false;
    
    this.display_name = make_display_name(this.name);

    this.active = false;
    this.triggered = false;

    if (this.name.indexOf("mine") != -1) {
      this.display_name = this.display_name.substring(0, this.display_name.length-1);
      this.display_name = this.display_name.split(" ").reverse().join(" ");
    }
  }

  init_textures(scene: MainScene): void {
    [this.rx, this.ry] = tile_to_render_coords(this.tx, this.ty);
    this.render_comp = scene.add.sprite(this.rx, this.ry, this.name);
    this.render_comp.depth = ITEM_DEPTH;
    this.render_comp.setScale(0.5);

    if (this.name.indexOf("orb") != -1) {
      this.render_comp.anims.play(this.name);
    }

    this.sub_textures = [];

    if (this.name.indexOf("mine") != -1) {
      let circle = scene.add.image(this.rx, this.ry, "mine_circle");
      circle.depth = ITEM_DEPTH - 1;
      circle.alpha = 0.5;
      circle.visible = false;
      let size = (MINE_RADIUS*2 + 1)*TILE_SIZE;
      circle.setDisplaySize(size, size);
      this.sub_textures.push(circle);
    }
  }

  update_visible(grid: TileGrid): void {
    if (grid.get_visibility(this.tx, this.ty) != Visibility.UNSEEN) {
      this.render_comp.visible = true;
    } else {
      this.render_comp.visible = false;
    }
  }

  destroy_textures(): void {
    this.render_comp.destroy();
    for (let subtex of this.sub_textures) {
      subtex.destroy();
    }
  }
}


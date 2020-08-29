import {ITEM_DEPTH} from "./constants";
import {tile_to_render_coords} from "./util";
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

  type: ItemType;

  equippable: boolean;
  usable: boolean;

  display_name: string;

  constructor(scene: Phaser.Scene, name: string, x: number, y: number) {
    this.name = name;
    this.tx = x;
    this.ty = y;
    [this.rx, this.ry] = tile_to_render_coords(x, y);
    this.alive = true;

    this.render_comp = scene.add.sprite(this.rx, this.ry, name);
    this.render_comp.depth = ITEM_DEPTH;

    this.equippable = false;
    this.usable = false;
    
    this.display_name = make_display_name(this.name);
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
  }
}

export function make_display_name(name: string): string {
  let words = name.replace(/_/g, " ").split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  return words.join(" ");
}

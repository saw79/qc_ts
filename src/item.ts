import {tile_to_render_coords} from "./util";
import {TileGrid, Visibility} from "./tile_grid";

export class Item {
  name: string;
  tx: number;
  ty: number;
  rx: number;
  ry: number;
  alive: boolean;

  render_comp: any;

  on_ground: boolean;

  constructor(scene: Phaser.Scene, name: string, x: number, y: number) {
    this.name = name;
    this.tx = x;
    this.ty = y;
    [this.rx, this.ry] = tile_to_render_coords(x, y);
    this.alive = true;

    this.render_comp = scene.add.sprite(this.rx, this.ry, name);
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

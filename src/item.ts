import {tile_to_render_coords} from "./util";

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

  destroy_textures(): void {
    this.render_comp.destroy();
  }
}

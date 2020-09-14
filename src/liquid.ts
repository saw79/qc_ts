import "phaser";

import {MainScene} from "./main_scene";
import {tile_to_render_coords} from "./util";
import {LIQUID_DEPTH, GAS_DURATION} from "./constants";

export enum LiquidColor {
  GREY,
  RED,
  BLUE,
  YELLOW,
  GREEN,
}

export class Liquid {
  tx: number;
  ty: number;
  alive: boolean;
  color: LiquidColor;
  frame_num: number;
  rotate: number;
  render_comp: Phaser.GameObjects.Image;

  constructor(scene: MainScene, x: number, y: number, color: LiquidColor, frame_num: number, rotate: number) {
    this.tx = x;
    this.ty = y;
    this.alive = true;
    this.color = color;
    this.frame_num = frame_num;
    this.rotate = rotate;
    this.init_textures(scene);
  }

  init_textures(scene: MainScene): void {
    let sheet_name = "_liquid_sheet";
    switch (this.color) {
      case LiquidColor.GREY: sheet_name = "grey" + sheet_name; break;
      case LiquidColor.RED: sheet_name = "red" + sheet_name; break;
      case LiquidColor.BLUE: sheet_name = "blue" + sheet_name; break;
      case LiquidColor.YELLOW: sheet_name = "yellow" + sheet_name; break;
      case LiquidColor.GREEN: sheet_name = "green" + sheet_name; break;
    }
    let [rx, ry] = tile_to_render_coords(this.tx, this.ty);
    this.render_comp = scene.add.image(rx, ry, sheet_name, this.frame_num);
    this.render_comp.alpha = 0.6;
    this.render_comp.depth = LIQUID_DEPTH;
    this.render_comp.setScale(0.5);
    this.render_comp.setRotation(this.rotate);
  }

  destroy_textures(): void {
    this.render_comp.destroy();
  }
}

export class Gas {
  tx: number;
  ty: number;
  alive: boolean;
  particles: Phaser.GameObjects.Particles.ParticleEmitterManager;

  duration: number;
  curr_turn: number;

  constructor(scene: MainScene, x: number, y: number) {
    this.tx = x;
    this.ty = y;
    this.alive = true;
    this.duration = GAS_DURATION;
    this.curr_turn = 0;
    this.init_textures(scene);
  }

  init_textures(scene: MainScene): void {
    let [rx, ry] = tile_to_render_coords(this.tx, this.ty);

    this.particles = scene.add.particles("smoke");
    this.particles.createEmitter({
      x: rx,
      y: ry,
      scale: 0.2,
      speed: 10,
      lifespan: 500,
      frequency: 50,
      blendMode: "ADD"
    });
  }

  tick(): void {
    this.curr_turn++;
    if (this.curr_turn >= this.duration) {
      this.alive = false;
    }
  }

  destroy_textures(): void {
    this.particles.destroy();
  }
}

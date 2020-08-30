import {THROW_SPEED, BULLET_SPEED, ITEM_DEPTH} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {Item} from "./item";
import {damage_actor} from "./combat_logic";

export class Projectile {
  scene: MainScene;
  item: Item | null;
  dest_actor: Actor | null;
  rx0: number;
  ry0: number;
  rx1: number;
  ry1: number;
  speed: number;
  render_comp: any;
  alive: boolean;

  constructor(
    scene: MainScene,
    item: Item | null,
    rx0: number, ry0: number,
    rx1: number, ry1: number
  ) {
    this.scene = scene;
    this.item = item;
    this.dest_actor = null;
    this.rx0 = rx0;
    this.ry0 = ry0;
    this.rx1 = rx1;
    this.ry1 = ry1;
    this.speed = item == null ? BULLET_SPEED : THROW_SPEED;

    if (item != null) {
      this.render_comp = item.render_comp;
    } else {
      console.log("UNIMPLEMENTED: projectile render comp");
    }

    this.render_comp.x = this.rx0;
    this.render_comp.y = this.ry0;
    this.render_comp.setScrollFactor(1);
    this.render_comp.visible = true;

    this.alive = true;
  }

  move(rx: number, ry: number, is_done: boolean): void {
    this.rx0 = rx;
    this.ry0 = ry;
    this.render_comp.x = rx;
    this.render_comp.y = ry;

    if (is_done) {
      this.alive = false;

      if (this.item != null) {
        this.item.render_comp.depth = ITEM_DEPTH;
        this.item.rx = rx;
        this.item.ry = ry;

        if (this.dest_actor != null) {
          damage_actor(this.scene, this.dest_actor, 1, this.dest_actor.is_player);
        }
      }
      else {
        console.log("bullet projectile termination not yet implemented");
      }
    }
  }

  destroy_textures(): void {
  }
}


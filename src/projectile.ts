import {THROW_SPEED, BULLET_SPEED, ITEM_DEPTH} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {Item} from "./item";
import {calc_combat, damage_actor} from "./combat_logic";
import {line, line_to_wall} from "./bresenham";
import {tile_to_render_coords, actor_at} from "./util";
import {TileType} from "./tile_grid";

export class Projectile {
  scene: MainScene;
  item: Item | null;
  src_actor: Actor | null;
  dst_actor: Actor | null;
  rx0: number;
  ry0: number;
  rx1: number;
  ry1: number;
  speed: number;
  render_comp: Phaser.GameObjects.Image;
  alive: boolean;
  proj_texture: string;

  constructor(
    scene: MainScene,
    item: Item | null,
    rx0: number, ry0: number,
    rx1: number, ry1: number,
    proj_texture: string | null = null,
  ) {
    this.scene = scene;
    this.item = item;
    this.src_actor = null;
    this.dst_actor = null;
    this.rx0 = rx0;
    this.ry0 = ry0;
    this.rx1 = rx1;
    this.ry1 = ry1;
    this.speed = item == null ? BULLET_SPEED : THROW_SPEED;
    this.proj_texture = proj_texture;

    if (item != null) {
      this.render_comp = item.render_comp;
    } else {
      if (proj_texture == null) {
        console.log("ERROR - Projectile constructor either needs item or proj_texture");
        console.log("FATAL");
      }
      this.render_comp = scene.add.image(rx0, ry0, proj_texture);
      if (proj_texture == "bullet") {
        this.render_comp.setScale(0.5);
      }
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
      this.stop(rx, ry);
    }
  }

  stop(rx: number, ry: number): void {
    this.alive = false;

    if (this.item != null) {
      this.item.render_comp.depth = ITEM_DEPTH;
      this.item.rx = rx;
      this.item.ry = ry;

      if (this.dst_actor != null) {
        damage_actor(this.scene, this.dst_actor, 1);
      }
    }
    else {
      if (this.src_actor == null) {
        console.log("FATAL ERROR - projectile bullet stopping but no src actor");
      }

      if (this.dst_actor != null) {
        calc_combat(this.scene, this.src_actor, this.dst_actor);
      }
    }
  }

  destroy_textures(): void {
    if (this.proj_texture != null) {
      this.render_comp.destroy();
    }
  }
}

export function initiate_throw(
  scene: MainScene,
  pl_x: number,
  pl_y: number,
  tgt_x: number,
  tgt_y: number
): void {
  let pts = line(pl_x, pl_y, tgt_x, tgt_y);
  let dest = pts[pts.length-1];
  let dst_actor = null;

  for (let pt of pts) {
    let da_idx = actor_at(scene.actors, pt[0], pt[1]);
    if (da_idx != null && da_idx > 0.1) {
      dest = pt;
      dst_actor = scene.actors[da_idx];
      break;
    }

    let tile = scene.grid.at(pt[0], pt[1]);
    if (tile == TileType.WALL || tile == TileType.DOORCLOSED) {
      dest = pt;
      break;
    }
  }

  let [r, c, is_equip] = scene.inventory.throw_select;
  let item = scene.inventory.remove_item(r, c, is_equip);
  let [dest_rx, dest_ry] = tile_to_render_coords(dest[0], dest[1]);

  let proj = new Projectile(scene, item, scene.actors[0].rx, scene.actors[0].ry, dest_rx, dest_ry);
  proj.dst_actor = dst_actor;
  scene.projectiles.push(proj);

  if (item == null) {
    console.log("ERROR - initiating throw but item is null!");
  }

  item.tx = dest[0];
  item.ty = dest[1];
  scene.items.push(item);

  if (is_equip) {
    if (r == 0 && c == 0) {
      scene.inventory.unequip_weapon();
    }
    else if (r == 0 && c == 1) {
      scene.inventory.unequip_armor();
    }
    else {
      console.log("UNIMPLEMNTED UNEQUIP r/c = " + r + ", " + c);
    }
  }

  scene.actors[0].energy -= 100;
}

export function initiate_shot(
  scene: MainScene,
  src_actor: Actor,
  tgt_x: number,
  tgt_y: number
): void {
  //let pts = line(src_actor.tx, src_actor.ty, tgt_x, tgt_y);
  let pts = line_to_wall(scene.grid, src_actor.tx, src_actor.ty, tgt_x, tgt_y);
  pts = pts.slice(1);
  let dest = pts[pts.length-1];
  let dst_actor = null;

  for (let pt of pts) {
    let da_idx = actor_at(scene.actors, pt[0], pt[1]);
    if (da_idx != null) {
      dest = pt;
      dst_actor = scene.actors[da_idx];
      break;
    }

    let tile = scene.grid.at(pt[0], pt[1]);
    if (tile == TileType.WALL || tile == TileType.DOORCLOSED) {
      dest = pt;
      break;
    }
  }

  let [dest_rx, dest_ry] = tile_to_render_coords(dest[0], dest[1]);

  let proj_texture = "bullet";
  let weapon = scene.inventory.get_weapon();
  let weapon_name = weapon == null ? "fist" : weapon.name;
  if (weapon_name == "railgun" ||
      weapon_name == "electrified_railgun" ||
      weapon_name == "laser_gun") {
    proj_texture = "em_beam";
  }
  else if (weapon_name == "x_ray_gun" ||
           weapon_name == "gamma_gun" ||
           weapon_name == "spooky_gun") {
    proj_texture = "particle_beam";
  }

  let proj = new Projectile(
    scene, null, src_actor.rx, src_actor.ry, dest_rx, dest_ry, proj_texture);
  proj.src_actor = src_actor;
  proj.dst_actor = dst_actor;

  let dx = dest_rx - src_actor.rx;
  let dy = dest_ry - src_actor.ry;
  let ang = Math.atan2(dy, dx);

  proj.render_comp.rotation = ang;

  scene.projectiles.push(proj);

  src_actor.energy -= 100;
}

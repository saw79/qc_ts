import {TILE_SIZE, BARREL_RADIUS, VIAL_RADIUS} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {rand_int} from "./util";
import {Liquid, LiquidColor, Gas} from "./liquid";
import {line} from "./bresenham";
import {TileGrid, TileType} from "./tile_grid";
import {BuffType, has_buff} from "./buff";

export class CombatInfo {
  health: number;
  max_health: number;
  cognition: number;
  max_cognition: number;
  damage: number;
  damage_std: number;
  absorption: number;
  dodge: number;

  constructor() {
    this.health = 10;
    this.max_health = 10;
    this.cognition = 10;
    this.max_cognition = 10;
    this.damage = 1;
    this.damage_std = 1;
    this.absorption = 0;
    this.dodge = 10;
  }
}

export function calc_combat(scene: MainScene, actor0: Actor, actor1: Actor): void {
  // --- CALCULATE ---

  let is_nauseous0 = has_buff(actor0, BuffType.NAUSEOUS);
  let is_nauseous1 = has_buff(actor1, BuffType.NAUSEOUS);

  if (!is_nauseous1 && rand_int(100) < actor1.combat.dodge) {
    scene.new_floating_text("DODGED", actor1.rx, actor1.ry - TILE_SIZE/2, "dodge");
    return;
  }

  let dmg = actor0.combat.damage;
  dmg += rand_int(3) - 1;
  let absorp = actor1.combat.absorption;

  if (is_nauseous0 && Math.random() < 0.5) {
    dmg /= 2;
  }
  if (is_nauseous1 && Math.random() < 0.5) {
    dmg *= 2;
    absorp /= 2;
  }

  let final_dmg = Math.max(0, Math.round(dmg - absorp));

  damage_actor(scene, actor0.display_name, actor1, final_dmg, 0.5);
}

export function damage_actor(
  scene: MainScene,
  src_name: string,
  dst_actor: Actor,
  dmg: number,
  cog_factor: number
): void {
  dst_actor.combat.health -= dmg;

  if (Math.random() < cog_factor) {
    dst_actor.combat.cognition -= dmg;
  }

  if (dst_actor.combat.cognition < 0) {
    dst_actor.combat.cognition = 0;
  }

  // --- UPDATE VISUALS ---

  scene.hud.update_bars();

  dst_actor.update_vision_size();

  // for enemies (will just abort out for player):
  dst_actor.update_health_bar_width();

  scene.new_floating_text(dmg.toString(), dst_actor.rx, dst_actor.ry - TILE_SIZE/2, "combat");

  if (dst_actor.combat.health <= 0) {
    dst_actor.alive = false;
    dst_actor.render_comp.visible = false;

    if (dst_actor.is_player) {
      console.log("PLAYER DIED!");
      scene.scene.remove("HUDScene");
      scene.scene.start("DeathScene", {killed_by: src_name});
    }
    else if (dst_actor.is_barrel) {
      let num = rand_int(4);
      let color = LiquidColor.GREY;
      switch (num) {
        case 0: color = LiquidColor.RED; break;
        case 1: color = LiquidColor.BLUE; break;
        case 2: color = LiquidColor.GREEN; break;
        default: color = LiquidColor.YELLOW; break;
      }
      create_liquid(scene, dst_actor.tx, dst_actor.ty, color, BARREL_RADIUS);
    }
  }
}

export function create_liquid(scene: MainScene, xc: number, yc: number, color: LiquidColor, radius: number): void {
  let xs = [];
  let ys = [];
  for (let x = xc - radius; x <= xc + radius; x++) {
    for (let y = yc - radius; y <= yc + radius; y++) {
      if ((x != xc || y != yc) && line_blocked(scene.grid, xc, yc, x, y)) {
        continue
      }

      let dist = Math.abs(x - xc) + Math.abs(y - yc);
      if (dist < rand_int(radius + 2)) {
        xs.push(x);
        ys.push(y);
      }
    }
  }

  for (let i = 0; i < xs.length; i++) {
    let [num, rot] = get_frame_num(xs, ys, xs[i], ys[i]);
    let liquid = new Liquid(scene, xs[i], ys[i], color, num, rot);
    scene.liquids.push(liquid);
  }

  check_liquid_effects(scene);
}

function check_liquid_effects(scene: MainScene): void {
  let cancel_ids = [];
  let explode_ids = []

  for (let i = 0; i < scene.liquids.length; i++) {
    if (!scene.liquids[i].alive)
      continue;
    for (let j = 0; j < scene.liquids.length; j++) {
      if (i == j)
        continue;

      if (!scene.liquids[j].alive)
        continue;

      if (scene.liquids[i].tx == scene.liquids[j].tx &&
          scene.liquids[i].ty == scene.liquids[j].ty) {

        if (scene.liquids[i].color == scene.liquids[j].color)
          continue

        let cancel = false;
        let explode = false;
        switch (scene.liquids[i].color) {
          case LiquidColor.BLUE:
            if (scene.liquids[j].color == LiquidColor.RED)
              cancel = true;
            else
              explode = true;
            break;
          case LiquidColor.RED:
            if (scene.liquids[j].color == LiquidColor.BLUE)
              cancel = true;
            else
              explode = true;
            break;
          case LiquidColor.GREEN:
            if (scene.liquids[j].color == LiquidColor.YELLOW)
              cancel = true;
            else
              explode = true;
            break;
          case LiquidColor.YELLOW:
            if (scene.liquids[j].color == LiquidColor.GREEN)
              cancel = true;
            else
              explode = true;
            break;
        }

        if (cancel) {
          cancel_ids.push(i);
          cancel_ids.push(j);
        }
        if (explode) {
          explode_ids.push(i);
          explode_ids.push(j);
        }
      }
    }
  }

  for (let i of cancel_ids) {
    cancel_liquid(scene, scene.liquids[i].tx, scene.liquids[i].ty);
  }
  for (let i of explode_ids) {
    explode_liquid(scene, scene.liquids[i].tx, scene.liquids[i].ty);
  }
}

function cancel_liquid(scene: MainScene, x0: number, y0: number): void {
  for (let i = 0; i < scene.liquids.length; i++) {
    if (scene.liquids[i].tx == x0 + 1 && scene.liquids[i].ty == y0 ||
        scene.liquids[i].tx == x0 - 1 && scene.liquids[i].ty == y0 ||
        scene.liquids[i].tx == x0 && scene.liquids[i].ty == y0 + 1 ||
        scene.liquids[i].tx == x0 && scene.liquids[i].ty == y0 - 1) {
      if (scene.liquids[i].color != LiquidColor.GREY) {
        scene.liquids[i].color = LiquidColor.GREY;
        scene.liquids[i].init_textures(scene);
        cancel_liquid(scene, scene.liquids[i].tx, scene.liquids[i].ty);
      }
    }
  }
}

function explode_liquid(scene: MainScene, x0: number, y0: number): void {
  for (let i = 0; i < scene.liquids.length; i++) {
    if (scene.liquids[i].tx == x0 + 1 && scene.liquids[i].ty == y0 ||
        scene.liquids[i].tx == x0 - 1 && scene.liquids[i].ty == y0 ||
        scene.liquids[i].tx == x0 && scene.liquids[i].ty == y0 + 1 ||
        scene.liquids[i].tx == x0 && scene.liquids[i].ty == y0 - 1) {
      if (scene.liquids[i].alive) {
        scene.liquids[i].alive = false;
        scene.gases.push(new Gas(scene, scene.liquids[i].tx, scene.liquids[i].ty));
        explode_liquid(scene, scene.liquids[i].tx, scene.liquids[i].ty);
      }
    }
  }
}

function line_blocked(grid: TileGrid, x0: number, y0: number, x1: number, y1: number): boolean {
  let los = line(x0, y0, x1, y1);
  for (let i = 0; i < los.length; i++) {
    if (grid.at(los[i][0], los[i][1]) == TileType.WALL ||
        grid.at(los[i][0], los[i][1]) == TileType.DOORCLOSED) {
      return true;
    }
  }

  return false;
}

function get_frame_num(xs: Array<number>, ys: Array<number>, x: number, y: number): [number, number] {
  let left = false;
  let right = false;
  let up = false;
  let down = false;

  let num_touches = 0;
  if (contains_point(xs, ys, x-1, y)) {
    left = true;
    num_touches++;
  }
  if (contains_point(xs, ys, x+1, y)) {
    right = true;
    num_touches++;
  }
  if (contains_point(xs, ys, x, y-1)) {
    up = true;
    num_touches++;
  }
  if (contains_point(xs, ys, x, y+1)) {
    down = true;
    num_touches++;
  }

  if (num_touches == 0) {
    return [0, 0];
  }
  else if (num_touches == 1) {
    if (left)
      return [1, Math.PI/2];
    else if (right)
      return [1, -Math.PI/2];
    else if (up)
      return [1, Math.PI];
    else
      return [1, 0];
  }
  else if (num_touches == 2) {
    if (left && right)
      return [3, Math.PI/2];
    else if (up && down)
      return [3, 0];
    else if (right && down)
      return [2, 0];
    else if (down && left)
      return [2, Math.PI/2];
    else if (left && up)
      return [2, Math.PI];
    else
      return [2, -Math.PI/2];
  }
  else if (num_touches == 3) {
    if (!left)
      return [4, 0];
    else if (!up)
      return [4, Math.PI/2];
    else if (!right)
      return [4, Math.PI];
    else
      return [4, -Math.PI/2];
  }
  else {
    return [5, 0];
  }
}

function contains_point(xs: Array<number>, ys: Array<number>, x: number, y: number): boolean {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] == x && ys[i] == y) {
      return true;
    }
  }

  return false;
}

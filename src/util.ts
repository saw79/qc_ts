import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {TileType, TileGrid, Visibility} from "./tile_grid";
import {Actor} from "./actor";
import {Item} from "./item";

export enum Direction {
  Up,
  Down,
  Left,
  Right
}

export function new_game(scene: Phaser.Scene): void {
  scene.scene.start("MainScene", {
    prev_level_num: -1,
    level_num: 0,
    player: null,
    inventory: null,
    level_store: [],
  });
}

export function get_tile_name(level_num: number): string {
  if (level_num <= 10) { return "prison"; }
  else if (level_num <= 20) { return "dark_lab"; }
  else if (level_num <= 30) { return "armory"; }
  else if (level_num <= 40) { return "advanced_research_facility"; }
  else { return "executive_offices"; }
}

export function make_display_name(name: string): string {
  let words = name.replace(/_/g, " ").split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  return words.join(" ");
}

export function rand_int(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export function rand_range(min: number, max: number): number {
  return rand_int(max - min) + min;
}

export function tile_in_list(xy: [number, number], xys: Array<[number, number]>): boolean {
  for (let xy_i of xys) {
    if (xy[0] == xy_i[0] && xy[1] == xy_i[1]) {
      return true;
    }
  }

  return false;
}

export function rand_tile(scene: MainScene, excludes: Array<[number, number]> = []): [number, number] {
  let x = 0;
  let y = 0;
  do {
    x = rand_int(scene.grid.width-2) + 1;
    y = rand_int(scene.grid.height-2) + 1;
  } while (scene.grid.at(x, y) != TileType.FLOOR || tile_in_list([x, y], excludes));

  return [x, y];
}

export function rand_tile_no_item(scene: MainScene, excludes: Array<[number, number]> = []): [number, number] {
  let x = 0;
  let y = 0;
  do {
    x = rand_int(scene.grid.width-2) + 1;
    y = rand_int(scene.grid.height-2) + 1;
  } while (
    scene.grid.at(x, y) != TileType.FLOOR ||
    item_at(scene.items, x, y) != null ||
    tile_in_list([x, y], excludes));

  return [x, y];
}

export function rand_tile_no_actor(scene: MainScene, excludes: Array<[number, number]> = []): [number, number] {
  let x = 0;
  let y = 0;
  do {
    x = rand_int(scene.grid.width-2) + 1;
    y = rand_int(scene.grid.height-2) + 1;
  } while (
    scene.grid.at(x, y) != TileType.FLOOR ||
    actor_at(scene.actors, x, y) != null ||
    tile_in_list([x, y], excludes));

  return [x, y];
}

export function tile_to_render_coords(tx: number, ty: number): [number, number] {
  let rx = tx*TILE_SIZE + TILE_SIZE/2;
  let ry = ty*TILE_SIZE + TILE_SIZE/2;
  return [rx, ry];
}

export function actor_at(actors: Array<Actor>, tile_x: number, tile_y: number): number | null {
  for (let i = 0; i < actors.length; i++) {
    if (Math.abs(actors[i].tx - tile_x) < 0.001 && Math.abs(actors[i].ty - tile_y) < 0.001) {
      return i;
    }
  }

  return null;
}

export function item_at(items: Array<Item>, tile_x: number, tile_y: number): number | null {
  for (let i = 0; i < items.length; i++) {
    if (Math.abs(items[i].tx - tile_x) < 0.001 && Math.abs(items[i].ty - tile_y) < 0.001) {
      return i;
    }
  }

  return null;
}

export function closest_enemy_visible(grid: TileGrid, actors: Array<Actor>, pl_x: number, pl_y: number): Actor | null {
  let best_actor = null;
  let best_dist = 1000;

  for (let i = 1; i < actors.length; i++) {
    if (grid.get_visibility(actors[i].tx, actors[i].ty) != Visibility.VISIBLE) {
      continue;
    }

    let dx = actors[i].tx - pl_x;
    let dy = actors[i].ty - pl_y;
    let dist = dx*dx + dy*dy;
    if (dist < best_dist) {
      best_dist = dist;
      best_actor = actors[i];
    }
  }

  return best_actor;
}

export function is_in_enemy_vision(scene: MainScene, player_x: number, player_y: number): boolean {
  for (let i = 1; i < scene.actors.length; i++) {
    if (scene.actors[i].is_barrel) {
      continue;
    }

    let enemy_x = scene.actors[i].tx;
    let enemy_y = scene.actors[i].ty;
    let vision_dist = scene.actors[i].vision_dist;
    let dir = scene.actors[i].dir;

    if (scene.grid.visible_from_to(enemy_x, enemy_y, player_x, player_y, vision_dist, dir)) {
      return true;
    }
  }

  return false;
}

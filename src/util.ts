import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {TileGrid, Visibility} from "./tile_grid";
import {Actor} from "./actor";
import {Item} from "./item";

export enum Direction {
  Up,
  Down,
  Left,
  Right
}

export function rand_int(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export function rand_tile_no_item(scene: MainScene): [number, number] {
  let x = 0;
  let y = 0;
  do {
    x = rand_int(scene.grid.width-2) + 1;
    y = rand_int(scene.grid.height-2) + 1;
  } while (item_at(scene.items, x, y) != null);

  return [x, y];
}

export function rand_tile_no_actor(scene: MainScene): [number, number] {
  let x = 0;
  let y = 0;
  do {
    x = rand_int(scene.grid.width-2) + 1;
    y = rand_int(scene.grid.height-2) + 1;
  } while (actor_at(scene.actors, x, y) != null);

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

export function closest_actor(grid: TileGrid, actors: Array<Actor>, pl_x: number, pl_y: number): Actor | null {
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

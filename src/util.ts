import {TILE_SIZE} from "./constants";
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

import * as PF from "pathfinding";

import {line} from "./bresenham";
import {Direction} from "./util";

export enum TileType {
  FLOOR,
  DOORCLOSED,
  WALL,
  DOOROPEN,
  STAIRS_UP,
  STAIRS_DOWN,
}

export enum Visibility {
  UNSEEN,
  SEEN,
  VISIBLE,
}

export class TileGrid {
  width: number;
  height: number;
  tiles: Array<Array<TileType>>;
  pfgrid: PF.Grid;
  visibility: Array<Array<Visibility>>;
  vis_layer: Phaser.Tilemaps.DynamicTilemapLayer;

  stairs_up: [number, number];
  stairs_down: [number, number];

  sees_enemy: boolean;
  prev_sees_enemy: boolean;

  constructor(tiles: Array<Array<TileType>>, width: number, height: number) {
    this.tiles = tiles;
    this.width = width;
    this.height = height;

    this.pfgrid = new PF.Grid(width, height);
    this.visibility = new Array(height);
    for (let y = 0; y < height; y++) {
      this.visibility[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        if (this.tiles[y][x] == TileType.WALL) {
          this.pfgrid.setWalkableAt(x, y, false);
        }
        this.visibility[y][x] = Visibility.UNSEEN;
      }
    }

    this.sees_enemy = false;
    this.prev_sees_enemy = false;
  }

  set_stairs_up(x: number, y: number): void {
    this.stairs_up = [x, y];
    this.tiles[y][x] = TileType.STAIRS_UP;
    this.vis_layer.putTileAt(TileType.STAIRS_UP, x, y);
  }

  set_stairs_down(x: number, y: number): void {
    this.stairs_down = [x, y];
    this.tiles[y][x] = TileType.STAIRS_DOWN;
    this.vis_layer.putTileAt(TileType.STAIRS_DOWN, x, y);
  }

  at(x: number, y: number): TileType | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.tiles[y][x];
    } else {
      return null;
    }
  }

  get_visibility(x: number, y: number): Visibility {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.visibility[y][x];
    } else {
      return Visibility.UNSEEN;
    }
  }

  update_visibility(x0: number, y0: number, radius: number): void {
    /*
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.visibility[y][x] = Visibility.VISIBLE;
      }
    }
    return;
    */

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.visibility[y][x] == Visibility.VISIBLE) {
          this.visibility[y][x] = Visibility.SEEN;
        }

        if (Math.abs(x - x0) <= radius && Math.abs(y - y0) <= radius) {
          let pts = line(x0, y0, x, y);
          for (let pt of pts) {
            this.visibility[pt[1]][pt[0]] = Visibility.VISIBLE;
            if (this.at(pt[0], pt[1]) == TileType.WALL ||
                this.at(pt[0], pt[1]) == TileType.DOORCLOSED) {
              break;
            }
          }
        }
      }
    }

    this.vis_layer.forEachTile((t) => {
      switch (this.visibility[t.y][t.x]) {
        case Visibility.UNSEEN:
          t.alpha = 0;
          break;
        case Visibility.SEEN:
          t.alpha = 0.5;
          break;
        case Visibility.VISIBLE:
          t.alpha = 1;
          break;
      }
    });
  }

  visible_from_to(x0: number, y0: number, x1: number, y1: number,
                  max_dist: number, dir: Direction): boolean
  {
    // special case - next to
    if (Math.abs(x1 - x0) < 1.1 && Math.abs(y1 - y0) < 1.1) {
      switch (dir) {
        case Direction.Right: return adjacent_visibility(x1 - x0, y1 - y0);
        case Direction.Left: return adjacent_visibility(x0 - x1, y0 - y1);
        case Direction.Down: return adjacent_visibility(y1 - y0, x0 - x1);
        case Direction.Up: return adjacent_visibility(y0 - y1, x1 - x0);
        default:
          console.log("ERROR - unknown direction " + dir);
          return false; 
      }
    }

    // general case
    let dx = x1 - x0;
    let dy = y1 - y0;
    let dist = Math.sqrt(dx*dx + dy*dy);
    // need to fudge this a bit because of tile/rounding (this is normal)
    if (dist > max_dist + 0.5) {
      return false;
    }

    let player_angle = Math.atan2(dy, dx);
    let look_angle = 0;
    switch (dir) {
      case Direction.Right: look_angle = 0; break;
      case Direction.Down: look_angle = Math.PI/2; break;
      case Direction.Left: look_angle = Math.PI; break;
      case Direction.Up: look_angle = -Math.PI/2; break;
    }

    if (Math.cos(player_angle - look_angle) < 0.706) {
      return false;
    }

    let pts = line(x0, y0, x1, y1);
    for (let pt of pts) {
      if (this.at(pt[0], pt[1]) == TileType.WALL || this.at(pt[0], pt[1]) == TileType.DOORCLOSED) {
        return false;
      }
    }
    
    return true;
  }
}

function adjacent_visibility(d_forward: number, d_right: number): boolean {
  return d_forward > -0.1;
}

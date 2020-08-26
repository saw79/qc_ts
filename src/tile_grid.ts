import * as PF from "pathfinding";

import {generate_test} from "./level_gen";
import {line} from "./bresenham";
import {Direction} from "./util";

export enum TileType {
  FLOOR,
  DOORCLOSED,
  WALL,
  DOOROPEN,
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

  constructor(width: number, height: number, generator_name: string) {
    this.width = width;
    this.height = height;

    if (generator_name == "test") {
      this.tiles = generate_test(width, height);
    }
    else {
      console.log("INVALID generator name " + generator_name);
    }

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

  update_visibility(x0: number, y0: number, radius: number) {
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
    let dx = x1 - x0;
    let dy = y1 - y0;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > max_dist) {
      return false;
    }

    let player_angle = Math.atan2(dy, dx);
    let look_angle = 0;
    switch (dir) {
      case Direction.Right: look_angle = 0; break;
      case Direction.Down: look_angle = Math.PI/2; break;
      case Direction.Left: look_angle = Math.PI; break;
      case Direction.Up: look_angle = Math.PI*3/2; break;
    }

    if ((1 - Math.cos(player_angle - look_angle)) > 0.708) {
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

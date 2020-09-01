import {TileType} from "./tile_grid";
import {BSPLevelGenerator} from "./bsp_level_gen";

export function generate_test(width: number, height: number): Array<Array<TileType>> {
  let level = new Array(height);

  for (let r = 0; r < height; r++) {
    level[r] = new Array(width);
    for (let c = 0; c < width; c++) {
      if (r == 0 || r == height - 1 || c == 0 || c == width - 1) {
        level[r][c] = TileType.WALL;
      } else {
        level[r][c] = TileType.FLOOR;
      }
    }
  }

  return level;
}

export function generate_bsp(width: number, height: number): Array<Array<TileType>> {
  let bsp = new BSPLevelGenerator(width, height, 8);
  return bsp.tiles;
}


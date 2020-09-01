import {TileType} from "./tile_grid";

export function init_grid(width: number, height: number, tt: TileType): Array<Array<TileType>> {
  let tiles = new Array(height);
  for (let r = 0; r < height; r++) {
    tiles[r] = new Array(width);
    for (let c = 0; c < width; c++) {
      tiles[r][c] = tt;
    }
  }

  return tiles;
}

export function flood_fill(tiles: Array<Array<TileType>>, x: number, y: number): Array<Array<boolean>> {
  let filled = new Array(tiles.length);
  for (let r = 0; r < tiles.length; r++) {
    filled[r] = new Array(tiles[0].length);
    for (let c = 0; c < tiles[0].length; c++) {
      filled[r][c] = false;
    }
  }

  if (tiles[y][x] == TileType.FLOOR)
    flood_fill_aux(tiles, x, y, filled);

  return filled;
}

function flood_fill_aux(
  tiles: Array<Array<TileType>>,
  x: number,
  y: number,
  filled: Array<Array<boolean>>
): void {

  filled[y][x] = true;
  let ds = [
    [-1, -1],
    [ 0, -1],
    [ 1, -1],
    [-1,  0],
    [ 1,  0],
    [-1,  1],
    [ 0,  1],
    [ 1,  1]];
  let w = tiles[0].length;
  let h = tiles.length;
  for (let d of ds) {
    if (d[0] < 0 && x < 1) continue;
    if (d[1] < 0 && y < 1) continue;
    if (d[0] > 0 && x >= w - 1) continue;
    if (d[1] > 0 && y >= h - 1) continue;
    if (tiles[y+d[1]][x+d[0]] == TileType.FLOOR && !filled[y+d[1]][x+d[0]])
      flood_fill_aux(tiles, x + d[0], y + d[1], filled);
  }
}

/*
create_walls(): void {
  for (let x = 0; x < this.width; x++) {
    for (let y = 0; y < this.height; y++) {
      if (x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1) {
        this.tiles[y][x] = TileType.WALL;
      }
      else if (this.tiles[y][x] == TileType.FLOOR) {
          if (this.tiles[y - 1][x - 1] == TileType.EMPTY)
            this.tiles[y - 1][x - 1] = TileType.WALL;
          if (this.tiles[y - 1][x    ] == TileType.EMPTY)
            this.tiles[y - 1][x    ] = TileType.WALL;
          if (this.tiles[y - 1][x + 1] == TileType.EMPTY)
            this.tiles[y - 1][x + 1] = TileType.WALL;
          if (this.tiles[y    ][x - 1] == TileType.EMPTY)
            this.tiles[y    ][x - 1] = TileType.WALL;
          if (this.tiles[y    ][x + 1] == TileType.EMPTY)
            this.tiles[y    ][x + 1] = TileType.WALL;
          if (this.tiles[y + 1][x - 1] == TileType.EMPTY)
            this.tiles[y + 1][x - 1] = TileType.WALL;
          if (this.tiles[y + 1][x    ] == TileType.EMPTY)
            this.tiles[y + 1][x    ] = TileType.WALL;
          if (this.tiles[y + 1][x + 1] == TileType.EMPTY)
            this.tiles[y + 1][x + 1] = TileType.WALL;
        }
    }
  }
}
*/

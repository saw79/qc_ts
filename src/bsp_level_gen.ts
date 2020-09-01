import {rand_int, rand_range} from "./util";
import {TileType} from "./tile_grid";
import {init_grid} from "./level_gen_util";

// TODO - better halls (its a bit excessive right now, see other TODO)

class Room {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

export class BSPLevelGenerator {
  tiles: Array<Array<TileType>>;
  width: number;
  height: number;

  min_leaf_size: number;
  min_room_size: number;

  rooms: Array<Room>;

  constructor(width: number, height: number, min_leaf_size: number) {
    this.width = width;
    this.height = height;
    this.tiles = init_grid(width, height, TileType.WALL);

    this.min_leaf_size = min_leaf_size;
    this.min_room_size = 5;

    let room0 = new Room(1, 1, width - 2, height - 2);
    this.rooms = this.split_room(room0);
    for (let room of this.rooms) {
      this.shrink_room(room);
      this.fill_room_floor(room);
    }

    this.create_halls();
    this.add_doors();
  }

  split_room(room: Room): Array<Room> {
    if (room.w <= this.min_leaf_size && room.h <= this.min_leaf_size) {
      return [room];
    }

    let split_horiz = rand_int(2) == 0;
    if (room.w/room.h > 1.25) {
      split_horiz = true;
    }
    if (room.h/room.w > 1.25) {
      split_horiz = false;
    }

    let min_split = this.min_leaf_size;
    let max_split = (split_horiz ? room.w : room.h) - this.min_leaf_size;

    if (min_split > max_split) {
      return [room];
    }

    let split = rand_range(min_split, max_split);

    let room1: Room;
    let room2: Room;
    if (split_horiz) {
      room1 = new Room(room.x, room.y, split, room.h);
      room2 = new Room(room.x + split + 1, room.y, room.w - split - 1, room.h);
    } else {
      room1 = new Room(room.x, room.y, room.w, split);
      room2 = new Room(room.x, room.y + split + 1, room.w, room.h - split - 1);
    }

    let room1_splits = this.split_room(room1);
    let room2_splits = this.split_room(room2);

    return room1_splits.concat(room2_splits);
  }

  shrink_room(room: Room): void {
    if (room.w > this.min_room_size) {
      let slack = room.w - this.min_room_size;
      let reduction = rand_int(slack);
      let offset = rand_int(reduction);
      room.x += offset;
      room.w -= reduction;
    }
    if (room.h > this.min_room_size) {
      let slack = room.h - this.min_room_size;
      let reduction = rand_int(slack);
      let offset = rand_int(reduction);
      room.y += offset;
      room.h -= reduction;
    }
  }

  fill_room_floor(room: Room): void {
    for (let x = room.x; x < room.x + room.w; x++) {
      for (let y = room.y; y < room.y + room.h; y++) {
        this.tiles[y][x] = TileType.FLOOR;
      }
    }
  }

  create_halls(): void {
    for (let i = 0; i < this.rooms.length; i++) {
      let connected_h = false;
      let connected_v = false;
      for (let j = 0; j < this.rooms.length; j++) {
        if (i == j) continue;

        if (!connected_h &&
            this.rooms[j].y <= this.rooms[i].y + this.rooms[i].h &&
            this.rooms[j].y + this.rooms[j].h >= this.rooms[i].y) {
          this.connect_rooms_h(this.rooms[i], this.rooms[j]);
          connected_h = true;
        }

        // TODO connect only 1 tile per row vertically

        if (!connected_v &&
            this.rooms[j].x <= this.rooms[i].x + this.rooms[i].w &&
            this.rooms[j].x + this.rooms[j].w >= this.rooms[i].x) {
          this.connect_rooms_v(this.rooms[i], this.rooms[j]);
          connected_v = true;
        }
      }
    }
  }

  connect_rooms_h(room1: Room, room2: Room): void {
    let x0 = Math.min(room1.x, room2.x);
    let x1 = Math.max(room1.x, room2.x);

    let y0 = Math.max(room1.y, room2.y);
    let y1 = Math.min(room1.y + room1.h, room2.y + room2.h);
    let y = rand_range(y0, y1);

    for (let x = x0; x < x1; x++) {
      this.tiles[y][x] = TileType.FLOOR;
    }
  }

  connect_rooms_v(room1: Room, room2: Room): void {
    let y0 = Math.min(room1.y, room2.y);
    let y1 = Math.max(room1.y, room2.y);

    let x0 = Math.max(room1.x, room2.x);
    let x1 = Math.min(room1.x + room1.w, room2.x + room2.w);
    let x = rand_range(x0, x1);

    for (let y = y0; y < y1; y++) {
      this.tiles[y][x] = TileType.FLOOR;
    }
  }

  add_doors(): void {
    for (let room of this.rooms) {
      // top/bottom
      for (let x = room.x; x < room.x + room.w; x++) {
        let y0 = room.y - 1;
        let y1 = room.y + room.h;
        if (this.tiles[y0][x] == TileType.FLOOR)
          this.tiles[y0][x] = TileType.DOORCLOSED;
        if (this.tiles[y1][x] == TileType.FLOOR)
          this.tiles[y1][x] = TileType.DOORCLOSED;
      }

      // left/right
      for (let y = room.y; y < room.y + room.h; y++) {
        let x0 = room.x - 1;
        let x1 = room.x + room.w;
        if (this.tiles[y][x0] == TileType.FLOOR)
          this.tiles[y][x0] = TileType.DOORCLOSED;
        if (this.tiles[y][x1] == TileType.FLOOR)
          this.tiles[y][x1] = TileType.DOORCLOSED;
      }
    }
  }
}

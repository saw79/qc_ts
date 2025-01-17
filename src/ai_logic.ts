import * as PF from "pathfinding";

import {MainScene} from "./main_scene";
import {Actor, AlertState} from "./actor";
import {Action} from "./turn_logic";
import {TileGrid, TileType} from "./tile_grid";
import {Direction, rand_int} from "./util";
import {initiate_shot} from "./projectile";

export function get_action_ai(scene: MainScene, actors: Array<Actor>, curr_turn: number, grid: TileGrid): Action {
  let player_x = actors[0].tx;
  let player_y = actors[0].ty;
  let enemy_x = actors[curr_turn].tx;
  let enemy_y = actors[curr_turn].ty;
  let vision_dist = actors[curr_turn].vision_dist;
  let dir = actors[curr_turn].dir;

  if (grid.visible_from_to(enemy_x, enemy_y, player_x, player_y, vision_dist, dir)) {
    actors[curr_turn].set_alert(AlertState.AWARE);
    actors[curr_turn].last_seen = [player_x, player_y];
    return get_move_aware(scene, actors, curr_turn, grid);
  }
  else {
    if (actors[curr_turn].alert_state == AlertState.AWARE) {
      actors[curr_turn].alert_state = AlertState.SEARCH;
    }

    if (actors[curr_turn].alert_state == AlertState.SEARCH) {
      return get_move_search(actors, curr_turn, grid);
    }
    else if (actors[curr_turn].alert_state == AlertState.PATROL) {
      return get_move_patrol(actors, curr_turn, grid);
    }
  }
}

function get_move_aware(scene: MainScene, actors: Array<Actor>, curr_turn: number, grid: TileGrid): Action {
  actors[curr_turn].spin_start = null;
  let [tgtx, tgty] = [actors[0].tx, actors[0].ty];

  if (actors[curr_turn].ranged) {
    initiate_shot(scene, actors[curr_turn], tgtx, tgty);
    return {type: "wait", energy: 0};
  }

  let pfgrid_clone = grid.pfgrid.clone();
  let path = new PF.AStarFinder({allowDiagonal: true}).findPath(
    actors[curr_turn].tx, actors[curr_turn].ty, tgtx, tgty, pfgrid_clone);
  
  if (path[0] === undefined) {
    return {type: "wait", energy: 100};
  }
  else if (path.length > 2) {
    return {type: "move", x: path[1][0], y: path[1][1], energy: 100};
  }
  else {
    return {type: "attack", id: 0, energy: 100};
  }
}

function get_move_search(actors: Array<Actor>, curr_turn: number, grid: TileGrid): Action {
  let [tgtx, tgty] = actors[curr_turn].last_seen;

  if (actors[curr_turn].tx == tgtx && actors[curr_turn].ty == tgty) {
    if (actors[curr_turn].spin_start == null) {
      actors[curr_turn].spin_start = actors[curr_turn].dir;
      actors[curr_turn].spin_dir = rand_int(2);
    }

    actors[curr_turn].dir = next_dir(actors[curr_turn].dir, actors[curr_turn].spin_dir);

    if (actors[curr_turn].dir == actors[curr_turn].spin_start) {
      actors[curr_turn].alert_state = AlertState.PATROL;
    }

    actors[curr_turn].update_anim_and_vision(false);
    return {type: "wait", energy: 100};
  }

  let pfgrid_clone = grid.pfgrid.clone();
  let path = new PF.AStarFinder({allowDiagonal: true}).findPath(
    actors[curr_turn].tx, actors[curr_turn].ty, tgtx, tgty, pfgrid_clone);
  
  if (path[0] === undefined || path.length == 1) {
    return {type: "wait", energy: 100};
  }
  else {
    return {type: "move", x: path[1][0], y: path[1][1], energy: 100};
  }
}

function next_dir(dir0: Direction, dir_dir: number): Direction {
  if (dir_dir == 0 && dir0 == Direction.Right) { return Direction.Up; }
  else if (dir_dir == 0 && dir0 == Direction.Up) { return Direction.Left; }
  else if (dir_dir == 0 && dir0 == Direction.Left) { return Direction.Down; }
  else if (dir_dir == 0 && dir0 == Direction.Down) { return Direction.Right; }
  else if (dir0 == Direction.Right) { return Direction.Down; }
  else if (dir0 == Direction.Down) { return Direction.Left; }
  else if (dir0 == Direction.Left) { return Direction.Up; }
  else { return Direction.Right; }
}

function get_move_patrol(actors: Array<Actor>, curr_turn: number, grid: TileGrid): Action {
  actors[curr_turn].spin_start = null;
  if (rand_int(10) < 5) {
    switch (actors[curr_turn].dir) {
      case Direction.Up: return try_move(actors, curr_turn, grid, 0, -1);
      case Direction.Down: return try_move(actors, curr_turn, grid, 0, 1);
      case Direction.Left: return try_move(actors, curr_turn, grid, -1, 0);
      case Direction.Right: return try_move(actors, curr_turn, grid, 1, 0);
    }
  }

  return get_random_move(actors, curr_turn, grid);
}

function get_random_move(actors: Array<Actor>, curr_turn: number, grid: TileGrid): Action {
  let [dx, dy]: [number, number] = [0, 0];
  switch (rand_int(9)) {
    case 0: [dx, dy] = [ 0,  0]; break;
    case 1: [dx, dy] = [-1, -1]; break;
    case 2: [dx, dy] = [ 0, -1]; break;
    case 3: [dx, dy] = [ 1, -1]; break;
    case 4: [dx, dy] = [-1,  0]; break;
    case 5: [dx, dy] = [ 1,  0]; break;
    case 6: [dx, dy] = [-1,  1]; break;
    case 7: [dx, dy] = [ 0,  1]; break;
    case 8: [dx, dy] = [ 1,  1]; break;
  }

  return try_move(actors, curr_turn, grid, dx, dy);
}

function try_move(actors: Array<Actor>, curr_turn: number, grid: TileGrid, dx: number, dy: number): Action {
  let [x0, y0] = [actors[curr_turn].tx, actors[curr_turn].ty];
  let [x1, y1] = [x0 + dx, y0 + dy];

  if (grid.at(x1, y1) == TileType.WALL) {
    return {type: "wait", energy: 100};
  } else {
    return {type: "move", x: x1, y: y1, energy: 100};
  }
}

import * as PF from "pathfinding";

import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {tile_to_render_coords, actor_at} from "./util";//(tx: number, ty: number): [number, number]
import {get_action_ai} from "./ai_logic";
import {TileGrid} from "./tile_grid";
import {calc_combat} from "./combat_logic";

export interface Wait {
  type: "wait";
}
export interface Move {
  type: "move";
  x: number;
  y: number;
}
export interface Attack {
  type: "attack";
  id: number;
}

export type Action = Wait | Move | Attack;

export type ActionResult = [boolean, Action];

const MAX_TURNS = 200;

export function process_turns(scene: MainScene, actors: Array<Actor>, curr_turn: number, grid: TileGrid): number {
  let start_turn = curr_turn;

  for (let num_turns = 0; num_turns < MAX_TURNS; num_turns++) {
    let success: boolean = true;
    let action: Action;
    while (actors[curr_turn].energy >= 100) {
      if (actors[curr_turn].actions.length > 0) {
        success = true;
        action = actors[curr_turn].actions[0];
        actors[curr_turn].actions.shift();
      }
      else if (curr_turn > 0) {
        success = true;
        action = get_action_ai(actors, curr_turn, grid);
      }
      else {
        if (actors[curr_turn].motions.length > 1) {
          success = false;
        } else {
          [success, action] = get_action_target(actors, curr_turn, grid);
          if (!success) {
            [success, action] = get_action_path(actors, curr_turn);
          }
        }
      }

      if (success) {
        quick_process(scene, actors, curr_turn, action);
      } else {
        break;
      }
    } // end WHILE

    if (success) {
      curr_turn = next_turn(actors, curr_turn);
    }

    if (curr_turn == start_turn) {
      break;
    }
  }

  return curr_turn;
}

function next_turn(actors: Array<Actor>, curr_turn: number): number {
  let turn2 = curr_turn + 1;
  if (turn2 >= actors.length) {
    turn2 = 0;

    for (let actor of actors) {
      actor.energy += 100;
    }
  }

  return turn2;
}

function get_action_target(actors: Array<Actor>, curr_turn: number, grid: TileGrid): ActionResult {
  if (actors[curr_turn].target == null) {
    return [false, {type: "wait"}];
  }

  let tgt_id = actors[curr_turn].target;
  let tgt_actor = actors[tgt_id];
  let [tx, ty] = [tgt_actor.tx, tgt_actor.ty];

  let pfgrid_clone = grid.pfgrid.clone();
  let path = new PF.AStarFinder({allowDiagonal: true}).findPath(
    actors[curr_turn].tx, actors[curr_turn].ty, tx, ty, pfgrid_clone);
  
  if (path[0] === undefined) {
    actors[curr_turn].target = null;
    return [false, {type: "wait"}];
  }
  else if (path.length > 2) {
    return [true, {type: "move", x: path[1][0], y: path[1][1]}];
  }
  else {
    actors[curr_turn].target = null;
    return [true, {type: "attack", id: tgt_id}];
  }
}

function get_action_path(actors: Array<Actor>, curr_turn: number): ActionResult {
  if (actors[curr_turn].path.length > 0) {
    let first_seg = actors[curr_turn].path[0];
    actors[curr_turn].path.shift();
    return [true, {type: "move", x: first_seg[0], y: first_seg[1]}];

  } else {
    return [false, {type: "wait"}];
  }
}

function quick_process(scene: MainScene, actors: Array<Actor>, curr_turn: number, action: Action): void {
  switch(action.type) {
    case "wait":
      actors[curr_turn].energy -= 100;
      return;
    case "move":
      let blocker = actor_at(actors, action.x, action.y);
      if (blocker != null) {
        actors[curr_turn].actions.push({type: "wait"});
        return;
      }

      actors[curr_turn].tx = action.x;
      actors[curr_turn].ty = action.y;
      let [rx, ry] = tile_to_render_coords(action.x, action.y);
      actors[curr_turn].motions.push([rx, ry]);
      actors[curr_turn].energy -= 100;

      if (actors[curr_turn].is_player) {
        scene.grid.update_visibility(actors[0].tx, actors[0].ty, actors[0].vision_dist);
        scene.update_entity_visibility();
      }

      return;
    case "attack":
      calc_combat(scene, actors[curr_turn], actors[action.id]);
      actors[curr_turn].energy -= 100;
      scene.grid.update_visibility(actors[0].tx, actors[0].ty, actors[0].vision_dist);
      return;
  }
}

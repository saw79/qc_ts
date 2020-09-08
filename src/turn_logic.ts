import * as PF from "pathfinding";

import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {tile_to_render_coords, actor_at, is_in_enemy_vision} from "./util";
import {get_action_ai} from "./ai_logic";
import {TileType, TileGrid} from "./tile_grid";
import {calc_combat} from "./combat_logic";

export interface Wait {
  type: "wait";
  energy: number;
}
export interface Move {
  type: "move";
  energy: number;
  x: number;
  y: number;
}
export interface Attack {
  type: "attack";
  energy: number;
  id: number;
}

export type Action = Wait | Move | Attack;

export type ActionResult = [boolean, Action];

export function process_turns(scene: MainScene): void {
  let start_turn = scene.curr_turn;
  let curr_turn = scene.curr_turn;

  while (true) {
    let success: boolean = true;
    let action: Action;

    let actor = scene.actors[curr_turn];

    // --- GET ACTION ---

    if (actor.energy < 100) {
      action = {type: "wait", energy: 0};
    }
    else if (actor.actions.length > 0) {
      action = actor.actions[0];
      actor.actions.shift();
    }
    else if (curr_turn > 0) {
      action = get_action_ai(scene, scene.actors, curr_turn, scene.grid);
    }
    else {
      abort_because_new_enemy(scene);

      if (actor.motions.length > 1) {
        success = false;
      } else {
        [success, action] = get_action_target(scene.actors, curr_turn, scene.grid);
        if (!success) {
          [success, action] = get_action_path(scene.actors, curr_turn);
        }
      }

      abort_target_in_vision(scene);
    }

    // --- PROCESS ACTION ---

    if (success) {
      quick_process(scene, scene.actors, curr_turn, action);
    } else {
      break;
    }

    if (success) {
      curr_turn = next_turn(scene.actors, curr_turn);
    }

    if (curr_turn == start_turn) {
      break;
    }
  }

  scene.curr_turn = curr_turn;
}

function next_turn(actors: Array<Actor>, curr_turn: number): number {
  let turn2 = curr_turn + 1;
  if (turn2 >= actors.length) {
    turn2 = 0;

    for (let actor of actors) {
      if (!actor.is_barrel) {
        actor.energy += 100;
      }
    }
  }

  return turn2;
}

function get_action_target(actors: Array<Actor>, curr_turn: number, grid: TileGrid): ActionResult {
  if (actors[curr_turn].target == null) {
    return [false, {type: "wait", energy: 100}];
  }

  let tgt_id = actors[curr_turn].target;
  let tgt_actor = actors[tgt_id];
  let [tx, ty] = [tgt_actor.tx, tgt_actor.ty];

  let pfgrid_clone = grid.pfgrid.clone();
  let path = new PF.AStarFinder({allowDiagonal: true}).findPath(
    actors[curr_turn].tx, actors[curr_turn].ty, tx, ty, pfgrid_clone);
  
  if (path[0] === undefined) {
    actors[curr_turn].target = null;
    return [false, {type: "wait", energy: 100}];
  }
  else if (path.length > 2) {
    return [true, {type: "move", x: path[1][0], y: path[1][1], energy: 100}];
  }
  else {
    actors[curr_turn].target = null;
    return [true, {type: "attack", id: tgt_id, energy: 100}];
  }
}

function get_action_path(actors: Array<Actor>, curr_turn: number): ActionResult {
  if (actors[curr_turn].path.length > 0) {
    let first_seg = actors[curr_turn].path[0];
    actors[curr_turn].path.shift();
    return [true, {type: "move", x: first_seg[0], y: first_seg[1], energy: 100}];

  } else {
    return [false, {type: "wait", energy: 100}];
  }
}

function quick_process(scene: MainScene, actors: Array<Actor>, curr_turn: number, action: Action): void {
  switch(action.type) {
    case "wait":
      actors[curr_turn].energy -= action.energy;
      return;
    case "move":
      let blocker = actor_at(actors, action.x, action.y);
      if (blocker != null) {
        quick_process(scene, actors, curr_turn, {type: "wait", energy: 100});
        //actors[curr_turn].actions.push({type: "wait", energy: 100});
        return;
      }

      actors[curr_turn].tx = action.x;
      actors[curr_turn].ty = action.y;
      let [rx, ry] = tile_to_render_coords(action.x, action.y);
      actors[curr_turn].motions.push([rx, ry]);
      actors[curr_turn].energy -= action.energy;

      // open doors!

      let update_vis = false;

      if (scene.grid.at(action.x, action.y) == TileType.DOORCLOSED) {
        scene.grid.tiles[action.y][action.x] = TileType.DOOROPEN;
        scene.grid.vis_layer.putTileAt(TileType.DOOROPEN, action.x, action.y);
        update_vis = true;
      }

      // do movement, energy, etc.

      if (actors[curr_turn].is_player) {
        update_vis = true;
      }

      if (update_vis) {
        scene.grid.update_visibility(actors[0].tx, actors[0].ty, actors[0].vision_dist);
        scene.update_entity_visibility();
      }

      return;
    case "attack":
      let x0 = actors[curr_turn].tx;
      let y0 = actors[curr_turn].ty;
      let x1 = actors[action.id].tx;
      let y1 = actors[action.id].ty;
      actors[curr_turn].update_dir(x0, y0, x1, y1);
      actors[curr_turn].update_anim_and_vision(false);

      calc_combat(scene, actors[curr_turn], actors[action.id]);
      actors[curr_turn].energy -= action.energy;
      scene.grid.update_visibility(actors[0].tx, actors[0].ty, actors[0].vision_dist);
      return;
  }
}

function abort_because_new_enemy(scene: MainScene): void {
  // if we see NEW enemy, remove rest of path
  scene.grid.prev_sees_enemy = scene.grid.sees_enemy;
  scene.grid.sees_enemy = false;
  for (let i = 1; i < scene.actors.length; i++) {
    if (scene.actors[i].render_comp.visible) {
      scene.grid.sees_enemy = true;
      break;
    }
  }

  if (scene.grid.sees_enemy && !scene.grid.prev_sees_enemy) {
    scene.actors[0].path = [];
    scene.actors[0].target = null;
  }
}

function abort_target_in_vision(scene: MainScene): void {
  if (is_in_enemy_vision(scene, scene.actors[0].tx, scene.actors[0].ty)) {
    scene.actors[0].path = [];
    scene.actors[0].target = null;
  }
}

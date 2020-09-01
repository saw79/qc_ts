import "phaser";

import * as PF from "pathfinding";

import {TILE_SIZE} from "./constants";
import {MainScene, InputMode} from "./main_scene";
import {Actor} from "./actor";
import {TileGrid, TileType, Visibility} from "./tile_grid";
import {actor_at} from "./util";
import {initiate_shot, initiate_throw} from "./projectile";
import {tile_to_render_coords} from "./util";
import {item_stats} from "./stats";

export function mouse_click_normal(
  scene: MainScene,
  pointer: Phaser.Input.Pointer,
  camera: Phaser.Cameras.Scene2D.Camera,
  actors: Array<Actor>,
  grid: TileGrid) {

  let world_pt = camera.getWorldPoint(pointer.x, pointer.y);
  let click_tile_x = Math.floor(world_pt.x / TILE_SIZE);
  let click_tile_y = Math.floor(world_pt.y / TILE_SIZE);

  let player_x = actors[0].tx;
  let player_y = actors[0].ty;

  if (click_tile_x == player_x && click_tile_y == player_y) {
    if (!scene.pickup_item()) {
      actors[0].actions = [{type: "wait", energy: 100}];
    }
  }
  else if (actors[0].path.length > 0) {
    actors[0].target = null;
    actors[0].path = [];
  }
  else {
    let tgt = actor_at(actors, click_tile_x, click_tile_y);
    if (tgt != null) {
      let weapon = scene.inventory.get_weapon();
      let weapon_name = weapon == null ? "fist" : weapon.name;

      if (item_stats[weapon_name]["R"]) {
        initiate_shot(scene, actors[0], click_tile_x, click_tile_y);
      }
      else {
        actors[0].target = tgt;
      }
    }
    else if (click_tile_x >= 0 && click_tile_x < grid.width &&
               click_tile_y >= 0 && click_tile_y < grid.height) {

      if (grid.get_visibility(click_tile_x, click_tile_y) != Visibility.UNSEEN &&
          grid.at(click_tile_x, click_tile_y) != TileType.WALL) {
        let pfgrid_clone = grid.pfgrid.clone();
        let path = new PF.AStarFinder({allowDiagonal: true}).findPath(
          player_x, player_y, click_tile_x, click_tile_y, pfgrid_clone);
        
        if (path[0] === undefined) {
          console.log("no path found");
        }
        else if (path.length >= 2) {
          path.shift();
          actors[0].path = path;
        }
        else {
          console.log("path length 0 | 1 ???");
        }
      } else {
        console.log("no path found");
      }
    }
    else {
      //console.log("clicked outside grid");
    }
  }
}

export function mouse_click_target(scene: MainScene, pointer: Phaser.Input.Pointer): void {
  let world_pt = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  let click_tile_x = Math.floor(world_pt.x / TILE_SIZE);
  let click_tile_y = Math.floor(world_pt.y / TILE_SIZE);

  let [rx, ry] = tile_to_render_coords(click_tile_x, click_tile_y);

  scene.target_render.x = rx;
  scene.target_render.y = ry;
  scene.target_x = click_tile_x;
  scene.target_y = click_tile_y;
}

export function mouse_click_throw_tgt(
  scene: MainScene,
  pointer: Phaser.Input.Pointer,
  camera: Phaser.Cameras.Scene2D.Camera,
  actors: Array<Actor>,
  grid: TileGrid) {

  let world_pt = camera.getWorldPoint(pointer.x, pointer.y);
  let click_tile_x = Math.floor(world_pt.x / TILE_SIZE);
  let click_tile_y = Math.floor(world_pt.y / TILE_SIZE);

  let player_x = actors[0].tx;
  let player_y = actors[0].ty;

  if (click_tile_x == player_x && click_tile_y == player_y) {
    console.log("CANCEL THROW");
  }
  else {
    initiate_throw(scene, player_x, player_y, click_tile_x, click_tile_y);
  }

  scene.input_mode = InputMode.NORMAL;
}


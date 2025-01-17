import "phaser";

import * as PF from "pathfinding";

import {TILE_SIZE} from "./constants";
import {MainScene, InputMode, LevelInfo} from "./main_scene";
import {Actor} from "./actor";
import {TileGrid, TileType, Visibility} from "./tile_grid";
import {actor_at} from "./util";
import {initiate_shot, initiate_throw} from "./projectile";
import {tile_to_render_coords, is_in_enemy_vision} from "./util";
import {item_stats} from "./stats";

export function mouse_click_normal(
  scene: MainScene,
  pointer: Phaser.Input.Pointer,
  camera: Phaser.Cameras.Scene2D.Camera,
  grid: TileGrid) {

  let world_pt = camera.getWorldPoint(pointer.x, pointer.y);
  let click_tile_x = Math.floor(world_pt.x / TILE_SIZE);
  let click_tile_y = Math.floor(world_pt.y / TILE_SIZE);

  let player_x = scene.actors[0].tx;
  let player_y = scene.actors[0].ty;

  if (click_tile_x == player_x && click_tile_y == player_y) {
    let [change_levels, next_level_num] = [false, 0];
    if (player_x == scene.grid.stairs_up[0] && player_y == scene.grid.stairs_up[1]) {
      [change_levels, next_level_num] = [true, scene.level_num + 1];
    }
    if (scene.level_num > 0 &&
        player_x == scene.grid.stairs_down[0] &&
        player_y == scene.grid.stairs_down[1]) {
      [change_levels, next_level_num] = [true, scene.level_num - 1];
    }

    if (change_levels) {
      let level_info = new LevelInfo();
      level_info.grid = scene.grid;
      level_info.items = scene.items;
      level_info.enemies = scene.actors.slice(1);
      level_info.liquids = scene.liquids;
      level_info.gases = scene.gases;
      if (scene.level_num >= scene.level_store.length) {
        scene.level_store.push(level_info);
      } else {
        scene.level_store[scene.level_num] = level_info;
      }

      scene.scene.remove("HUDScene");
      scene.scene.start("TransitionScene", {
        prev_level_num: scene.level_num,
        level_num: next_level_num,
        player: scene.actors[0],
        inventory: scene.hud.inventory,
        level_store: scene.level_store,
      });
    }

    if (!scene.pickup_item()) {
      scene.actors[0].actions = [{type: "wait", energy: 100}];
    }
  }
  else if (scene.actors[0].path.length > 0) {
    scene.actors[0].target = null;
    scene.actors[0].path = [];
  }
  else {
    let tgt = actor_at(scene.actors, click_tile_x, click_tile_y);
    if (tgt != null) {
      let weapon = scene.hud.inventory.get_weapon();
      let weapon_name = weapon == null ? "fist" : weapon.name;

      if (item_stats[weapon_name]["R"]) {
        initiate_shot(scene, scene.actors[0], click_tile_x, click_tile_y);
      }
      else {
        scene.actors[0].target = tgt;
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

          // if in enemy vision, only add 1st path component
          let in_enemy_vision = is_in_enemy_vision(scene, player_x, player_y);

          if (in_enemy_vision) {
            scene.actors[0].path = [path[0]];
          } else {
            scene.actors[0].path = path;
          }
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
    initiate_throw(scene, actors[0], click_tile_x, click_tile_y);
  }

  scene.input_mode = InputMode.NORMAL;
}


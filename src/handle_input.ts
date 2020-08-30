import "phaser";

import * as PF from "pathfinding";

import {TILE_SIZE} from "./constants";
import {MainScene, InputMode} from "./main_scene";
import {Actor} from "./actor";
import {TileGrid, TileType, Visibility} from "./tile_grid";
import {actor_at} from "./util";
import {Projectile} from "./projectile";
import {line} from "./bresenham";
import {tile_to_render_coords} from "./util";

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
      actors[0].actions = [{type: "wait"}];
    }
  }
  else if (actors[0].path.length > 0) {
    actors[0].target = null;
    actors[0].path = [];
  }
  else {
    let tgt = actor_at(actors, click_tile_x, click_tile_y);
    if (tgt != null) {
      actors[0].target = tgt;
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
    let pts = line(player_x, player_y, click_tile_x, click_tile_y);
    let dest = pts[pts.length-1];
    let dest_actor = null;

    for (let pt of pts) {
      let da_idx = actor_at(scene.actors, pt[0], pt[1]);
      if (da_idx != null && da_idx > 0.1) {
        dest = pt;
        dest_actor = scene.actors[da_idx];
        break;
      }

      if (pt[0] >= 0 && pt[0] < grid.width && pt[1] >= 0 && pt[1] < grid.height &&
          grid.at(pt[0], pt[1]) == TileType.WALL || grid.at(pt[0], pt[1]) == TileType.DOORCLOSED) {
        dest = pt;
        break;
      }
    }

    if (scene.inventory.selected == null) {
      console.log("FATAL ERROR - inventory.selected is null but trying to throw");
    }

    let [r, c, is_equip] = scene.inventory.selected;
    scene.inventory.unselect_all();
    let item = scene.inventory.remove_item(r, c, is_equip);
    let [dest_rx, dest_ry] = tile_to_render_coords(dest[0], dest[1]);

    let proj = new Projectile(scene, item, actors[0].rx, actors[0].ry, dest_rx, dest_ry);
    proj.dest_actor = dest_actor;
    scene.projectiles.push(proj);

    if (item != null) {
      item.tx = dest[0];
      item.ty = dest[1];
      scene.items.push(item);

      if (is_equip) {
        if (r == 0 && c == 0) {
          scene.inventory.unequip_weapon();
        }
        else if (r == 0 && c == 1) {
          scene.inventory.unequip_armor();
        }
        else {
          console.log("UNIMPLEMNTED UNEQUIP r/c = " + r + ", " + c);
        }
      }
    }

    actors[0].energy -= 100;
  }

  scene.input_mode = InputMode.NORMAL;
}

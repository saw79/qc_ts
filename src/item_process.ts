//import {} from "./util";
import {MainScene} from "./main_scene";
import {MINE_RADIUS} from "./constants";
import {damage_actor} from "./combat_logic";
import {Item} from "./item";
import {mine_damage} from "./stats";
import {line} from "./bresenham";
import {TileType} from "./tile_grid";

export function process_mine(scene: MainScene, item: Item): void {
  let triggered = false;
  if (item.name.indexOf("proximity") != -1) {
    for (let i = 0; i < scene.actors.length; i++) {
      if (scene.actors[i].is_barrel)
        continue;

      let dx = scene.actors[i].tx - item.tx;
      let dy = scene.actors[i].ty - item.ty;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist <= MINE_RADIUS) {
        triggered = true;
      }
    }
  }
  else if (item.name.indexOf("timed") != -1) {
    item.turns_left--;
    if (item.turns_left <= 0) {
      triggered = true;
    }
  }

  if (triggered || item.triggered) {
    explode_mine(scene, item);
  }
}

export function explode_mine(scene: MainScene, item: Item) {
  let num = parseInt(item.name[item.name.length-1]);
  let damage = mine_damage[num-1];
  for (let i = 0; i < scene.actors.length; i++) {
    let dx = scene.actors[i].tx - item.tx;
    let dy = scene.actors[i].ty - item.ty;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist <= MINE_RADIUS) {
      let pts = line(item.tx, item.ty, scene.actors[i].tx, scene.actors[i].ty);
      let visible = true;
      for (let pt of pts) {
        if (scene.grid.at(pt[0], pt[1]) == TileType.WALL ||
            scene.grid.at(pt[0], pt[1]) == TileType.DOORCLOSED) {
          visible = false;
          break;
        }
      }

      if (visible) {
        damage_actor(scene, item.display_name, scene.actors[i], damage, 0);
      }
    }
  }

  create_explosion(scene, item.rx, item.ry);

  item.alive = false;
}

export function create_explosion(scene: MainScene, rx: number, ry: number): void {
  let particles = scene.add.particles("fire1");
  let emitter = particles.createEmitter({
    x: rx,
    y: ry,
    scale: 0.5,
    speed: 600,
    lifespan: 400,
    blendMode: "ADD"
  });
  emitter.explode(100, rx, ry);
}

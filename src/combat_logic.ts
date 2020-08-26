import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";

export function calc_combat(scene: MainScene, actors: Array<Actor>, id0: number, id1: number) {
  let dmg = actors[id0].damage;

  // apply damage
  actors[id1].health -= dmg;
  actors[id1].cognition -= dmg;

  // update visuals

  scene.update_bars();

  actors[id1].update_vision_size();

  // for enemies (will just abort out for player):
  actors[id1].update_health_bar_width();

  scene.new_floating_text(dmg.toString(), actors[id1].rx, actors[id1].ry - TILE_SIZE/2, "combat");

  if (actors[id1].health <= 0) {
    actors[id1].alive = false;
    actors[id1].render_comp.visible = false;

    if (id1 == 0) {
      console.log("PLAYER DIED!");
    }
  }
}

import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {rand_int} from "./util";

export function calc_combat(scene: MainScene, actors: Array<Actor>, id0: number, id1: number): void {
  // --- CALCULATE ---

  if (rand_int(100) < actors[id1].dodge) {
    scene.new_floating_text("DODGED", actors[id1].rx, actors[id1].ry - TILE_SIZE/2, "dodge");
    return;
  }

  let dmg = actors[id0].damage - actors[id1].absorption;

  dmg = Math.max(dmg, 0);

  // --- APPLY ---

  actors[id1].health -= dmg;
  actors[id1].cognition -= dmg;
  if (actors[id1].cognition < 0) {
    actors[id1].cognition = 0;
  }

  // --- UPDATE VISUALS ---

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

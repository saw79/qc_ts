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

  let dmg = actors[id0].damage;
  dmg += rand_int(3) - 1;
  dmg -= actors[id1].absorption;
  dmg = Math.max(dmg, 0);

  damage_actor(scene, actors[id1], dmg, id1 == 0);
}

export function damage_actor(
  scene: MainScene,
  actor: Actor,
  dmg: number,
  is_player: boolean
): void {
  actor.health -= dmg;
  actor.cognition -= dmg;
  if (actor.cognition < 0) {
    actor.cognition = 0;
  }

  // --- UPDATE VISUALS ---

  scene.update_bars();

  actor.update_vision_size();

  // for enemies (will just abort out for player):
  actor.update_health_bar_width();

  scene.new_floating_text(dmg.toString(), actor.rx, actor.ry - TILE_SIZE/2, "combat");

  if (actor.health <= 0) {
    actor.alive = false;
    actor.render_comp.visible = false;

    if (is_player) {
      console.log("PLAYER DIED!");
    }
  }
}


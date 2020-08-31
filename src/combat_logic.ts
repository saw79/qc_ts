import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {rand_int} from "./util";

export function calc_combat(scene: MainScene, actor0: Actor, actor1: Actor): void {
  // --- CALCULATE ---

  if (rand_int(100) < actor1.dodge) {
    scene.new_floating_text("DODGED", actor1.rx, actor1.ry - TILE_SIZE/2, "dodge");
    return;
  }

  let dmg = actor0.damage;
  dmg += rand_int(3) - 1;
  dmg -= actor1.absorption;
  dmg = Math.max(dmg, 0);

  damage_actor(scene, actor1, dmg);
}

export function damage_actor(
  scene: MainScene,
  actor: Actor,
  dmg: number
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

    if (actor.is_player) {
      console.log("PLAYER DIED!");
    }
  }
}


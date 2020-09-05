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

  damage_actor(scene, actor0, actor1, dmg);
}

export function damage_actor(
  scene: MainScene,
  src_actor: Actor,
  dst_actor: Actor,
  dmg: number
): void {
  dst_actor.health -= dmg;
  dst_actor.cognition -= dmg;
  if (dst_actor.cognition < 0) {
    dst_actor.cognition = 0;
  }

  // --- UPDATE VISUALS ---

  scene.hud.update_bars();

  dst_actor.update_vision_size();

  // for enemies (will just abort out for player):
  dst_actor.update_health_bar_width();

  scene.new_floating_text(dmg.toString(), dst_actor.rx, dst_actor.ry - TILE_SIZE/2, "combat");

  if (dst_actor.health <= 0) {
    dst_actor.alive = false;
    dst_actor.render_comp.visible = false;

    if (dst_actor.is_player) {
      console.log("PLAYER DIED!");
      scene.scene.remove("HUDScene");
      scene.scene.start("DeathScene", {killed_by: src_actor.display_name});
    }
  }
}


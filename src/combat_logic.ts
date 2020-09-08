import {TILE_SIZE} from "./constants";
import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {rand_int} from "./util";

export class CombatInfo {
  health: number;
  max_health: number;
  cognition: number;
  max_cognition: number;
  damage: number;
  damage_std: number;
  absorption: number;
  dodge: number;

  constructor() {
    this.health = 10;
    this.max_health = 10;
    this.cognition = 10;
    this.max_cognition = 10;
    this.damage = 1;
    this.damage_std = 1;
    this.absorption = 0;
    this.dodge = 10;
  }
}

export function calc_combat(scene: MainScene, actor0: Actor, actor1: Actor): void {
  // --- CALCULATE ---

  if (rand_int(100) < actor1.combat.dodge) {
    scene.new_floating_text("DODGED", actor1.rx, actor1.ry - TILE_SIZE/2, "dodge");
    return;
  }

  let dmg = actor0.combat.damage;
  dmg += rand_int(3) - 1;
  dmg -= actor1.combat.absorption;
  dmg = Math.max(dmg, 0);

  damage_actor(scene, actor0, actor1, dmg);
}

export function damage_actor(
  scene: MainScene,
  src_actor: Actor,
  dst_actor: Actor,
  dmg: number
): void {
  dst_actor.combat.health -= dmg;
  dst_actor.combat.cognition -= dmg;
  if (dst_actor.combat.cognition < 0) {
    dst_actor.combat.cognition = 0;
  }

  // --- UPDATE VISUALS ---

  scene.hud.update_bars();

  dst_actor.update_vision_size();

  // for enemies (will just abort out for player):
  dst_actor.update_health_bar_width();

  scene.new_floating_text(dmg.toString(), dst_actor.rx, dst_actor.ry - TILE_SIZE/2, "combat");

  if (dst_actor.combat.health <= 0) {
    dst_actor.alive = false;
    dst_actor.render_comp.visible = false;

    if (dst_actor.is_player) {
      console.log("PLAYER DIED!");
      scene.scene.remove("HUDScene");
      scene.scene.start("DeathScene", {killed_by: src_actor.display_name});
    }
  }
}


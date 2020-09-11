import {Actor} from "./actor";

export enum BuffType {
  BURN,
  CHILL,
  NAUSEOUS,
}

export class Buff {
  type: BuffType;
  curr_turn: number;
  duration: number;
  alive: boolean;

  constructor(type: BuffType, duration: number) {
    this.type = type;
    this.curr_turn = 0;
    this.duration = duration;
    this.alive = true;
  }

  tick(): void {
    this.curr_turn++;
    if (this.curr_turn >= this.duration) {
      this.alive = false;
    }
  }
}

export function add_buff(actor: Actor, type: BuffType, duration: number): void {
  for (let i = 0; i < actor.buffs.length; i++) {
    if (actor.buffs[i].type == type) {
      actor.buffs[i].duration = duration;
      actor.buffs[i].curr_turn = 0;
      return;
    }
  }

  actor.buffs.push(new Buff(type, duration));
}

export function has_buff(actor: Actor, type: BuffType): boolean {
  for (let i = 0; i < actor.buffs.length; i++) {
    if (actor.buffs[i].type == type) {
      return true;
    }
  }

  return false;
}

export function get_buff_texture(type: BuffType): string {
  switch (type) {
    case BuffType.BURN: return "icon_burning";
    case BuffType.CHILL: return "icon_chilled";
    case BuffType.NAUSEOUS: return "icon_nauseous";
    default:
      console.log("Unknown texture for buff type " + type);
      return null;
  }
    /*
    load_image(scene, "icon_adaptive_skin");
    load_image(scene, "icon_meditate");
    load_image(scene, "icon_aware");
    load_image(scene, "icon_mind_reading");
    load_image(scene, "icon_bend_light");
    load_image(scene, "icon_momentum");
    load_image(scene, "icon_blinded");
    load_image(scene, "icon_nauseous");
    load_image(scene, "icon_burning");
    load_image(scene, "icon_noise_cancellation");
    load_image(scene, "icon_chemical_immunity");
    load_image(scene, "icon_optimization");
    load_image(scene, "icon_chilled");
    load_image(scene, "icon_overclock");
    load_image(scene, "icon_double_strike");
    load_image(scene, "icon_overheat");
    load_image(scene, "icon_enhanced_absorption");
    load_image(scene, "icon_perpetual_motion");
    load_image(scene, "icon_enhanced_damage");
    load_image(scene, "icon_pipeline");
    load_image(scene, "icon_enhanced_dodge");
    load_image(scene, "icon_placebo");
    load_image(scene, "icon_enhanced_speed");
    load_image(scene, "icon_question");
    load_image(scene, "icon_error_correction");
    load_image(scene, "icon_quickness");
    load_image(scene, "icon_flee");
    load_image(scene, "icon_radar");
    load_image(scene, "icon_fragile");
    load_image(scene, "icon_rebound");
    load_image(scene, "icon_hack");
    load_image(scene, "icon_rewire");
    load_image(scene, "icon_heat_shield");
    load_image(scene, "icon_searching");
    load_image(scene, "icon_leech");
    load_image(scene, "icon_superposition");
    load_image(scene, "icon_light_feet");
    load_image(scene, "icon_supersonic");
    load_image(scene, "icon_light_speed");
    load_image(scene, "icon_unaware");
    load_image(scene, "icon_machine_learning");
    load_image(scene, "icon_wormhole");
    */
}

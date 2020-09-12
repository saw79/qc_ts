import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {Item} from "./item";
import {rand_int, get_tile_name} from "./util";
import {enemy_stats, item_stats} from "./stats";

export function create_player(scene: MainScene, x: number, y: number): Actor {
    let player = new Actor(scene, "player_none", x, y, false);

    player.combat.health = 10;
    player.combat.max_health = 10;
    player.combat.cognition = 10;
    player.combat.max_cognition = 10;
    player.combat.damage = 1;

    return player;
}

export function create_random_enemy(scene: MainScene, x: number, y: number): Actor {
  let idx = rand_int(3);//Object.keys(enemy_stats).length);
  let name = Object.keys(enemy_stats)[idx];

  return create_enemy(scene, name, x, y);
}

export function create_enemy(scene: MainScene, name: string, x: number, y: number): Actor {
  let actor = new Actor(scene, name, x, y, false);

  actor.type = enemy_stats[name]["T"];
  actor.combat.health = enemy_stats[name]["H"];
  actor.combat.max_health = enemy_stats[name]["H"];
  actor.combat.cognition = enemy_stats[name]["C"];
  actor.combat.max_cognition = enemy_stats[name]["C"];
  actor.combat.damage = enemy_stats[name]["D"];

  actor.combat.absorption = enemy_stats[name]["A"];
  actor.combat.dodge = enemy_stats[name]["O"];

  // 0 = normal, 1 = ranged, 2 = tough, 3 = boss

  if (actor.type == 1) {
    actor.ranged = true;
  }
  else if (actor.type == 2 && rand_int(2) == 0) {
    actor.ranged = true;
  }

  return actor;
}

export function create_random_item(scene: MainScene, x: number, y: number): Item {
  let num = rand_int(10);
  if (num < 2) {
    return create_random_combat_item(scene, x, y);
  }
  else {
    return create_random_mine(scene, x, y);
  }
}

export function create_random_combat_item(scene: MainScene, x: number, y: number): Item {
  let item_names = ["baton", "mace", "battle_axe", "knife", "spear", "katana", "pistol", "shotgun", "assault_rifle", "rigid_vest", "combat_suit"];
  let idx = rand_int(item_names.length);//Object.keys(item_stats).length);
  //let name = Object.keys(item_stats)[idx];
  let name = item_names[idx];

  if (name == "fist" || name == "none") {
    return create_random_item(scene, x, y);
  }

  let item = new Item(scene, name, x, y);

  item.equippable = true;
  item.type = item_stats[name]["T"];

  return item;
}

export function create_random_mine(scene: MainScene, x: number, y: number): Item {
  // Math.max is only needed because we haven't implemented level 0 yet
  let mine_num = Math.max(1, Math.ceil(scene.level_num / 10));
  let type = ["proximity", "remote", "timed"][rand_int(3)];
  console.log("creating mine", type);

  return create_mine(scene, "mine_" + type + mine_num.toString(), x, y);
}

export function create_mine(scene: MainScene, name: string, x: number, y: number): Item {
  let item = new Item(scene, name, x, y);
  return item;
}

export function create_barrel(scene: MainScene, x: number, y: number): Actor {
  let name = "barrel_" + get_tile_name(scene.level_num);
  let actor = new Actor(scene, name, x, y, true);
  actor.combat.health = 1;
  actor.combat.dodge = 0;
  return actor;
}

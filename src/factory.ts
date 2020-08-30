import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {Item} from "./item";
import {rand_int} from "./util";
import {enemy_stats, item_stats} from "./stats";

export function create_player(scene: MainScene, x: number, y: number): Actor {
    let player = new Actor(scene, "player_none", x, y);

    player.health = 10;
    player.max_health = 10;
    player.cognition = 10;
    player.max_cognition = 10;
    player.damage = 1;

    return player;
}

export function create_random_enemy(scene: MainScene, x: number, y: number): Actor {
  let name = "prison_guard";
  switch (rand_int(3)) {
    case 0: name = "prison_guard"; break;
    case 1: name = "prison_soldier"; break;
    case 2: name = "prison_warden"; break;
  }

  return create_enemy(scene, name, x, y);
}

export function create_enemy(scene: MainScene, name: string, x: number, y: number): Actor {
  let actor = new Actor(scene, name, x, y);

  actor.health = enemy_stats[name]["H"];
  actor.max_health = enemy_stats[name]["H"];
  actor.cognition = enemy_stats[name]["C"];
  actor.max_cognition = enemy_stats[name]["C"];
  actor.damage = enemy_stats[name]["D"];

  return actor;
}

export function create_random_item(scene: MainScene, x: number, y: number): Item {
  let idx = rand_int(Object.keys(item_stats).length);
  let name = Object.keys(item_stats)[idx];

  if (name == "fist" || name == "none") {
    return create_random_item(scene, x, y);
  }

  let item = create_item(scene, name, x, y);

  item.equippable = true;
  item.type = item_stats[name]["T"];

  return item;
}

export function create_item(scene: MainScene, name: string, x: number, y: number): Item {
  let item = new Item(scene, name, x, y);

  item.render_comp.setScale(0.5);

  if (item.name.indexOf("orb") != -1) {
    item.render_comp.anims.play(item.name);
  }

  return item;
}


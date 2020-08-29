import {MainScene} from "./main_scene";
import {Actor} from "./actor";
import {Item} from "./item";
import {rand_int} from "./util";

export function create_player(scene: MainScene, x: number, y: number): Actor {
    let player = new Actor(scene, "player_none", 1, 1);

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
  let name = "baton";
  switch (rand_int(3)) {
    case 0: name = "baton"; break;
    case 1: name = "knife"; break;
    case 2: name = "pistol"; break;
  }

  return create_item(scene, name, x, y);
}

export function create_item(scene: MainScene, name: string, x: number, y: number): Item {
  let item = new Item(scene, name, x, y);

  item.render_comp.setScale(0.5);

  if (item.name.indexOf("orb") != -1) {
    item.render_comp.anims.play(item.name);
  }

  return item;
}

const enemy_stats = {
  "prison_guard"  : { "H": 3, "C": 3, "D": 1 },
  "prison_soldier": { "H": 3, "C": 2, "D": 1 },
  "prison_warden" : { "H": 5, "C": 4, "D": 2 },
};

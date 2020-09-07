import {MOVE_SPEED} from "./constants";
import {Actor} from "./actor";
import {TileGrid} from "./tile_grid";
import {Projectile} from "./projectile";

export function move_actors(actors: Array<Actor>, grid: TileGrid, delta_ms: number): void {
  for (let actor of actors) {
    if (actor.motions.length > 0) {
      move_actor(actor, grid, delta_ms);
    }
  }
}

export function move_projectiles(projectiles: Array<Projectile>, delta_ms: number): void {
  for (let proj of projectiles) {
    if (proj.alive) {
      move_projectile(proj, delta_ms);
    }
  }
}

function move_actor(actor: Actor, grid: TileGrid, delta_ms: number) {
  let x0 = actor.rx;
  let y0 = actor.ry;
  let [x1, y1] = actor.motions[0];
  let dx = x1 - x0;
  let dy = y1 - y0;

  let curr_dist = Math.sqrt(dx*dx + dy*dy);
  let move_dist = MOVE_SPEED * delta_ms / 1000;

  if (curr_dist < move_dist) {
    actor.move(x1, y1, grid);
    actor.motions.shift();
    if (actor.motions.length == 0) {
      actor.prev_move_dir = "stop";
      actor.render_comp.anims.stop();
    }
  } else {
    x1 = x0 + dx / curr_dist * move_dist;
    y1 = y0 + dy / curr_dist * move_dist;
    actor.move(x1, y1, grid);
  }
}

function move_projectile(proj: Projectile, delta_ms: number) {
  let dx = proj.rx1 - proj.rx0;
  let dy = proj.ry1 - proj.ry0;

  let curr_dist = Math.sqrt(dx*dx + dy*dy);
  let move_dist = proj.speed * delta_ms / 1000;

  if (curr_dist < move_dist) {
    proj.move(proj.rx1, proj.ry1, true);
  } else {
    let x = proj.rx0 + dx / curr_dist * move_dist;
    let y = proj.ry0 + dy / curr_dist * move_dist;
    proj.move(x, y, false);
  }
}

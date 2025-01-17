import "phaser";

import {MainScene} from "./main_scene";
import {Direction} from "./util";
import {TILE_SIZE, ACTOR_DEPTH, PLAYER_VISION, ENEMY_VISION} from "./constants";
import {tile_to_render_coords, make_display_name} from "./util";
import {Action} from "./turn_logic";
import {TileGrid, Visibility} from "./tile_grid";
import {CombatInfo} from "./combat_logic";
import {Buff} from "./buff";

export enum AlertState {
  PATROL,
  SEARCH,
  AWARE,
}

export class Actor {
  name: string;
  tx: number;
  ty: number;
  rx: number;
  ry: number;
  dir: Direction;
  render_comp: any;
  render_health: null | any;
  vision_comp: null | any;
  is_player: boolean;
  camera: Phaser.Cameras.Scene2D.Camera | null;
  ranged: boolean;
  type: number;
  prev_move_dir: string;

  is_barrel: boolean;

  display_name: string;

  actions: Array<Action>;
  motions: Array<[number, number]>;
  target: number | null;
  path: Array<[number, number]>;

  energy: number;
  alive: boolean;

  combat: CombatInfo;

  vision_dist: number;
  vision_dist_max: number;

  alert_state: AlertState;
  alert_comps: Record<AlertState, any>;
  last_seen: [number, number];
  spin_start: Direction;
  spin_dir: number;

  buffs: Array<Buff>;

  constructor(scene: MainScene, name: string, x: number, y: number, is_barrel: boolean) {
    this.name = name;
    this.tx = x;
    this.ty = y;
    [this.rx, this.ry] = tile_to_render_coords(x, y);
    this.dir = Direction.Down;

    this.is_player = name.indexOf("player") !== -1;
    this.camera = null;

    this.actions = [];
    this.motions = [];
    this.path = [];
    this.target = null;

    this.energy = is_barrel ? 0 : 100;
    this.alive = true;

    this.is_barrel = is_barrel;

    this.combat = new CombatInfo();

    if (this.is_player) {
      this.vision_dist = PLAYER_VISION;
      this.vision_dist_max = PLAYER_VISION;
    }
    else if (this.is_barrel) {
      this.vision_dist = 0;
      this.vision_dist_max = 0;
    }
    else {
      this.vision_dist = ENEMY_VISION;
      this.vision_dist_max = ENEMY_VISION;
    }

    this.alert_state = AlertState.PATROL;

    this.buffs = [];

    this.init_textures(scene);

    this.ranged = false;
    this.display_name = make_display_name(this.name);
    this.prev_move_dir = "stop";
  }

  init_textures(scene: MainScene): void {
    if (this.is_barrel) {
      let [rx, ry] = tile_to_render_coords(this.tx, this.ty);
      this.render_comp = scene.add.image(rx, ry, this.name);
      this.render_comp.setScale(0.5);
      this.render_comp.depth = ACTOR_DEPTH;
      return;
    }

    this.render_comp = scene.add.sprite(this.rx, this.ry, this.name);
    this.render_comp.depth = ACTOR_DEPTH;

    this.render_health = null;
    this.vision_comp = null;
    if (!this.is_player) {
      this.render_health = scene.add.image(this.rx, this.ry - TILE_SIZE/2, "health_bar");
      this.render_health.displayHeight = 3;
      this.render_health.depth = ACTOR_DEPTH;

      this.vision_comp = scene.add.image(this.rx, this.ry, "enemy_vision_wedge");
      this.vision_comp.alpha = 0.05;
      this.vision_comp.depth = ACTOR_DEPTH + 1;
    }

    this.update_anim_and_vision(false);
    this.update_health_bar_width();
    this.update_vision_size();

    let alert_x = this.rx;
    let alert_y = this.ry - TILE_SIZE;
    this.alert_comps = {
      [AlertState.PATROL]: scene.add.image(alert_x, alert_y, "icon_unaware"),
      [AlertState.SEARCH]: scene.add.image(alert_x, alert_y, "icon_searching"),
      [AlertState.AWARE]: scene.add.image(alert_x, alert_y, "icon_aware"),
    };

    for (let key in this.alert_comps) {
      this.alert_comps[key].setScale(0.3);
      this.alert_comps[key].visible = false;
      this.alert_comps[key].depth = ACTOR_DEPTH + 1;
    }

    if (!this.is_player) {
      this.alert_comps[this.alert_state].visible = true;
    }
  }

  destroy_textures(): void {
    this.render_comp.destroy();
    if (this.render_health != null) {
      this.render_health.destroy();
    }
    if (this.vision_comp != null) {
      this.vision_comp.destroy();
    }
    for (let key in this.alert_comps) {
      this.alert_comps[key].destroy();
    }
  }

  update_dir(prev_rx: number, prev_ry: number, rx: number, ry: number): void {
    if (rx == prev_rx && ry < prev_ry) {
      this.dir = Direction.Up;
    }
    else if (rx == prev_rx) {
      this.dir = Direction.Down;
    }
    else if (rx < prev_rx) {
      this.dir = Direction.Left;
    }
    else {
      this.dir = Direction.Right;
    }
  }

  update_anim_and_vision(do_play: boolean): void {
    if (this.is_barrel) {
      return;
    }

    let move_dir = this.prev_move_dir;

    switch (this.dir) {
      case Direction.Up:
        move_dir = "up";
        break;
      case Direction.Down:
        move_dir = "down";
        break;
      case Direction.Left:
        move_dir = "left";
        break;
      case Direction.Right:
        move_dir = "right";
        break;
    }

    if (move_dir != this.prev_move_dir) {
      if (move_dir == "left") {
        this.render_comp.anims.play(this.name + "_right", true);
        this.render_comp.flipX = true;
      } else {
        this.render_comp.anims.play(this.name + "_" + move_dir, true);
        this.render_comp.flipX = false;
      }

      if (!do_play) {
        this.render_comp.anims.stop();
      }
    }
    this.prev_move_dir = move_dir;

    if (this.vision_comp != null) {
      switch (this.dir) {
        case Direction.Up:
          this.vision_comp.rotation = -Math.PI/2;
          break;
        case Direction.Down:
          this.vision_comp.rotation = Math.PI/2;
          break;
        case Direction.Left:
          this.vision_comp.rotation = Math.PI;
          break;
        case Direction.Right:
          this.vision_comp.rotation = 0;
          break;
      }
    }
  }

  update_health_bar_width(): void {
    if (this.render_health != null) {
      this.render_health.displayWidth = TILE_SIZE * this.combat.health / this.combat.max_health;
    }
  }

  update_vision_size(): void {
    this.vision_dist = this.combat.cognition / this.combat.max_cognition * this.vision_dist_max;
    this.vision_dist = Math.max(this.vision_dist, 2);
    if (this.vision_comp != null) {
      this.vision_comp.displayWidth = (this.vision_dist*2 + 1) * TILE_SIZE;
      this.vision_comp.displayHeight = (this.vision_dist*2 + 1) * TILE_SIZE;
    }
  }

  update_visible(grid: TileGrid): void {
    if (this.is_player) {
      return;
    }

    if (!this.is_barrel) {
      for (let key in this.alert_comps) {
        this.alert_comps[key].visible = false;
      }
    }

    if (grid.get_visibility(this.tx, this.ty) == Visibility.VISIBLE) {
      this.render_comp.visible = true;

      if (!this.is_barrel) {
        this.render_health.visible = true;
        this.vision_comp.visible = true;
        this.alert_comps[this.alert_state].visible = true;
      }
    } else {
      this.render_comp.visible = false;

      if (grid.get_visibility(this.tx, this.ty) == Visibility.SEEN && this.is_barrel) {
        this.render_comp.visible = true;
      }

      if (!this.is_barrel) {
        this.render_health.visible = false;
        this.vision_comp.visible = false;
      }
    }
  }

  move(rx: number, ry: number, grid: TileGrid): void {
    this.update_dir(this.rx, this.ry, rx, ry);
    this.update_anim_and_vision(true);
    this.rx = rx;
    this.ry = ry;
    this.render_comp.x = rx;
    this.render_comp.y = ry;

    if (this.render_health != null) {
      this.render_health.x = rx;
      this.render_health.y = ry - TILE_SIZE/2;
    }

    if (this.vision_comp != null) {
      this.vision_comp.x = rx;
      this.vision_comp.y = ry;
    }

    for (let key in this.alert_comps) {
      this.alert_comps[key].x = rx;
      this.alert_comps[key].y = ry - TILE_SIZE;
    }

    this.update_visible(grid);

    if (this.camera != null) {
      this.camera.centerOn(this.rx, this.ry);
    }
  }

  set_alert(alert_state: AlertState): void {
    this.alert_state = alert_state;
    for (let key in this.alert_comps) {
      this.alert_comps[key].visible = false;
    }
    this.alert_comps[alert_state].visible = true;
  }
}

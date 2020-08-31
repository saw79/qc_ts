import {FLOATING_TEXT_TIME, FLOATING_TEXT_SPEED} from "./constants";

export class FloatingText {
  obj: Phaser.GameObjects.Text;
  total_time: number;
  curr_time: number;
  alive: boolean;
  delay: number;

  constructor(scene: Phaser.Scene, text: string, x: number, y: number, style: string, delay = 0) {
    let config = {};
    if (style == "combat") {
      config = { color: "yellow", stroke: "red", strokeThickness: 2};
    }
    else if (style == "health") {
      config = { color: "magenta", stroke: "magenta", strokeThickness: 2};
    }
    else if (style == "cognition") {
      config = { color: "blue", stroke: "blue", strokeThickness: 2};
    }
    else if (style == "dodge") {
      config = { color: "purple", stroke: "purple", strokeThickness: 2};
    }
    else {
      console.log("ERROR - Unknown style: " + style + ", using combat");
    }

    this.obj = scene.add.text(x, y, text, config);
    this.total_time = FLOATING_TEXT_TIME;
    this.delay = delay;
    this.curr_time = -delay;
    this.alive = true;
  }

  update(delta_ms: number) {
    this.curr_time += delta_ms / 1000;
    if (this.curr_time < 0) {
      this.obj.visible = false;
    } else {
      this.obj.visible = true;
      this.obj.y -= FLOATING_TEXT_SPEED * delta_ms/1000;
      if (this.curr_time >= this.total_time) {
        this.alive = false;
      }
    }
  }
}

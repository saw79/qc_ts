import "phaser";

import {make_display_name} from "./util";

export class TransitionScene extends Phaser.Scene {
  data;
  curr_ms: number;

  constructor() {
    super({ key: "TransitionScene"});
  }

  preload(): void {
  }

  create(data): void {
    this.data = data;
    this.curr_ms = 0;

    let w = +(this.game.config.width);
    //let h = +(this.game.config.height);

    let name = "prison";
    if (data.level_num <= 10) { name = "prison"; }
    else if (data.level_num <= 20) { name = "dark_lab"; }
    else if (data.level_num <= 30) { name = "armory"; }
    else if (data.level_num <= 40) { name = "advanced_research_facility"; }
    else { name = "executive_offices"; }

    name = make_display_name(name);
    
    let num = data.level_num % 10;

    let txt_name = this.add.text(w/2, 100, name, {
      fontFamily: "Arial", fontSize: 48, color: "blue", stroke: "blue", strokeThickness: 3});
    let txt_num = this.add.text(w/2, 250, "Floor " + num, {
      fontFamily: "Arial", fontSize: 36, color: "blue", stroke: "blue", strokeThickness: 3});

    txt_name.x -= txt_name.displayWidth/2;
    txt_name.y -= txt_name.displayHeight/2;
    txt_num.x -= txt_num.displayWidth/2;
    txt_num.y -= txt_num.displayHeight/2;
  }

  update(_time: number, delta_ms: number): void {
    this.curr_ms += delta_ms;
    if (this.curr_ms > 1500) {
      this.scene.start("MainScene", this.data);
    }
  }
}

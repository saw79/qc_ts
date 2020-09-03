import "phaser";

import {new_game} from "./util";

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: "DeathScene"});
  }

  preload(): void {
    this.load.image("up", "assets/sprites/UIImages/button_wide_up.png");
    this.load.image("down", "assets/sprites/UIImages/button_wide_down.png");
  }

  create(data): void {
    let w = +(this.game.config.width);
    let h = +(this.game.config.height);

    let txt_title = this.add.text(w/2, 100, "YOU DIED", {
      fontFamily: "Arial", fontSize: 48, color: "red", stroke: "red", strokeThickness: 3});
    let txt_killedby = this.add.text(w/2, 250, "Killed by\n" + data.killed_by, {
      fontFamily: "Arial", fontSize: 36, color: "yellow", stroke: "yellow", strokeThickness: 3});

    txt_title.x -= txt_title.displayWidth/2;
    txt_title.y -= txt_title.displayHeight/2;
    txt_killedby.x -= txt_killedby.displayWidth/2;
    txt_killedby.y -= txt_killedby.displayHeight/2;
    txt_killedby.setAlign("center");

    let btn_new = this.add.image(w/2, h-200, "up");
    btn_new.displayWidth = 300
    btn_new.displayHeight = 100

    let txt_new = this.add.text(0, 0, "New Game", {
      fontSize: 32, color: "red", stroke: "red", strokeThickness: 2});
    txt_new.x = btn_new.x - txt_new.displayWidth/2;
    txt_new.y = btn_new.y - txt_new.displayHeight/2;

    btn_new.setInteractive();
    btn_new.on('pointerdown', () => {
      btn_new.setTexture("down");
    });
    btn_new.on('pointerup', () => {
      btn_new.setTexture("up");
      new_game(this);
    });
  }
}

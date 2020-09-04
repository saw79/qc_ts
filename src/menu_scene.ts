import "phaser";

import {load_all, create_anims} from "./resource_manager";
import {new_game} from "./util";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene"});
  }

  preload(): void {
    load_all(this);
  }

  create(): void {
    create_anims(this);

    let w = +(this.game.config.width);
    let h = +(this.game.config.height);

    let txt_title = this.add.text(0, 0, "QUANTUM\nCORTEX", {
      fontSize: 48, color: "blue", stroke: "blue", strokeThickness: 2});
    txt_title.setAlign("center");

    let btn_new = this.add.image(w/2, h/2, "UIImages/button_wide_up");
    let txt_new = this.add.text(0, 0, "New Game", {
      fontSize: 32, color: "red", stroke: "red", strokeThickness: 2});

    let title_x = w/2;
    let title_y = 150;
    let new_x = w/2;
    let new_y = 2*h/3;

    txt_title.x = title_x - txt_title.displayWidth/2;
    txt_title.y = title_y;
    btn_new.x = new_x;
    btn_new.y = new_y;
    txt_new.x = new_x - txt_new.displayWidth/2;
    txt_new.y = new_y - txt_new.displayHeight/2;

    btn_new.setInteractive();
    btn_new.on('pointerdown', () => {
      btn_new.setTexture("UIImages/button_wide_down");
    });
    btn_new.on('pointerup', () => {
      btn_new.setTexture("UIImages/button_wide_up");

      new_game(this);
    });
  }
}

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
    let btn_new = this.add.image(w/2, h/2, "UIImages/button_wide_up");
    let txt_new = this.add.text(0, 0, "New Game", {
      fontSize: 32, color: "red", stroke: "red", strokeThickness: 2});
    txt_new.x = w/2 - txt_new.displayWidth/2;
    txt_new.y = h/2 - txt_new.displayHeight/2;

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

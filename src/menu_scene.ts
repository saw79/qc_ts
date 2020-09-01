import "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene"});
  }

  preload(): void {
    this.load.image("up", "assets/sprites/UIImages/button_wide_up.png");
    this.load.image("down", "assets/sprites/UIImages/button_wide_down.png");
  }

  create(): void {
    let w = +(this.game.config.width);
    let h = +(this.game.config.height);
    let btn_new = this.add.image(w/2, h/2, "up");
    let txt_new = this.add.text(0, 0, "New Game", {
      fontSize: 32, color: "red", stroke: "red", strokeThickness: 2});
    txt_new.x = w/2 - txt_new.displayWidth/2;
    txt_new.y = h/2 - txt_new.displayHeight/2;

    btn_new.setInteractive();
    btn_new.on('pointerdown', () => {
      btn_new.setTexture("down");
    });
    btn_new.on('pointerup', () => {
      btn_new.setTexture("up");
      this.scene.start("MainScene");
    });
  }
}

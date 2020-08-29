import "phaser";

export function load_all(scene: Phaser.Scene) {
  load_image(scene, "prison_tiles_extruded");

  load_image(scene, "health_background");
  load_image(scene, "health_bar");
  load_image(scene, "health_fill");
  load_image(scene, "cog_fill");
  load_image(scene, "status_bg");
  load_image(scene, "status_cover");

  load_image(scene, "enemy_vision_wedge");

  load_image(scene, "icon_unaware");
  load_image(scene, "icon_searching");
  load_image(scene, "icon_aware");

  load_any_spritesheet(scene, "health_orb", 64, 64);
  load_any_spritesheet(scene, "cognition_orb", 64, 64);
  load_any_spritesheet(scene, "rejuvination_orb", 64, 64);

  load_image(scene, "baton");
  load_image(scene, "knife");
  load_image(scene, "pistol");

  load_actor_spritesheet(scene, "player_none");
  load_actor_spritesheet(scene, "prison_guard");
  load_actor_spritesheet(scene, "prison_soldier");
  load_actor_spritesheet(scene, "prison_warden");

  load_image(scene, "UIImages/button_small_up");
  load_image(scene, "UIImages/button_small_down");
  load_image(scene, "UIImages/button_small_checked");

  load_image(scene, "UIImages/btn_wait_skin");
  load_image(scene, "UIImages/btn_bag_skin");
  load_image(scene, "UIImages/btn_grab_skin");
  load_image(scene, "UIImages/btn_target_skin");

  load_image(scene, "UIImages/btn_equipped_up");
  load_image(scene, "UIImages/btn_inventory_up");
}

export function create_anims(scene: Phaser.Scene) {
  create_actor_anims(scene, "player_none");
  create_actor_anims(scene, "prison_guard");
  create_actor_anims(scene, "prison_soldier");
  create_actor_anims(scene, "prison_warden");

  scene.anims.create({
    key: "health_orb",
    frames: scene.anims.generateFrameNumbers("health_orb", {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: "cognition_orb",
    frames: scene.anims.generateFrameNumbers("cognition_orb", {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: "rejuvination_orb",
    frames: scene.anims.generateFrameNumbers("rejuvination_orb", {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1,
  });
}

function load_image(scene: Phaser.Scene, name: string) {
  scene.load.image(name, "assets/sprites/" + name + ".png");
}

function load_actor_spritesheet(scene: Phaser.Scene, name: string) {
  scene.load.spritesheet(
    name, "assets/sprites/" + name + ".png",
    {frameWidth: 32, frameHeight: 32 });
}

function load_any_spritesheet(scene: Phaser.Scene, name: string, w: number, h: number) {
  scene.load.spritesheet(
    name, "assets/sprites/" + name + ".png",
    {frameWidth: w, frameHeight: h });
}

function create_actor_anims(scene: Phaser.Scene, name: string) {
  scene.anims.create({
    key: name + "_down",
    frames: scene.anims.generateFrameNumbers(name, {start: 0, end: 3}),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: name + "_up",
    frames: scene.anims.generateFrameNumbers(name, {start: 4, end: 7}),
    frameRate: 10,
    repeat: -1,
  });
  scene.anims.create({
    key: name + "_right",
    frames: scene.anims.generateFrameNumbers(name, {start: 8, end: 11}),
    frameRate: 10,
    repeat: -1,
  });
}

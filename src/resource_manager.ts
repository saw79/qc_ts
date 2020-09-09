import "phaser";

export function load_all(scene: Phaser.Scene) {
  load_image(scene, "prison_tiles_c_e");
  load_image(scene, "dark_lab_tiles_c_e");
  load_image(scene, "armory_tiles_c_e");
  load_image(scene, "advanced_research_facility_tiles_c_e");
  load_image(scene, "executive_offices_tiles_c_e");

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

  load_image(scene, "barrel_prison");
  load_image(scene, "barrel_dark_lab");
  load_image(scene, "barrel_armory");
  load_image(scene, "barrel_advanced_research_facility");
  load_image(scene, "barrel_executive_offices");

  load_any_spritesheet(scene, "gray_liquid_sheet", 64, 64);
  load_any_spritesheet(scene, "red_liquid_sheet", 64, 64);
  load_any_spritesheet(scene, "blue_liquid_sheet", 64, 64);
  load_any_spritesheet(scene, "green_liquid_sheet", 64, 64);
  load_any_spritesheet(scene, "yellow_liquid_sheet", 64, 64);

  load_image(scene, "fist");
  load_image(scene, "baton");
  load_image(scene, "mace");
  load_image(scene, "battle_axe");
  load_image(scene, "em_rod");
  load_image(scene, "double_em_rod");
  load_image(scene, "faraday_pole");
  load_image(scene, "quark_rod");
  load_image(scene, "quark_staff");
  load_image(scene, "quark_halberd");

  load_image(scene, "knife");
  load_image(scene, "spear");
  load_image(scene, "katana");
  load_image(scene, "stunner");
  load_image(scene, "electroblade");
  load_image(scene, "laser_blade");
  load_image(scene, "quark_spike");
  load_image(scene, "quark_blade");
  load_image(scene, "quark_spear");

  load_image(scene, "pistol");
  load_image(scene, "shotgun");
  load_image(scene, "assault_rifle");
  load_image(scene, "railgun");
  load_image(scene, "electrified_railgun");
  load_image(scene, "laser_gun");
  load_image(scene, "x_ray_gun");
  load_image(scene, "gamma_gun");
  load_image(scene, "spooky_gun");

  load_image(scene, "rigid_vest");
  load_image(scene, "combat_suit");
  load_image(scene, "reinforced_combat_suit");
  load_image(scene, "force_field_suit");
  load_image(scene, "quark_suit");

  load_actor_spritesheet(scene, "player_none");
  load_actor_spritesheet(scene, "player_rigid_vest");
  load_actor_spritesheet(scene, "player_combat_suit");
  load_actor_spritesheet(scene, "player_reinforced_combat_suit");
  load_actor_spritesheet(scene, "player_force_field_suit");
  load_actor_spritesheet(scene, "player_quark_suit");

  load_actor_spritesheet(scene, "prison_guard");
  load_actor_spritesheet(scene, "prison_soldier");
  load_actor_spritesheet(scene, "prison_warden");
  load_actor_spritesheet(scene, "enforcer");
  load_actor_spritesheet(scene, "technician");
  load_actor_spritesheet(scene, "engineer");
  load_actor_spritesheet(scene, "security_officer");
  load_actor_spritesheet(scene, "mad_scientist");
  load_actor_spritesheet(scene, "minibot");
  load_actor_spritesheet(scene, "turret");
  load_actor_spritesheet(scene, "droid");
  load_actor_spritesheet(scene, "megabot");
  load_actor_spritesheet(scene, "senior_technician");
  load_actor_spritesheet(scene, "senior_engineer");
  load_actor_spritesheet(scene, "marine");
  load_actor_spritesheet(scene, "chief_technical_officer");
  load_actor_spritesheet(scene, "SS_agent");
  load_actor_spritesheet(scene, "SS_gunner");
  load_actor_spritesheet(scene, "special_operative");
  load_actor_spritesheet(scene, "chief_executive_officer");

  load_image(scene, "UIImages/button_small_up");
  load_image(scene, "UIImages/button_small_down");
  load_image(scene, "UIImages/button_small_checked");

  load_image(scene, "UIImages/btn_wait_skin");
  load_image(scene, "UIImages/btn_bag_skin");
  load_image(scene, "UIImages/btn_grab_skin");
  load_image(scene, "UIImages/btn_target_skin");

  load_image(scene, "UIImages/btn_equipped_up");
  load_image(scene, "UIImages/btn_equipped_checked");
  load_image(scene, "UIImages/btn_inventory_up");
  load_image(scene, "UIImages/btn_inventory_checked");

  load_image(scene, "UIImages/button_wide_up");
  load_image(scene, "UIImages/button_wide_down");

  load_image(scene, "UIImages/label_bg");

  load_image(scene, "target");
  load_image(scene, "bullet");
  load_image(scene, "em_beam");
  load_image(scene, "particle_beam");
}

export function create_anims(scene: Phaser.Scene) {
  create_actor_anims(scene, "player_none");
  create_actor_anims(scene, "player_rigid_vest");
  create_actor_anims(scene, "player_combat_suit");
  create_actor_anims(scene, "player_reinforced_combat_suit");
  create_actor_anims(scene, "player_force_field_suit");
  create_actor_anims(scene, "player_quark_suit");

  create_actor_anims(scene, "prison_guard");
  create_actor_anims(scene, "prison_soldier");
  create_actor_anims(scene, "prison_warden");
  create_actor_anims(scene, "enforcer");
  create_actor_anims(scene, "technician");
  create_actor_anims(scene, "engineer");
  create_actor_anims(scene, "security_officer");
  create_actor_anims(scene, "mad_scientist");
  create_actor_anims(scene, "minibot");
  create_actor_anims(scene, "turret");
  create_actor_anims(scene, "droid");
  create_actor_anims(scene, "megabot");
  create_actor_anims(scene, "senior_technician");
  create_actor_anims(scene, "senior_engineer");
  create_actor_anims(scene, "marine");
  create_actor_anims(scene, "chief_technical_officer");
  create_actor_anims(scene, "SS_agent");
  create_actor_anims(scene, "SS_gunner");
  create_actor_anims(scene, "special_operative");
  create_actor_anims(scene, "chief_executive_officer");

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
  if (name == "chief_executive_officer") {
    scene.load.spritesheet(
      name, "assets/sprites/" + name + ".png",
      {frameWidth: 64, frameHeight: 64 });
  } else {
    scene.load.spritesheet(
      name, "assets/sprites/" + name + ".png",
      {frameWidth: 32, frameHeight: 32 });
  }
}

function load_any_spritesheet(scene: Phaser.Scene, name: string, w: number, h: number) {
  scene.load.spritesheet(
    name, "assets/sprites/" + name + ".png",
    {frameWidth: w, frameHeight: h });
}

function create_actor_anims(scene: Phaser.Scene, name: string) {
  if (name == "chief_executive_officer") {
    scene.anims.create({
      key: name + "_down",
      frames: scene.anims.generateFrameNumbers(name, {start: 0, end: 1}),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: name + "_up",
      frames: scene.anims.generateFrameNumbers(name, {start: 2, end: 3}),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: name + "_right",
      frames: scene.anims.generateFrameNumbers(name, {start: 4, end: 5}),
      frameRate: 10,
      repeat: -1,
    });
  } else {
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
}

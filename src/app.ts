import "phaser";
import {MenuScene} from "./menu_scene";
import {MainScene} from "./main_scene";
import {TransitionScene} from "./transition_scene";
import {DeathScene} from "./death_scene";

//import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import {NinePatchPlugin} from "@koreez/phaser3-ninepatch";
//import GesturesPlugin from "phaser3-rex-plugins/plugins/gestures-plugin";

let aspect = window.innerWidth / window.innerHeight;

const config = {
  title: "Quantum Cortex",
  width: 640 * aspect,
  height: 640,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
  },
  scene: [MenuScene, MainScene, TransitionScene, DeathScene],
  backgroundColor: "#000000",
  plugins: {
    global: [
      {
        key: "NinePatchPlugin",
        plugin: NinePatchPlugin,
        start: true
      },
    ]
  }
};

window.onload = () => {
  new Phaser.Game(config);
}

import "phaser";
import {MainScene} from "./main_scene";

//import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import {NinePatchPlugin} from "@koreez/phaser3-ninepatch";

let aspect = window.innerWidth / window.innerHeight;

const config = {
  title: "Quantum Cortex",
  width: 448 * aspect,
  height: 448,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
  },
  scene: [MainScene],
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

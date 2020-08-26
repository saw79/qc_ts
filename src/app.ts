import "phaser";
import {MainScene} from "./main_scene";

//import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import {NinePatchPlugin} from "@koreez/phaser3-ninepatch";

const config = {
  title: "Quantum Cortex",
  width: 1000,
  height: 700,
  parent: "game",
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

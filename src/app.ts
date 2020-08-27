import "phaser";
import {MainScene} from "./main_scene";

//import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import {NinePatchPlugin} from "@koreez/phaser3-ninepatch";

//console.log(window.innerWidth, window.innerHeight, window.devicePixelRatio);

const config = {
  title: "Quantum Cortex",
  width: window.innerWidth*window.devicePixelRatio,
  height: window.innerHeight*window.devicePixelRatio,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
  },
  scene: [() => {
    return new MainScene(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  }],//MainScene],
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

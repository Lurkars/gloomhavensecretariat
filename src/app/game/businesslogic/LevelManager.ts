import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { settingsManager } from "./SettingsManager";

export class LevelManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  ge5PlayerOffset(): number {
    if (!settingsManager.settings.ge5Player) {
      return 0;
    }
    const chars = this.game.figures.filter((figure) => figure instanceof Character).length;
    if (chars < 4) {
      return 0;
    }

    return chars - 3;
  }

  level(): number {
    return this.game.level - this.ge5PlayerOffset();
  }

  trap(): number {
    return 2 + this.game.level;
  }

  experience(): number {
    return 4 + this.level() * 2;
  }

  loot(): number {
    let loot = 2 + Math.floor(this.level() / 2);
    if (this.level() >= 7) {
      loot = 6;
    }
    return loot;
  }

  terrain(): number {
    return 1 + Math.ceil(this.game.level / 3);
  }



  scenarioLevel(): number {
    const charCount = this.game.figures.filter((figure) => figure instanceof Character).length;

    if (charCount == 0) {
      return 0;
    }

    const charLevel = this.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).level).reduce((a, b) => a + b);


    return Math.ceil(((charLevel / charCount) + (this.game.solo ? 1 : 0)) / 2) + this.ge5PlayerOffset();
  }


  calculateScenarioLevel() {
    if (settingsManager.settings.levelAdjustment > 6) {
      settingsManager.settings.levelAdjustment = 6;
    } else if (settingsManager.settings.levelAdjustment < -6) {
      settingsManager.settings.levelAdjustment = -6;
    }

    let level = this.scenarioLevel() + settingsManager.settings.levelAdjustment;
    if (level > 7) {
      level = 7;
    } else if (level < 0) {
      level = 0;
    }
    this.setLevel(level);
  }



  setLevel(level: number) {
    if (this.game.level != level) {
      this.game.level = level;

      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster) {
          figure.level = level;
          figure.entities.forEach((monsterEntity) => {
            monsterEntity.level = level
          })
        }
      })
    }
  }
}
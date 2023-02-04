import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class LevelManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  ge5PlayerOffset(): number {
    if (!this.game.ge5Player) {
      return 0;
    }
    const chars = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
    if (chars <= 4) {
      return 0;
    }

    return chars - 3;
  }

  adjustedLevel(): number {
    const level = this.game.level - this.ge5PlayerOffset() - (this.game.solo && !gameManager.fhRules() && !settingsManager.settings.alwaysFhSolo ? 1 : 0) + this.game.bonusAdjustment;
    if (level < 0) {
      return 0;
    } else if (level > 7) {
      return 7;
    }
    return level;
  }

  trap(): number {
    return 2 + this.game.level;
  }

  experience(): number {
    return 4 + this.adjustedLevel() * 2;
  }

  loot(): number {
    let loot = 2 + Math.floor(this.adjustedLevel() / 2);
    if (this.adjustedLevel() >= 7) {
      loot = 6;
    }
    return loot;
  }

  terrain(): number {
    if (settingsManager.settings.alwaysHazardousTerrain || gameManager.fhRules()) {
      return Math.floor(this.trap() / 2);
    }
    return 1 + Math.ceil(this.game.level / 3);
  }

  scenarioLevel(): number {
    const charCount = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;

    if (charCount == 0) {
      return 0;
    }

    const charLevel = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => (figure as Character).level).reduce((a, b) => a + b);


    return Math.ceil(((charLevel / charCount) + (this.game.solo && ((gameManager.fhRules() || settingsManager.settings.alwaysFhSolo ? 1 : 0)) ? 1 : 0)) / 2) + (this.game.solo && !gameManager.fhRules() && !settingsManager.settings.alwaysFhSolo ? 1 : 0) + this.ge5PlayerOffset();
  }

  calculateScenarioLevel() {
    if (this.game.levelAdjustment > 6) {
      this.game.levelAdjustment = 6;
    } else if (this.game.levelAdjustment < -6) {
      this.game.levelAdjustment = -6;
    }

    let level = this.scenarioLevel() + this.game.levelAdjustment;
    if (level > 7) {
      level = 7;
    } else if (level < 0) {
      level = 0;
    }
    this.setLevel(level);
  }

  setLevel(level: number) {
    if (this.game.level != level) {
      const diff = level - this.game.level;
      this.game.level = level;

      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster) {
          figure.level += diff;
          if (figure.level > 7) {
            figure.level = 7;
          } else if (figure.level < 0) {
            figure.level = 0;
          }
          gameManager.monsterManager.setLevel(figure, figure.level)
        }
      })
    }
  }
}
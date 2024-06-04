import { Character } from "../model/Character";
import { EntityValueFunction } from "../model/Entity";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
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
    const chars = gameManager.characterManager.characterCount();
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

  trap(level: number = -1): number {
    if (level < 0 || level > 7) {
      level = this.game.level;
    }
    return 2 + level;
  }

  experience(level: number = -1): number {
    if (level < 0 || level > 7) {
      level = this.adjustedLevel();
    }
    return 4 + level * 2;
  }

  loot(level: number = -1): number {
    if (level < 0 || level > 7) {
      level = this.adjustedLevel();
    }
    let loot = 2 + Math.floor(level / 2);
    if (level >= 7) {
      loot = 6;
    }
    return loot;
  }

  terrain(level: number = -1): number {
    if (settingsManager.settings.alwaysHazardousTerrain || gameManager.fhRules()) {
      if (level < 0 || level > 7) {
        level = this.game.level;
      }
      return 1 + Math.ceil(level / 3);
    }
    return Math.floor(this.trap(level) / 2);
  }

  bbMonsterDifficutly(): number {
    let monsterDifficulty = 2 + gameManager.game.levelAdjustment;
    if (monsterDifficulty < 0) {
      monsterDifficulty = 0;
    } else if (monsterDifficulty > 4) {
      monsterDifficulty = 4;
    }
    return monsterDifficulty;
  }

  scenarioLevel(): number {
    const charCount = gameManager.characterManager.characterCount();

    if (charCount == 0) {
      return 1;
    }

    const charLevel = this.game.figures.some((figure) => figure instanceof Character) ? this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => (figure as Character).level).reduce((a, b) => a + b) : 1;


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
        } else if (figure instanceof ObjectiveContainer) {
          figure.entities.forEach((objectiveEntity) => {
            if (objectiveEntity.health > EntityValueFunction(figure.health)) {
              figure.health = EntityValueFunction(figure.health);
            }
          })
        }
      })
    }
  }
}
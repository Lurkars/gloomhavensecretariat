import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

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
    const level =
      this.game.level -
      this.ge5PlayerOffset() -
      (this.game.solo && !gameManager.fhRules(true) && !settingsManager.settings.alwaysFhSolo ? 1 : 0) +
      this.game.bonusAdjustment;
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

    return 2 + Math.floor(level / 2) + Math.floor(level / 7);
  }

  terrain(level: number = -1): number {
    if (settingsManager.settings.alwaysHazardousTerrain || gameManager.fhRules(true)) {
      if (level < 0 || level > 7) {
        level = this.game.level;
      }

      return 1 + Math.ceil(level / 3);
    }
    return Math.floor(this.trap(level) / 2);
  }

  bbMonsterDifficutly(): number {
    let monsterDifficulty = 2 + this.game.levelAdjustment;
    if (monsterDifficulty < 0) {
      monsterDifficulty = 0;
    } else if (monsterDifficulty > 4) {
      monsterDifficulty = 4;
    }
    return monsterDifficulty;
  }

  scenarioLevel(): number {
    const charCount = gameManager.characterManager.characterCount();

    if (charCount === 0) {
      return 1;
    }

    const charLevel = this.game.figures.some((figure) => figure instanceof Character)
      ? this.game.figures
          .filter((figure) => figure instanceof Character && !figure.absent)
          .map((figure) => (figure as Character).level)
          .reduce((a, b) => a + b, 0)
      : 1;

    return (
      Math.ceil(
        (charLevel / charCount + (this.game.solo && (gameManager.fhRules(true) || settingsManager.settings.alwaysFhSolo ? 1 : 0) ? 1 : 0)) /
          2
      ) +
      (this.game.solo && !gameManager.fhRules(true) && !settingsManager.settings.alwaysFhSolo ? 1 : 0) +
      this.ge5PlayerOffset()
    );
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

  setLevel(level: number, force: boolean = false) {
    if (this.game.level !== level || force) {
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
          gameManager.monsterManager.setLevel(figure, figure.level);
        } else if (figure instanceof ObjectiveContainer) {
          figure.entities.forEach((objectiveEntity) => {
            if (objectiveEntity.health > EntityValueFunction(figure.health)) {
              objectiveEntity.health = EntityValueFunction(figure.health);
            }
          });
        }
      });
    }
  }

  canSetManualLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 0 && level <= 7;
  }

  setManualLevel(level: number): boolean {
    if (!this.canSetManualLevel(level)) {
      return false;
    }
    this.setLevel(level);
    this.game.levelCalculation = false;
    return true;
  }

  setSolo(solo: boolean): boolean {
    if (typeof solo !== 'boolean') {
      return false;
    }
    this.game.solo = solo;
    return true;
  }

  canSetPlayerCount(playerCount: number): boolean {
    return Number.isInteger(playerCount) && (playerCount === -1 || playerCount > 0);
  }

  canSetBbMonsterDifficulty(level: number): boolean {
    return Number.isInteger(level) && level >= 0 && level <= 4;
  }

  private recalculate() {
    if (this.game.levelCalculation) {
      this.calculateScenarioLevel();
    }
  }

  setLevelCalculation(enabled: boolean) {
    this.game.levelCalculation = enabled;
    this.recalculate();
  }

  setLevelAdjustment(value: number) {
    this.game.levelAdjustment = value;
    this.recalculate();
  }

  setBonusAdjustment(value: number) {
    this.game.bonusAdjustment = value;
    this.recalculate();
  }

  setGe5Player(enabled: boolean) {
    this.game.ge5Player = enabled;
    this.recalculate();
  }

  setGe5PlayerCapped(enabled: boolean) {
    this.game.ge5PlayerCapped = enabled;
    this.setLevel(this.game.level, true);
  }

  setPlayerCount(playerCount: number): boolean {
    if (!this.canSetPlayerCount(playerCount)) {
      return false;
    }
    const enabling = this.game.playerCount === -1 && playerCount !== -1;
    this.game.playerCount = playerCount;
    if (enabling) {
      this.game.levelCalculation = false;
    } else {
      this.recalculate();
    }
    return true;
  }

  setBbMonsterDifficulty(level: number): boolean {
    if (!this.canSetBbMonsterDifficulty(level)) {
      return false;
    }
    this.game.levelAdjustment = level - 2;
    const attackModifiers = gameManager.attackModifierBuildManager.bbMonsterAttackModifiers();
    if (attackModifiers) {
      this.game.monsterAttackModifierDeck.attackModifiers = attackModifiers;
      this.game.monsterAttackModifierDeck.cards = gameManager.attackModifierBuildManager.bbMonsterAttackModifiers() || [];
    }
    this.game.monsterAttackModifierDeck.bb = settingsManager.settings.bbAm;
    return true;
  }

  characterCountVariable(): number {
    let result: number = gameManager.characterManager.characterCount();
    result = Math.max(2, result);

    if (!this.game.ge5Player || this.game.ge5PlayerCapped) {
      result = Math.min(4, result);
    }

    return result;
  }
}

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/data/AttackModifier';

function recalculate() {
  if (gameManager.game.levelCalculation) {
    gameManager.levelManager.calculateScenarioLevel();
  }
}

export class LevelSetCommand extends CommandImpl {
  id: string = 'level.set';
  requiredParameters: number = 1;

  validParameters(level: number): boolean {
    return typeof level === 'number' && level >= 0 && level <= 7;
  }

  executeWithParameters(level: number) {
    gameManager.levelManager.setLevel(level);
    gameManager.game.levelCalculation = false;
  }
}

export class LevelCalculationCommand extends CommandImpl {
  id: string = 'level.calculation';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.game.levelCalculation = enabled;
    recalculate();
  }
}

export class LevelAdjustmentCommand extends CommandImpl {
  id: string = 'level.adjustment';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number';
  }

  executeWithParameters(value: number) {
    gameManager.game.levelAdjustment = value;
    recalculate();
  }
}

export class LevelBonusCommand extends CommandImpl {
  id: string = 'level.bonus';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number';
  }

  executeWithParameters(value: number) {
    gameManager.game.bonusAdjustment = value;
    recalculate();
  }
}

export class LevelBbDifficultyCommand extends CommandImpl {
  id: string = 'level.bbDifficulty';
  requiredParameters: number = 1;

  validParameters(level: number): boolean {
    return typeof level === 'number' && level >= 0 && level <= 4;
  }

  executeWithParameters(level: number) {
    gameManager.game.levelAdjustment = level - 2;
    const editionData = gameManager.editionData.find(
      (editionData) => editionData.edition === 'bb' && editionData.monsterAmTables && editionData.monsterAmTables.length
    );
    if (editionData) {
      const monsterDifficulty = gameManager.levelManager.bbMonsterDifficutly();
      gameManager.game.monsterAttackModifierDeck.attackModifiers = editionData.monsterAmTables[monsterDifficulty].map(
        (value) => new AttackModifier(value as AttackModifierType)
      );
      gameManager.game.monsterAttackModifierDeck.cards = editionData.monsterAmTables[monsterDifficulty].map(
        (value) => new AttackModifier(value as AttackModifierType)
      );
    }
    gameManager.game.monsterAttackModifierDeck.bb = settingsManager.settings.bbAm;
  }
}

export class LevelGe5PlayerCommand extends CommandImpl {
  id: string = 'level.ge5Player';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.game.ge5Player = enabled;
    recalculate();
  }
}

export class LevelGe5PlayerCappedCommand extends CommandImpl {
  id: string = 'level.ge5PlayerCapped';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.game.ge5PlayerCapped = enabled;
    gameManager.levelManager.setLevel(gameManager.game.level, true);
  }
}

export class LevelPlayerCountCommand extends CommandImpl {
  id: string = 'level.playerCount';
  requiredParameters: number = 1;

  validParameters(playerCount: number): boolean {
    return typeof playerCount === 'number' && (playerCount === -1 || playerCount > 0);
  }

  executeWithParameters(playerCount: number) {
    const enabling = gameManager.game.playerCount === -1 && playerCount !== -1;
    gameManager.game.playerCount = playerCount;
    if (enabling) {
      gameManager.game.levelCalculation = false;
    } else {
      recalculate();
    }
  }
}

export class LevelSoloCommand extends CommandImpl {
  id: string = 'level.solo';
  requiredParameters: number = 1;

  validParameters(solo: boolean): boolean {
    return typeof solo === 'boolean';
  }

  executeWithParameters(solo: boolean) {
    gameManager.game.solo = solo;
  }
}

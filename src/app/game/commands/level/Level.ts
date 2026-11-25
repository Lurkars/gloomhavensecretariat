import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';

export class LevelSetCommand extends CommandImpl {
  id: string = 'level.set';
  requiredParameters: number = 1;

  validParameters(level: number): boolean {
    return typeof level === 'number' && gameManager.levelManager.canSetManualLevel(level);
  }

  executeWithParameters(level: number) {
    gameManager.levelManager.setManualLevel(level);
  }
}

export class LevelCalculationCommand extends CommandImpl {
  id: string = 'level.calculation';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.levelManager.setLevelCalculation(enabled);
  }
}

export class LevelAdjustmentCommand extends CommandImpl {
  id: string = 'level.adjustment';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number';
  }

  executeWithParameters(value: number) {
    gameManager.levelManager.setLevelAdjustment(value);
  }
}

export class LevelBonusCommand extends CommandImpl {
  id: string = 'level.bonus';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number';
  }

  executeWithParameters(value: number) {
    gameManager.levelManager.setBonusAdjustment(value);
  }
}

export class LevelBbDifficultyCommand extends CommandImpl {
  id: string = 'level.bbDifficulty';
  requiredParameters: number = 1;

  validParameters(level: number): boolean {
    return typeof level === 'number' && gameManager.levelManager.canSetBbMonsterDifficulty(level);
  }

  executeWithParameters(level: number) {
    gameManager.levelManager.setBbMonsterDifficulty(level);
  }
}

export class LevelGe5PlayerCommand extends CommandImpl {
  id: string = 'level.ge5Player';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.levelManager.setGe5Player(enabled);
  }
}

export class LevelGe5PlayerCappedCommand extends CommandImpl {
  id: string = 'level.ge5PlayerCapped';
  requiredParameters: number = 1;

  validParameters(enabled: boolean): boolean {
    return typeof enabled === 'boolean';
  }

  executeWithParameters(enabled: boolean) {
    gameManager.levelManager.setGe5PlayerCapped(enabled);
  }
}

export class LevelPlayerCountCommand extends CommandImpl {
  id: string = 'level.playerCount';
  requiredParameters: number = 1;

  validParameters(playerCount: number): boolean {
    return typeof playerCount === 'number' && gameManager.levelManager.canSetPlayerCount(playerCount);
  }

  executeWithParameters(playerCount: number) {
    gameManager.levelManager.setPlayerCount(playerCount);
  }
}

export class LevelSoloCommand extends CommandImpl {
  id: string = 'level.solo';
  requiredParameters: number = 1;

  validParameters(solo: boolean): boolean {
    return typeof solo === 'boolean';
  }

  executeWithParameters(solo: boolean) {
    gameManager.levelManager.setSolo(solo);
  }
}

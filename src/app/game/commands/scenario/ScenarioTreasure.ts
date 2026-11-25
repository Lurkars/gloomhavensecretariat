import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';

function treasures(): ('G' | number)[] {
  return gameManager.game.scenario ? gameManager.treasureManager.getTreasures(gameManager.game.scenario, gameManager.game.sections) : [];
}

export class ScenarioTreasureLootCommand extends CommandImpl {
  id: string = 'scenario.treasure.loot';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    const treasure = treasures()[index];
    return !!character && treasure !== undefined && gameManager.treasureManager.canLootScenarioTreasure(character, treasure, index);
  }

  executeWithParameters(number: number, index: number, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    const treasure = treasures()[index];
    const edition = gameManager.game.scenario ? gameManager.game.scenario.edition : gameManager.editionManager.currentEdition();
    if (character && treasure !== undefined) {
      gameManager.treasureManager.lootScenarioTreasure(character, treasure, index, edition);
    } else {
      this.executionError('character or treasure not found');
    }
  }
}

export class ScenarioTreasureRemoveCommand extends CommandImpl {
  id: string = 'scenario.treasure.remove';
  requiredParameters: number = 2;

  validParameters(number: number, treasure: string | number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.treasureManager.canRemoveScenarioTreasure(character, treasure);
  }

  executeWithParameters(number: number, treasure: string | number) {
    const character = findCharacter(number);
    const edition = gameManager.game.scenario ? gameManager.game.scenario.edition : gameManager.editionManager.currentEdition();
    if (character) {
      gameManager.treasureManager.removeScenarioTreasure(character, treasure, edition);
    } else {
      this.executionError('character not found');
    }
  }
}

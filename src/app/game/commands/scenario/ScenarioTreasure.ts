import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

function treasures(): ('G' | number)[] {
  return gameManager.game.scenario ? gameManager.scenarioManager.getTreasures(gameManager.game.scenario, gameManager.game.sections) : [];
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
    return (
      !!character &&
      !character.absent &&
      treasure !== undefined &&
      !character.treasures.includes(treasure === 'G' ? 'G-' + index : treasure) &&
      !gameManager.game.figures.some(
        (figure) => figure instanceof Character && figure !== character && gameManager.lootManager.hasTreasure(figure, treasure, index)
      )
    );
  }

  executeWithParameters(number: number, index: number, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    const treasure = treasures()[index];
    const edition = gameManager.game.scenario ? gameManager.game.scenario.edition : gameManager.currentEdition();
    if (character && treasure !== undefined) {
      gameManager.lootManager.lootScenarioTreasure(character, treasure, index, edition);
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
    return !!character && (character.treasures || []).includes(treasure);
  }

  executeWithParameters(number: number, treasure: string | number) {
    const character = findCharacter(number);
    const edition = gameManager.game.scenario ? gameManager.game.scenario.edition : gameManager.currentEdition();
    if (character) {
      gameManager.lootManager.removeScenarioTreasure(character, treasure, edition);
    } else {
      this.executionError('character not found');
    }
  }
}

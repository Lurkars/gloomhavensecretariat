import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Identifier } from 'src/app/game/model/data/Identifier';

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
      let rewardResults: string[][] = [];
      if (treasure !== 'G' && settingsManager.settings.treasuresLoot) {
        rewardResults = gameManager.lootManager.lootTreasure(character, treasure - 1, edition);
      }
      character.treasures = character.treasures || [];
      character.treasures.push(
        treasure === 'G'
          ? 'G-' + index
          : rewardResults.some((rewardResult) => rewardResult.length > 0)
            ? treasure + ':' + rewardResults.map((reward) => reward.join('+')).join('|')
            : treasure
      );
      if (typeof treasure === 'number') {
        gameManager.game.party.treasures.push(new Identifier(treasure, edition));
      }
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
      character.treasures.splice(character.treasures.indexOf(treasure), 1);
      const treasureNumber = typeof treasure === 'number' ? treasure : +treasure.split(':')[0];
      if (!isNaN(treasureNumber)) {
        gameManager.game.party.treasures = gameManager.game.party.treasures.filter(
          (value) => value.edition !== edition || value.name !== '' + treasureNumber
        );
      }
    } else {
      this.executionError('character not found');
    }
  }
}

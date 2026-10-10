import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterLootDrawCommand extends CommandImpl {
  id: string = 'character.loot.draw';
  requiredParameters: number = 2;

  constructor(...parameters: BASE_TYPE[]) {
    super(...parameters);
  }

  validParameters(number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      (settingsManager.settings.lootDeck &&
        Object.keys(gameManager.game.lootDeck.cards).length > 0 &&
        gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === number && figure.active) !==
          undefined) ||
      false
    );
  }

  executeWithParameters(number: number, seed: number) {
    gameManager.game.seed = seed;
    const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === number) as Character;
    if (character && character.active) {
      gameManager.lootManager.drawCard(gameManager.game.lootDeck, character);
    } else {
      this.executionError('character not found or invalid');
    }
  }

  override before(): BASE_TYPE[] {
    const character = gameManager.game.figures.find(
      (figure) => figure instanceof Character && figure.number === this.parameters[0]
    ) as Character;
    if (character) {
      return ['command.' + this.id, gameManager.characterManager.characterName(character, true, true)];
    }

    return ['command.invalid.' + this.id, ...this.parameters];
  }
}

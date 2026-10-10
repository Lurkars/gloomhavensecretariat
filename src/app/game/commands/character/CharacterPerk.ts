import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPerkCommand extends CommandImpl {
  id: string = 'character.perk';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      typeof index === 'number' &&
      !!character.perks[index] &&
      typeof value === 'number' &&
      value >= 0 &&
      value <= character.perks[index].count
    );
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      const shackles = character.name === 'shackles' && character.edition === 'fh' && index === 11;
      const lowerShacklesHP = shackles && character.progress.perks[index] === 2;
      character.progress.perks[index] = value;

      const perk = character.perks[index];
      if (perk.monsterDeck) {
        gameManager.game.monsterAttackModifierDeck = gameManager.attackModifierManager.buildMonsterAttackModifierDeck();
        gameManager.attackModifierManager.shuffleModifiers(gameManager.game.monsterAttackModifierDeck);
      } else {
        gameManager.attackModifierManager.mergeAttackModifierDeck(
          character.attackModifierDeck,
          gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character)
        );
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);

        if (shackles) {
          if (character.progress.perks[index] === 2 && !lowerShacklesHP) {
            character.maxHealth += 5;
          } else if (lowerShacklesHP && character.progress.perks[index] !== 2) {
            character.maxHealth -= 5;
          }
          character.health = character.maxHealth;
        }
      }
    } else {
      this.executionError('character not found');
    }
  }
}

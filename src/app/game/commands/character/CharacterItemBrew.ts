import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';

export class CharacterItemBrewCommand extends CommandImpl {
  id: string = 'character.item.brew';
  requiredParameters: number = 4;

  receipe(): LootType[] {
    return this.parameters.slice(2, 5).filter((herb) => !!herb) as LootType[];
  }

  available(brewer: Character | undefined, herb: LootType): number {
    return ((brewer && brewer.progress.loot[herb]) || 0) + (gameManager.game.party.loot[herb] || 0);
  }

  validParameters(brewer: number, target: number, ...herbs: string[]): boolean {
    const brewerCharacter = findCharacter(brewer);
    const targetCharacter = findCharacter(target);
    const receipe = herbs.filter((herb) => !!herb) as LootType[];
    const item = gameManager.itemManager.brewedItem(receipe);
    return (
      (brewer === -1 || !!brewerCharacter) &&
      !!targetCharacter &&
      receipe.length >= 2 &&
      receipe.length <= 3 &&
      receipe.every((herb) => herbResourceLootTypes.includes(herb)) &&
      receipe.every((herb) => this.available(brewerCharacter, herb) >= receipe.filter((other) => other === herb).length) &&
      !!item &&
      !targetCharacter.progress.items.some((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition)
    );
  }

  executeWithParameters(brewer: number, target: number) {
    const brewerCharacter = findCharacter(brewer);
    const targetCharacter = findCharacter(target);
    const receipe = this.receipe();
    const item = gameManager.itemManager.brewedItem(receipe);
    if (targetCharacter && item) {
      const payment = gameManager.itemManager.brewPayment(brewerCharacter, receipe);
      gameManager.itemManager.brewPotion(item, targetCharacter, brewerCharacter, payment.characterSpent, payment.partySpent);
    } else {
      this.executionError('character or potion not found');
    }
  }
}

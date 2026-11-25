import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';

export class CharacterItemBrewCommand extends CommandImpl {
  id: string = 'character.item.brew';
  requiredParameters: number = 4;

  receipe(): LootType[] {
    return this.parameters.slice(2, 5).filter((herb) => !!herb) as LootType[];
  }

  force(): boolean {
    return this.parameters[5] === true;
  }

  validParameters(brewer: number, target: number): boolean {
    const brewerCharacter = findCharacter(brewer);
    const targetCharacter = findCharacter(target);
    const receipe = this.receipe();
    if ((brewer !== -1 && !brewerCharacter) || !targetCharacter || receipe.some((herb) => !herbResourceLootTypes.includes(herb))) {
      return false;
    }
    const payment = gameManager.itemManager.brewPayment(brewerCharacter, receipe);
    return gameManager.itemManager.canBrewPotion(
      receipe,
      targetCharacter,
      brewerCharacter,
      payment.characterSpent,
      payment.partySpent,
      this.force()
    );
  }

  executeWithParameters(brewer: number, target: number) {
    const brewerCharacter = findCharacter(brewer);
    const targetCharacter = findCharacter(target);
    const receipe = this.receipe();
    if (targetCharacter) {
      const payment = gameManager.itemManager.brewPayment(brewerCharacter, receipe);
      gameManager.itemManager.brewPotion(
        receipe,
        targetCharacter,
        brewerCharacter,
        payment.characterSpent,
        payment.partySpent,
        this.force()
      );
    } else {
      this.executionError('character not found');
    }
  }
}

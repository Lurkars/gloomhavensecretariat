import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';

export class CharacterItemBrewCommand extends CommandImpl {
  id: string = 'character.item.brew';
  requiredParameters: number = 4;

  receipe(): LootType[] {
    return this.parameters.slice(2, 5).filter((herb) => !!herb) as LootType[];
  }

  brewedItem(receipe: LootType[]): ItemData | undefined {
    if (receipe.length < 2) {
      return undefined;
    }
    const duplicates = receipe.filter((herb, index, self) => self.indexOf(herb) === index).length !== receipe.length;
    return gameManager.itemManager
      .getItems(gameManager.currentEdition(), true)
      .find(
        (itemData) =>
          (!itemData.requiredItems || !itemData.requiredItems.length) &&
          itemData.requiredBuilding === 'alchemist' &&
          (receipe.length < 3 ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) &&
          (duplicates
            ? !itemData.resources
            : itemData.resources &&
              herbResourceLootTypes.every(
                (herb) => itemData.resources && receipe.filter((value) => value === herb).length === (itemData.resources[herb] || 0)
              ))
      );
  }

  available(brewer: Character | undefined, herb: LootType): number {
    return ((brewer && brewer.progress.loot[herb]) || 0) + (gameManager.game.party.loot[herb] || 0);
  }

  validParameters(brewer: number, target: number, ...herbs: string[]): boolean {
    const brewerCharacter = findCharacter(brewer);
    const targetCharacter = findCharacter(target);
    const receipe = herbs.filter((herb) => !!herb) as LootType[];
    const item = this.brewedItem(receipe);
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
    const item = this.brewedItem(receipe);
    if (targetCharacter && item) {
      receipe.forEach((herb) => {
        if (brewerCharacter && (brewerCharacter.progress.loot[herb] || 0) > 0) {
          brewerCharacter.progress.loot[herb] = (brewerCharacter.progress.loot[herb] || 0) - 1;
        } else {
          gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) - 1;
        }
      });
      if (
        !gameManager.game.party.unlockedItems.find((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition)
      ) {
        gameManager.game.party.unlockedItems.push(new CountIdentifier(item.id, item.edition));
      }
      gameManager.itemManager.addItem(item, targetCharacter);
    } else {
      this.executionError('character or potion not found');
    }
  }
}

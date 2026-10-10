import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findMonster } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

export class MonsterCatchCommand extends CommandImpl {
  id: string = 'monster.catch';
  requiredParameters: number = 2;

  captureItem(equippedItem: AdditionalIdentifier): boolean {
    return (
      equippedItem.edition === 'fh' &&
      equippedItem.name === '247' &&
      (!equippedItem.tags || !equippedItem.tags.includes(ItemFlags.consumed))
    );
  }

  captureCharacter(): Character | undefined {
    return gameManager.game.figures.find(
      (figure) => figure instanceof Character && figure.progress.equippedItems.some((item) => this.captureItem(item))
    ) as Character | undefined;
  }

  validParameters(figureId: string, number: number, force: boolean = false): boolean {
    const monster = findMonster(figureId);
    return (
      gameManager.buildingsManager.petsEnabled &&
      !!monster &&
      !!monster.pet &&
      findEntity(monster, number) instanceof MonsterEntity &&
      (force || !!this.captureCharacter())
    );
  }

  executeWithParameters(figureId: string, number: number, force: boolean = false) {
    const monster = findMonster(figureId);
    const entity = findEntity(monster, number);
    if (monster && entity instanceof MonsterEntity) {
      entity.dead = true;

      if (monster.entities.every((monsterEntity) => monsterEntity.dead) && monster.active) {
        gameManager.roundManager.toggleFigure(monster);
      }

      if (!gameManager.game.party.pets.some((value) => value.edition === monster.edition && value.name === monster.pet)) {
        gameManager.game.party.pets.push(new PetIdentifier(monster.pet, monster.edition));
        const character = this.captureCharacter();
        if (character && !force) {
          const item = character.progress.equippedItems.find((equippedItem) => this.captureItem(equippedItem));
          if (item) {
            item.tags = item.tags || [];
            item.tags.push(ItemFlags.consumed);
          }
        }
      }

      gameManager.monsterManager.removeMonsterEntity(monster, entity);
    } else {
      this.executionError('monster standee not found');
    }
  }
}

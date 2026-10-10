import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { LootType } from 'src/app/game/model/data/Loot';

export class CharacterMoveResourceCommand extends CommandImpl {
  id: string = 'character.moveResource';
  requiredParameters: number = 3;

  validParameters(number: number, type: string, value: number): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      Object.values(LootType).includes(type as LootType) &&
      typeof value === 'number' &&
      value > 0 &&
      (character.progress.loot[type as LootType] || 0) >= value
    );
  }

  executeWithParameters(number: number, type: LootType, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.game.party.loot[type] = (gameManager.game.party.loot[type] || 0) + value;
      character.progress.loot[type] = (character.progress.loot[type] || 0) - value;
    } else {
      this.executionError('character not found');
    }
  }
}

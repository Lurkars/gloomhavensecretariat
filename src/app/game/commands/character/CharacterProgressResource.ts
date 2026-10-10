import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { LootType } from 'src/app/game/model/data/Loot';

export class CharacterProgressResourceCommand extends CommandImpl {
  id: string = 'character.progress.resource';
  requiredParameters: number = 3;

  validParameters(number: number, type: string, value: number): boolean {
    return !!findCharacter(number) && Object.values(LootType).includes(type as LootType) && typeof value === 'number' && value >= 0;
  }

  executeWithParameters(number: number, type: LootType, value: number) {
    const character = findCharacter(number);
    if (character) {
      character.progress.loot[type] = value;
    } else {
      this.executionError('character not found');
    }
  }
}

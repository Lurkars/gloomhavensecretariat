import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

const PROGRESS_FIELDS: { [key: string]: { text: boolean } } = {
  gold: { text: false },
  extraPerks: { text: false },
  retirements: { text: false },
  battleGoals: { text: false },
  notes: { text: true },
  itemNotes: { text: true }
};

export class CharacterProgressSetCommand extends CommandImpl {
  id: string = 'character.progress.set';
  requiredParameters: number = 3;

  validParameters(number: number, field: string, value: string | number): boolean {
    const progressField = PROGRESS_FIELDS[field];
    return (
      !!findCharacter(number) &&
      !!progressField &&
      (progressField.text ? typeof value === 'string' : typeof value === 'number' && value >= 0)
    );
  }

  executeWithParameters(number: number, field: string, value: string | number) {
    const character = findCharacter(number);
    if (character) {
      switch (field) {
        case 'gold':
          character.progress.gold = value as number;
          break;
        case 'extraPerks':
          character.progress.extraPerks = value as number;
          break;
        case 'retirements':
          character.progress.retirements = value as number;
          break;
        case 'battleGoals':
          character.progress.battleGoals = value as number;
          break;
        case 'notes':
          character.progress.notes = value as string;
          break;
        case 'itemNotes':
          character.progress.itemNotes = value as string;
          break;
      }
    } else {
      this.executionError('character not found');
    }
  }
}

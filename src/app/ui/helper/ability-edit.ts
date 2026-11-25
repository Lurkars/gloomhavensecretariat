import { Character } from 'src/app/game/model/Character';

// characters whose ability cards are currently edited (enhancement slots clickable), UI only, never part of the game state
const editing = new Set<string>();

function key(character: Character): string {
  return character.edition + '-' + character.name;
}

export function setAbilityCardsEditing(character: Character, value: boolean) {
  if (value) {
    editing.add(key(character));
  } else {
    editing.delete(key(character));
  }
}

export function abilityCardsEditing(character: Character | undefined): boolean {
  return !!character && editing.has(key(character));
}

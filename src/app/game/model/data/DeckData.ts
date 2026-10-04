import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Editional } from 'src/app/game/model/data/Editional';

export class DeckData implements Editional {
  name: string;
  character: boolean;
  abilities: AbilityCard[];

  // from Editional
  edition: string;

  constructor(edition: string = '', name: string = '', character = false, abilityCards: AbilityCard[] = []) {
    this.name = name;
    this.abilities = abilityCards;
    this.edition = edition;
    this.character = character;
  }
}

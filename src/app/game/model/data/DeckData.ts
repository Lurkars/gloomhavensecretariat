import { Ability } from 'src/app/game/model/data/Ability';
import { Editional } from 'src/app/game/model/data/Editional';

export class DeckData implements Editional {
  name: string;
  character: boolean;
  abilities: Ability[];

  // from Editional
  edition: string;

  constructor(edition: string = '', name: string = '', character = false, abilities: Ability[] = []) {
    this.name = name;
    this.abilities = abilities;
    this.edition = edition;
    this.character = character;
  }
}

import { Ability } from "./Ability";
import { Editional } from "./Editional";

export class DeckData implements Editional {

  name: string;
  character: boolean;
  abilities: Ability[];

  // from Editional
  edition: string;

  constructor(edition: string = "", name: string = "", character = false, abilities: Ability[] = []) {
    this.name = name;
    this.abilities = abilities;
    this.edition = edition;
    this.character = character;
  }

}
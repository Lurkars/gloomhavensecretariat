import { Editional } from "../Editional";
import { Ability } from "../Ability";

export class DeckData implements Editional {

  name: string;
  abilities: Ability[];

  // from Editional
  edition: string;

  constructor(name: string, abilities: Ability[], edition: string) {
    this.name = name;
    this.abilities = abilities;
    this.edition = edition;
  }

}
import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
import { Perk } from "../Perks";
import { Spoilable } from "../Spoilable";
import { SummonData } from "./SummonData";

export enum CharacterClass {

  aesther = "aesther",
  harrower = "harrower",
  human = "human",
  inox = "inox",
  lurker = "lurker",
  orchid = "orchid",
  quatryl = "quatryl",
  savvas = "savvas",
  valrath = "valrath",
  vermling = "vermling"

}


export class CharacterData implements Editional, Spoilable {
  name: string = "";
  stats: CharacterStat[] = [];
  characterClass: CharacterClass | undefined;
  availableSummons: SummonData[] = [];

  icon: string | undefined;
  thumbnail: string | undefined;
  color: string = "#000000";

  marker: boolean = false;

  deck: string = "";

  perks: Perk[] = [];

  // from Editional
  edition: string = "";
  // from Spoilable
  spoiler: boolean = false;

  // error
  errors: FigureError[];

  constructor(character: CharacterData | undefined = undefined) {
    this.errors = [];
    if (character) {
      this.name = character.name;
      this.stats = character.stats;
      this.characterClass = character.characterClass;
      this.availableSummons = character.availableSummons;
      this.edition = character.edition;
      this.icon = character.icon;
      this.thumbnail = character.thumbnail;
      this.color = character.color;
      this.marker = character.marker;
      this.spoiler = character.spoiler;
      this.deck = character.name;
      if (character.deck) {
        this.deck = character.deck;
      }
      this.perks = character.perks;
    }
  }

} 
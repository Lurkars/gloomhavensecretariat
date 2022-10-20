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

export enum CharacterGender {
  male = "m",
  female = "f",
  unknown = ""
}


export class CharacterData implements Editional, Spoilable {
  name: string = "";
  stats: CharacterStat[] = [];
  characterClass: CharacterClass | undefined;
  gender: CharacterGender = CharacterGender.unknown;
  availableSummons: SummonData[] = [];

  iconUrl: string | undefined;
  thumbnailUrl: string | undefined;
  color: string = "#000000";

  marker: boolean = false;

  deck: string = "";

  perks: Perk[] = [];

  // from Editional
  edition: string = "";
  // from Spoilable
  spoiler: boolean = false;

  // error
  errors: FigureError[] | undefined;

  replace: boolean = false;

  constructor(character: CharacterData | undefined = undefined) {
    if (character) {
      this.errors = character.errors || [];
      this.name = character.name;
      this.stats = character.stats || [];
      this.characterClass = character.characterClass || undefined;
      this.gender = character.gender || CharacterGender.unknown;
      this.availableSummons = character.availableSummons || [];
      this.edition = character.edition || "";
      this.iconUrl = character.iconUrl || undefined;
      this.thumbnailUrl = character.thumbnailUrl || undefined;
      this.color = character.color || "#00000";
      this.marker = character.marker || false;
      this.spoiler = character.spoiler || false;
      this.deck = character.deck;
      if (character.deck) {
        this.deck = character.deck;
      }
      this.perks = character.perks || [];
    }
  }

} 
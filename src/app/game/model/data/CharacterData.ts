import { AttackModifier } from "../AttackModifier";
import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
import { Perk, PerkCard } from "../Perks";
import { Spoilable } from "../Spoilable";
import { SummonData } from "./SummonData";

export enum CharacterClass {

  algox = "algox",
  aesther = "aesther",
  harrower = "harrower",
  human = "human",
  inox = "inox",
  lurker = "lurker",
  orchid = "orchid",
  quatryl = "quatryl",
  savvas = "savvas",
  unfettered = "unfettered",
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

  icon: string | undefined;
  iconUrl: string | undefined;
  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;
  color: string = "#aaaaaa";

  marker: boolean = false;

  deck: string = "";

  perks: Perk[] = [];

  additionalModifier: PerkCard[] = [];

  masteries: string[] = [];

  // from Editional
  edition: string = "";
  // from Spoilable
  spoiler: boolean = false;
  locked: boolean = false;

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
      this.icon = character.icon || undefined;
      this.iconUrl = character.iconUrl || undefined;
      this.thumbnail = character.thumbnail || undefined;
      this.thumbnailUrl = character.thumbnailUrl || undefined;
      this.color = character.color || "#00000";
      this.marker = character.marker || false;
      this.spoiler = character.spoiler || false;
      this.deck = character.deck;
      if (character.deck) {
        this.deck = character.deck;
      }
      this.perks = character.perks || [];
      this.additionalModifier = character.additionalModifier || [];
      this.masteries = character.masteries || [];
    }
  }

} 
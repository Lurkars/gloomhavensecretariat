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
  handSize: number = 0;
  availableSummons: SummonData[] = [];

  icon: string = '';
  iconUrl: string = '';
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

  constructor(characterData: CharacterData | undefined = undefined) {
    if (characterData) {
      this.errors = characterData.errors || [];
      this.name = characterData.name;
      this.stats = characterData.stats || [];
      this.characterClass = characterData.characterClass || undefined;
      this.gender = characterData.gender || CharacterGender.unknown;
      this.handSize = characterData.handSize;
      this.availableSummons = characterData.availableSummons || [];
      this.edition = characterData.edition || "";
      this.icon = characterData.icon || characterData.edition + '-' + characterData.name;
      this.iconUrl = characterData.iconUrl || './assets/images/character/icons/' + this.icon + '.svg';
      this.thumbnail = characterData.thumbnail || undefined;
      this.thumbnailUrl = characterData.thumbnailUrl || undefined;
      this.color = characterData.color || "#00000";
      this.marker = characterData.marker || false;
      this.spoiler = characterData.spoiler || false;
      this.deck = characterData.deck;
      if (characterData.deck) {
        this.deck = characterData.deck;
      }
      this.perks = characterData.perks || [];
      this.additionalModifier = characterData.additionalModifier || [];
      this.masteries = characterData.masteries || [];
    }
  }

} 
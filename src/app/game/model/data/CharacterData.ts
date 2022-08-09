import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
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
  name: string;
  stats: CharacterStat[];
  characterClass: CharacterClass | undefined;
  availableSummons: SummonData[] = [];

  icon: string | undefined;
  thumbnail: string | undefined;
  color: string;

  marker: boolean = false;

  deck: string;

  // from Editional
  edition: string;
  // from Spoilable
  spoiler: boolean;

  // error
  errors: FigureError[];

  constructor(name: string, stats: CharacterStat[], edition: string, characterClass: CharacterClass | undefined = undefined, availableSummons: SummonData[] = [], icon: string | undefined = undefined, thumbnail: string | undefined = undefined, color: string = "#000000", marker: boolean = false, spoiler: boolean = false, deck: string | undefined = undefined) {
    this.errors = [];
    this.name = name;
    this.stats = stats;
    this.characterClass = characterClass;
    this.availableSummons = availableSummons;
    this.edition = edition;
    this.icon = icon;
    this.thumbnail = thumbnail;
    this.color = color;
    this.marker = marker;
    this.spoiler = spoiler;
    this.deck = name;
    if (deck) {
      this.deck = deck;
    }
  }

} 
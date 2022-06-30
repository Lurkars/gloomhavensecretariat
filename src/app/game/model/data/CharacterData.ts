import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
import { Spoilable } from "../Spoilable";
import { SummonsData } from "./SummonData";

export class CharacterData implements Editional, Spoilable {
  name: string;
  stats: CharacterStat[];
  summon: SummonsData | undefined;

  icon: string | undefined;
  thumbnail: string | undefined;
  color: string;

  deck: string;

  // from Editional
  edition: string;
  // from Spoilable
  spoiler: boolean;

  // error
  errors: FigureError[];

  constructor(name: string, stats: CharacterStat[], edition: string, summon: SummonsData | undefined = undefined, icon: string | undefined = undefined, thumbnail: string | undefined = undefined, color: string = "#000000", spoiler: boolean = false, deck: string | undefined = undefined) {
    this.errors = [];
    this.name = name;
    this.stats = stats;
    this.summon = summon;
    this.edition = edition;
    this.icon = icon;
    this.thumbnail = thumbnail;
    this.color = color;
    this.spoiler = spoiler;
    this.deck = name;
    if (deck) {
      this.deck = deck;
    }
  }

} 
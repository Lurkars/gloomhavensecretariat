import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
import { Spoilable } from "../Spoilable";
import { SummonData } from "./SummonData";

export class CharacterData implements Editional, Spoilable {
  name: string;
  stats: CharacterStat[];
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

  constructor(name: string, stats: CharacterStat[], edition: string, availableSummons: SummonData[] = [], icon: string | undefined = undefined, thumbnail: string | undefined = undefined, color: string = "#000000", marker: boolean = false, spoiler: boolean = false, deck: string | undefined = undefined) {
    this.errors = [];
    this.name = name;
    this.stats = stats;
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
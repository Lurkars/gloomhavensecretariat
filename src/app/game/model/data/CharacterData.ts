import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";
import { Spoilable } from "../Spoilable";
import { SummonsData } from "./SummonData";

export class CharacterData implements Editional, Spoilable {
  name: string;
  stats: CharacterStat[];
  summon: SummonsData | undefined;

  icon: string | undefined;
  thumbnail: string | undefined;
  
  deck: string;

  // from Editional
  edition: string;
  // from Spoilable
  spoiler: boolean;

  constructor(name: string, stats: CharacterStat[], edition: string, summon: SummonsData | undefined = undefined, icon: string | undefined = undefined, thumbnail: string | undefined = undefined, spoiler: boolean = false, deck: string | undefined = undefined) {
    this.name = name;
    this.stats = stats;
    this.summon = summon;
    this.edition = edition;
    this.icon = icon;
    this.thumbnail = thumbnail;
    this.spoiler = spoiler;
    this.deck = name;
    if (deck) {
      this.deck = deck;
    }
  }

} 
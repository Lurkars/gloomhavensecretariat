import { Editional } from "../Editional";
import { MonsterStat } from "../MonsterStat";
import { Spoilable } from "../Spoilable";

export class MonsterData implements Editional, Spoilable {

  name: string;
  count: number;
  baseStat: MonsterStat;
  stats: MonsterStat[];
  deck: string;
  boss: boolean;

  thumbnail: string | undefined;

  // from Editional
  edition: string;

  // from Spoilable
  spoiler: boolean;

  constructor(name: string, count: number, baseStat: MonsterStat, stats: MonsterStat[], edition: string, deck: string | undefined = undefined, boss: boolean = false, thumbnail: string | undefined = undefined,
    spoiler: boolean = false) {
    this.name = name;
    this.count = count;
    this.baseStat = baseStat;
    this.stats = stats;
    this.edition = edition;
    this.deck = name;
    if (deck) {
      this.deck = deck;
    }
    this.boss = boss;
    this.thumbnail = thumbnail;
    this.spoiler = true;
  }

}
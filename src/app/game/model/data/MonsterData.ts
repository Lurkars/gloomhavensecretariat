import { Editional } from "../Editional";
import { FigureError } from "../FigureError";
import { MonsterStat } from "../MonsterStat";
import { Spoilable } from "../Spoilable";

export class MonsterData implements Editional, Spoilable {

  name: string;
  count: number;
  baseStat: MonsterStat;
  stats: MonsterStat[];
  deck: string;
  boss: boolean;
  flying: boolean;

  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;

  // from Editional
  edition: string;

  // from Spoilable
  spoiler: boolean;

  // error
  errors: FigureError[];

  hidden: boolean = false;

  constructor(name: string, count: number, baseStat: MonsterStat, stats: MonsterStat[], edition: string, deck: string | undefined = undefined, boss: boolean = false, flying: boolean = false, thumbnail: string | undefined = undefined, thumbnailUrl: string | undefined = undefined,
    spoiler: boolean = false) {
    this.errors = [];
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
    this.flying = flying; 
    this.thumbnail = thumbnail;
    this.thumbnailUrl = thumbnailUrl;
    this.spoiler = true;
  }

}
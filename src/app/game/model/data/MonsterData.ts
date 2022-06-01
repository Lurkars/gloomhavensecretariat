import { Editional } from "../Editional";
import { Ability } from "../Ability";
import { MonsterStat } from "../MonsterStat";

export class MonsterData implements Editional {

  name: string;
  count: number;
  stats: MonsterStat[];
  deck: string;
  boss: boolean;

  // from Editional
  edition: string;

  constructor(name: string, count: number, stats: MonsterStat[], edition: string, deck: string | undefined = undefined, boss: boolean = false) {
    this.name = name;
    this.count = count;
    this.stats = stats;
    this.edition = edition;
    this.deck = name;
    if (deck) {
      this.deck = deck;
    }
    this.boss = boss;
  }

}
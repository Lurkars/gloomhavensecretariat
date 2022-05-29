import { Editional } from "../Editional";
import { MonsterAbility } from "../MonsterAbility";
import { MonsterStat } from "../MonsterStat";

export class MonsterData implements Editional {

  name: string;
  count: number;
  abilities: MonsterAbility[];
  stats: MonsterStat[];
  boss: boolean;

  // from Editional
  edition: string;

  constructor(name: string, count: number, abilities: MonsterAbility[], stats: MonsterStat[], edition: string, boss: boolean = false) {
    this.name = name;
    this.count = count;
    this.abilities = abilities;
    this.stats = stats;
    this.edition = edition;
    this.boss = boss;
  }

}
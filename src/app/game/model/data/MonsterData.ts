import { Editional } from "./Editional";
import { FigureError } from "./FigureError";
import { MonsterStat } from "./MonsterStat";
import { MonsterType } from "./MonsterType";
import { Spoilable } from "./Spoilable";

export class MonsterData implements Editional, Spoilable {

  name: string = "";
  count: number | string = 0;
  randomCount: number | string = 0;
  standeeCount: number | string | undefined;
  standeeShare: string | undefined;
  standeeShareEdition: string | undefined;
  baseStat: MonsterStat = new MonsterStat(MonsterType.normal);
  stats: MonsterStat[] = [];
  deck: string = "";
  boss: boolean = false;
  bb: boolean = false;
  flying: boolean = false;
  immortal: boolean = false;

  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;

  noThumbnail: boolean = false;
  noArtwork: boolean = false;

  pet: string = "";

  // from Editional
  edition: string = "";

  // from Spoilable
  spoiler: boolean = false;

  // error
  errors: FigureError[] | undefined = [];

  hidden: boolean = false;

  replace: boolean = false;

  constructor(monsterData: MonsterData | undefined = undefined) {
    if (monsterData) {
      this.name = monsterData.name;
      this.count = monsterData.count;
      this.randomCount = monsterData.randomCount;
      this.standeeCount = monsterData.standeeCount;
      this.standeeShare = monsterData.standeeShare;
      this.standeeShareEdition = monsterData.standeeShareEdition;
      this.baseStat = monsterData.baseStat;
      this.stats = monsterData.stats || [];
      this.deck = monsterData.deck;
      this.boss = monsterData.boss;
      this.bb = monsterData.bb;
      this.flying = monsterData.flying;
      this.immortal = monsterData.immortal;
      this.thumbnail = monsterData.thumbnail;
      this.thumbnailUrl = monsterData.thumbnailUrl;
      this.noThumbnail = monsterData.noThumbnail;
      this.noArtwork = monsterData.noArtwork;
      this.pet = monsterData.pet;
      this.edition = monsterData.edition;
      this.spoiler = monsterData.spoiler;
      this.errors = monsterData.errors || [];
      this.hidden = monsterData.hidden;
      this.replace = monsterData.replace;
    }
  }

}
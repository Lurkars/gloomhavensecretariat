import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { first } from "rxjs";
import { Ability } from "src/app/game/model/Ability";
import { DeckData } from "src/app/game/model/data/DeckData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { Monster } from "src/app/game/model/Monster";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";
import { ghsUnit, ghsUnitUnit } from "src/app/ui/helper/Static";

@Component({
  selector: 'ghs-monster-tool',
  templateUrl: './monster.html',
  styleUrls: [ './monster.scss' ]
})
export class MonsterToolComponent implements OnInit {

  @ViewChild('inputMonsterData', { static: true }) inputMonsterData!: ElementRef;
  @ViewChild('inputAbilities', { static: true }) inputAbilities!: ElementRef;

  MonsterType = MonsterType;
  monsterData: MonsterData | undefined;
  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
  monster: Monster | undefined;
  deckData: DeckData | undefined;
  error: any;

  ngOnInit(): void {
    this.monsterData = JSON.parse('{"name": "new Monster", "count": 10, "stats": []}');
    if (this.monsterData) {
      this.updateType();
      this.monsterDataToJson();
    }
  }

  compactBasicStat(firstStat: any, compactData: any, field: string) {
    if (compactData.stats.every((stat: any) =>
      JSON.stringify(stat[ field ]) == JSON.stringify(firstStat[ field ]))) {
      compactData.baseStat[ field ] = firstStat[ field ];
      for (let stat of compactData.stats) {
        delete stat[ field ];
      }
    } else {
      delete compactData.baseStat[ field ];
    }
  }

  monsterDataToJson() {
    if (this.monsterData) {
      let compactData: any = JSON.parse(JSON.stringify(this.monsterData));

      if (!compactData.baseStat) {
        compactData.baseStat = {};
      }

      if (compactData.boss) {
        compactData.baseStat.type = MonsterType.boss;
        for (let stat of compactData.stats) {
          delete stat.type;
        }
      } else {
        compactData.baseStat.type = MonsterType.normal;
        for (let stat of compactData.stats) {
          if (stat.type == MonsterType.normal) {
            delete stat.type;
          }
        }
      }

      let firstStat = compactData.stats.find((stat: any) =>
        stat.level == 0 && !stat.type);

      if (firstStat) {
        this.compactBasicStat(firstStat, compactData, "level");
        this.compactBasicStat(firstStat, compactData, "health");
        this.compactBasicStat(firstStat, compactData, "movement");
        this.compactBasicStat(firstStat, compactData, "attack");
        this.compactBasicStat(firstStat, compactData, "range");
        this.compactBasicStat(firstStat, compactData, "actions");
        this.compactBasicStat(firstStat, compactData, "immunities");
        this.compactBasicStat(firstStat, compactData, "special");
        this.compactBasicStat(firstStat, compactData, "note");
      }

      this.inputMonsterData.nativeElement.value = JSON.stringify(compactData, null, 2);
    }
  }

  monsterDataFromJson() {
    if (this.inputMonsterData.nativeElement.value) {
      try {
        this.monsterData = JSON.parse(this.inputMonsterData.nativeElement.value);
        if (this.monsterData) {
          this.updateType();
        }
        return;
      } catch (e) {
        this.monsterData = undefined;
        this.error = e;
      }
    }
  }

  updateType() {
    if (this.monsterData) {
      if (!this.monsterData.baseStat) {
        this.monsterData.baseStat = new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0);
      }
      if (this.monsterData.boss) {
        this.monsterData.baseStat.type = MonsterType.boss;
        this.monsterData.stats = this.monsterData.stats.filter((stat: MonsterStat) => !stat.type || stat.type == MonsterType.boss);

        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat: MonsterStat) => stat.level == level)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.boss, level, 0, 0, 0, 0));
          }
        }
      } else {
        this.monsterData.baseStat.type = MonsterType.normal;
        this.monsterData.stats = this.monsterData.stats.filter((stat: MonsterStat) => stat.type != MonsterType.boss);
        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat: MonsterStat) => stat.level == level && (!stat.type || stat.type == MonsterType.normal))) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.normal, level, 0, 0, 0, 0));
          }
        }

        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat: MonsterStat) => stat.level == level && stat.type == MonsterType.elite)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.elite, level, 0, 0, 0, 0));
          }
        }
      }

      this.monster = new Monster(this.monsterData);
    }
  }

  getStatIndex(type: MonsterType, level: number): number {
    if (this.monsterData && this.monsterData.stats.some((stat: MonsterStat) => stat.level == level && (stat.type == type || !stat.type && this.monsterData?.baseStat.type == type))) {
      let stat: MonsterStat = this.monsterData.stats.filter((stat: MonsterStat) => stat.level == level && (stat.type == type || !stat.type && this.monsterData?.baseStat.type == type))[ 0 ];
      return this.monsterData.stats.indexOf(stat);
    }

    return -1;
  }

  basicStatChange(event : any) {
    this.updateType();
  }

  abilitiesChange() {
    this.deckData = undefined;
    if (this.inputAbilities.nativeElement.value) {
      try {
        this.deckData = JSON.parse(this.inputAbilities.nativeElement.value);
        return;
      } catch (e) {
        this.error = e;
      }
    }
  }

  hexSize(): number {
    let size = ghsUnit();
    if (ghsUnitUnit() == 'vw') {
      size = window.innerWidth / 100 * ghsUnit();
    }
    return size;
  }
}
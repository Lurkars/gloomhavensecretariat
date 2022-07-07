import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { DeckData } from "src/app/game/model/data/DeckData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { Monster } from "src/app/game/model/Monster";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";

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

  monsterDataToJson() {
    if (this.monsterData) {
      let compactData: any = JSON.parse(JSON.stringify(this.monsterData));

      if (!compactData.baseStat) {
        compactData.baseStat = {};
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
      if (this.monsterData.boss) {
        this.monsterData.stats = this.monsterData.stats.filter((stat: MonsterStat) => !stat.type || stat.type == MonsterType.boss);

        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat: MonsterStat) => stat.level == level)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.boss, level, 0, 0, 0, 0));
          }
        }
      } else {
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
    if (this.monsterData) {
      const stat = this.monsterData.stats.find((stat: MonsterStat) => stat.level == level && (stat.type == type || !stat.type && this.monsterData?.baseStat.type == type));
      if (stat) {
        return this.monsterData.stats.indexOf(stat);
      }
    }

    return -1;
  }

  basicStatChange(event: any) {
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
}
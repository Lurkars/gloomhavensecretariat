import { Component, Input, OnChanges } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Action } from "src/app/game/model/Action";
import { SummonData } from "src/app/game/model/data/SummonData";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-action-summon',
  templateUrl: './action-summon.html',
  styleUrls: ['./action-summon.scss']
})
export class ActionSummonComponent implements OnChanges {

  @Input() action!: Action;
  @Input() right: boolean = false;
  @Input() additional: boolean = false;
  monsters: string[] = [];
  type: MonsterType | undefined;
  summon: SummonData | undefined;
  count: number | undefined;

  constructor() {
    gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    })
  }

  ngOnChanges(changes: any) {
    this.update();
  }

  update() {
    this.summon = undefined;
    this.monsters = [];
    this.count = undefined;
    this.type = undefined;
    if (this.action.value) {
      try {
        let value = JSON.parse('' + this.action.value);
        if (typeof value != 'string') {
          this.summon = new SummonData(value.name, value.health, value.attack, value.movement, value.range, value.action, value.additionalAction);
        } else {
          throw Error("fallback");
        }
      } catch (e) {
        this.summon = undefined;
        const summonValue = ('' + this.action.value).split(':');
        this.monsters = summonValue[0].split('|');
        if (summonValue.length > 1) {
          if (!isNaN(+summonValue[1])) {
            this.count = +summonValue[1];
          } else {
            this.type = summonValue[1] as unknown as MonsterType;
          }
        }

        if (summonValue.length > 2) {
          if (!isNaN(+summonValue[2])) {
            this.count = +summonValue[2];
          }
        }
      }
    }
  }

}
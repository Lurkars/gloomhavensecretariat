import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Action, ActionType } from "src/app/game/model/Action";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-monster-stat-tool',
  templateUrl: './stat.html',
  styleUrls: [ './stat.scss' ]
})
export class MonsterStatToolComponent {

  @Input() stat!: MonsterStat;
  @Output() statChange = new EventEmitter<MonsterStat>();

  monsterTypes: MonsterType[] = Object.values(MonsterType);

  addAction() {
    this.stat.actions.push(new Action(ActionType.attack));
    this.statChange.emit(this.stat);
  }

  removeAction(i: number) {
    this.stat.actions.splice(i, 1);
    this.statChange.emit(this.stat);
  }

  addSpecial() {
    this.stat.special.push([]);
    this.statChange.emit(this.stat);
  }

  removeSpecial(i: number) {
    this.stat.special.splice(i, 1);
    this.statChange.emit(this.stat);
  }

  addSpecialAction(i: number) {
    this.stat.special[ i ].push(new Action(ActionType.attack));
    this.statChange.emit(this.stat);
  }

  removeSpecialAction(i: number, j: number) {
    this.stat.special[ i ].splice(j, 1);
    this.statChange.emit(this.stat);
  }
} 
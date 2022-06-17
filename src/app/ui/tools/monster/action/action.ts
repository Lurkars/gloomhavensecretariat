import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";

@Component({
  selector: 'ghs-monster-action-tool',
  templateUrl: './action.html',
  styleUrls: [ './action.scss' ]
})
export class MonsterActionToolComponent {

  @Input() action!: Action;
  @Output() actionChange = new EventEmitter<Action>();

  ActionTypes: ActionType[] = Object.values(ActionType);
  ActionValueTypes: ActionValueType[] = Object.values(ActionValueType);

  addSubAction() {
    if (!this.action.subActions) {
      this.action.subActions = [];
    }
    this.action.subActions.push(new Action(ActionType.attack));
  }

  removeSubAction(index: number) {
    this.action.subActions.splice(index, 1);
  }


} 
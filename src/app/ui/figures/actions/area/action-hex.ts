import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { ActionHex, ActionHexFromString, ActionHexToString } from "src/app/game/model/ActionHex";
import { Action } from "src/app/game/model/data/Action";
import { ConditionName } from "src/app/game/model/data/Condition";

@Component({
	standalone: false,
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: ['./action-hex.scss']
})
export class ActionHexComponent implements OnChanges {

  @Input() action!: Action;
  @Input() value!: string;
  @Input() size!: number;
  @Output() clickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  @Output() doubleclickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  hexes: ActionHex[] = [];
  ActionHex = ActionHex;
  ActionHexToString = ActionHexToString;

  doubleClick: any = null;

  ngOnChanges(changes: any) {
    this.hexes = [];
    if (!this.value) {
      this.value = '' + this.action.value;
    }
    this.value.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
      if (hex != null) {
        this.hexes.push(hex);
      }
    })
  }

  click(hex: ActionHex) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      this.doubleclickCallback.emit(hex);
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.clickCallback.emit(hex);
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  hasCondition(hex: ActionHex): boolean {
    return hex.value && Object.keys(ConditionName).includes(hex.value) || false;
  }

}
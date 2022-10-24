import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionHex, ActionHexType, ActionSpecialTarget, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/Condition";
import { Element } from "src/app/game/model/Element";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-monster-editor-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class MonsterEditorActionComponent implements OnInit {

  @Input() action!: Action;
  @Output() actionChange = new EventEmitter<Action>();
  ActionType = ActionType;
  ActionTypes: ActionType[] = Object.values(ActionType);
  ActionSpecialTarget: ActionSpecialTarget[] = Object.values(ActionSpecialTarget);
  ConditionNames: ConditionName[] = Object.values(ConditionName);
  Elements: Element[] = Object.values(Element);
  ActionValueType = ActionValueType;
  ActionValueTypes: ActionValueType[] = Object.values(ActionValueType);
  MonsterTypes: MonsterType[] = Object.values(MonsterType);
  hexValue: string = "(0,0,invisible)";
  value: string = '';
  subValue: string = '';

  ngOnInit(): void {
    if (this.action && this.action.type == ActionType.area) {
      this.hexValue = '' + this.action.value;
      let hexes: ActionHex[] = [];
      this.hexValue.split('|').forEach((hexValue) => {
        const hex: ActionHex | null = ActionHex.fromString(hexValue);
        if (hex != null) {
          hexes.push(hex);
        }
      })
      hexes.forEach((other) => this.fillHexes(other, hexes));
      this.hexValue = hexes.map((hex) => ActionHex.toString(hex)).join('|');
      this.change();
    } else if (this.action.type == ActionType.specialTarget || this.action.type == ActionType.condition) {
      if (('' + this.action.value).indexOf(':') != -1) {
        this.value = ('' + this.action.value).split(':')[0];
        this.subValue = ('' + this.action.value).split(':')[1];
      } else {
        this.value = '' + this.action.value;
      }
    }
  }

  valueChange(value: string): number | string {
    if (!isNaN(+value)) {
      return +value;
    }
    return value;
  }

  addSubAction() {
    if (!this.action.subActions) {
      this.action.subActions = [];
    }
    this.action.subActions.push(new Action(ActionType.attack));
    this.change();
  }

  removeSubAction(index: number) {
    this.action.subActions.splice(index, 1);
    this.change();
  }

  changeType() {
    this.action.value = "";
    this.action.valueType = ActionValueType.fixed;
    if (this.action.type == ActionType.area) {
      this.hexValue = "(0,0,invisible)";
    } else if (this.action.type == ActionType.condition) {
      this.action.value = this.ConditionNames[0];
    } else if (this.action.type == ActionType.element) {
      this.action.value = this.Elements[0];
    }
  }

  change() {
    gameManager.uiChange.emit();
  }

  toggleHex(hex: ActionHex) {

    let hexes: ActionHex[] = [];
    this.hexValue.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHex.fromString(hexValue);
      if (hex != null) {
        hexes.push(hex);
      }
    })

    switch (hex.type) {
      case ActionHexType.target:
        hex.type = ActionHexType.active;
        break;
      case ActionHexType.active:
        hex.type = ActionHexType.blank;
        break;
      case ActionHexType.blank:
        hex.type = ActionHexType.ally;
        break;
      case ActionHexType.ally:
        hex.type = ActionHexType.conditional;
        break;
      case ActionHexType.conditional:
        hex.type = ActionHexType.invisible;
        break;
      case ActionHexType.invisible:
        hex.type = ActionHexType.target;
        break;
    }

    const same = hexes.find((other) => hex.x == other.x && hex.y == other.y);

    if (same) {
      hexes.splice(hexes.indexOf(same), 1, hex);
    } else {
      hexes.push(hex);
    }

    this.fillHexes(hex, hexes);

    this.hexValue = hexes.map((hex) => ActionHex.toString(hex)).join('|');
    this.action.value = hexes.filter((hex) => hex.type != ActionHexType.invisible).map((hex) => ActionHex.toString(hex)).join('|');
    this.change();
  }


  removeHex(hex: ActionHex) {

    let hexes: ActionHex[] = [];
    this.hexValue.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHex.fromString(hexValue);
      if (hex != null) {
        hexes.push(hex);
      }
    })

    const same = hexes.find((other) => hex.x == other.x && hex.y == other.y);
    if (same) {
      if (same.x == 0 && same.y == 0) {
        same.type = ActionHexType.invisible;
      } else {
        hexes.splice(hexes.indexOf(same), 1);
      }

      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if ((hex.x + x != hex.x || hex.y + y != hex.y) && hex.x + x >= 0 && hex.y + y >= 0) {
            let other = hexes.find((other) => hex.x + x == other.x && hex.y + y == other.y && other.type == ActionHexType.invisible);
            if (other && (other.x != 0 || other.y != 0)) {
              hexes.splice(hexes.indexOf(other), 1);
            }
          }
        }
      }
    }

    hexes.filter((other) => other.type != ActionHexType.invisible).forEach((other) => this.fillHexes(other, hexes));

    this.hexValue = hexes.map((hex) => ActionHex.toString(hex)).join('|');
    this.action.value = hexes.filter((hex) => hex.type != ActionHexType.invisible).map((hex) => ActionHex.toString(hex)).join('|');
    this.change();
  }

  fillHexes(hex: ActionHex, hexes: ActionHex[]) {
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if ((hex.x + x != hex.x || hex.y + y != hex.y) && hex.x + x >= 0 && hex.y + y >= 0) {
          if (!hexes.find((other) => hex.x + x == other.x && hex.y + y == other.y)) {
            hexes.push(new ActionHex(hex.x + x, hex.y + y, ActionHexType.invisible));
          }
        }
      }
    }
  }

  changeSpecialTarget() {
    if (settingsManager.getLabel('game.specialTarget.' + this.value).indexOf('{0}') != -1) {
      if (!this.subValue) {
        this.subValue = '1';
      }
      this.action.value = this.value + ":" + this.subValue;
    } else {
      this.action.value = this.value;
      this.subValue = '';
    }
    this.change();
  }

  changeCondition() {
    if (new Condition(this.value as unknown as ConditionName).types.indexOf(ConditionType.value) != -1) {
      if (!this.subValue) {
        this.subValue = '1';
      }
      this.action.value = this.value + ":" + this.subValue;
    } else {
      this.action.value = this.value;
      this.subValue = '';
    }
    this.change();
  }

  dropSubAction(event: CdkDragDrop<number>) {
    moveItemInArray(this.action.subActions, event.previousIndex, event.currentIndex);
    gameManager.uiChange.emit();
  }
}


@Component({
  selector: 'ghs-monster-editor-action-dialog',
  templateUrl: './action-dialog.html',
  styleUrls: ['./action-dialog.scss']
})
export class MonsterEditorActionDialogComponent {

  relative: boolean = true;

  constructor(@Inject(DIALOG_DATA) public data: { action: Action }, private dialogRef: DialogRef) {

  }

  deleteAction() {
    this.dialogRef.close(false);
  }
}
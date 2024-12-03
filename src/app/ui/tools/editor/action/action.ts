import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ActionHex, ActionHexFromString, ActionHexToString, ActionHexType } from "src/app/game/model/ActionHex";
import { Action, ActionCardType, ActionSpecialTarget, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { Element } from "src/app/game/model/data/Element";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { SummonData } from "src/app/game/model/data/SummonData";

@Component({
	standalone: false,
  selector: 'ghs-editor-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class EditorActionComponent implements OnInit {

  @Input() action!: Action;
  @Output() actionChange = new EventEmitter<Action>();
  ActionType = ActionType;
  ActionTypes: ActionType[] = Object.values(ActionType);
  ActionSpecialTarget: ActionSpecialTarget[] = Object.values(ActionSpecialTarget);
  ConditionNames: ConditionName[] = Object.values(ConditionName);
  Elements: Element[] = Object.values(Element);
  ActionValueType = ActionValueType;
  ActionValueTypes: ActionValueType[] = Object.values(ActionValueType);
  ActionCardTypes: ActionCardType[] = Object.values(ActionCardType);
  MonsterTypes: MonsterType[] = Object.values(MonsterType);
  hexAction: Action = new Action(ActionType.area, "(0,0,invisible)");
  value: string = '';
  subValue: string = '';
  summon: SummonData | undefined;
  monster: string = '';
  monsterType: MonsterType | undefined;
  monsters: string[] = [];

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    this.monsters = gameManager.monstersData().map((monsterData) => monsterData.name);

    if (this.action && this.action.type == ActionType.area) {
      this.hexAction.value = '' + this.action.value;
      let hexes: ActionHex[] = [];
      this.hexAction.value.split('|').forEach((hexValue) => {
        const hex: ActionHex | null = ActionHexFromString(hexValue);
        if (hex != null) {
          hexes.push(hex);
        }
      })
      hexes.forEach((other) => this.fillHexes(other, hexes));
      this.hexAction.value = hexes.map((hex) => ActionHexToString(hex)).join('|');
      this.change();
    } else if (this.action.type == ActionType.condition || this.action.type == ActionType.specialTarget || this.action.type == ActionType.card) {
      if (('' + this.action.value).indexOf(':') != -1) {
        this.value = ('' + this.action.value).split(':')[0];
        this.subValue = ('' + this.action.value).split(':')[1];
      } else {
        this.value = '' + this.action.value;
      }
    } else if (this.action.type == ActionType.summon && this.action.value) {
      try {
        let value = JSON.parse(this.action.value + '');
        if (typeof value != 'string') {
          this.summon = new SummonData(value.name, value.health, value.attack, value.movement, value.range, value.flying, value.action, value.additionalAction);
        } else {
          throw Error("fallback");
        }
      } catch (e) {
        this.summon = undefined;
        const summonValue = (this.action.value + '').split(':');
        this.monster = summonValue[0];
        if (summonValue.length > 1) {
          this.monsterType = summonValue[1] as unknown as MonsterType;
        }
      }
    }
  }

  valueChange(value: string): number | string {
    if (!isNaN(+value)) {
      return +value;
    }
    return value || "";
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
    this.action.valueType = ActionValueType.fixed;
    if (this.action.type == ActionType.area) {
      this.hexAction.value = "(0,0,invisible)";
    } else if (this.action.type == ActionType.condition) {
      this.value = this.ConditionNames[0];
      this.changeCondition();
    } else if (this.action.type == ActionType.element) {
      this.action.value = this.Elements[0];
    } else if (this.action.type == ActionType.card) {
      this.value = this.ActionCardTypes[0];
      this.changeCard();
    }
    this.change();
  }

  change() {
    gameManager.uiChange.emit();
  }

  toggleHex(hex: ActionHex) {

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

    let hexes: ActionHex[] = [];
    ('' + this.hexAction.value).split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
      if (hex != null) {
        hexes.push(hex);
      }
    })

    const same = hexes.find((other) => hex.x == other.x && hex.y == other.y);

    if (same) {
      hexes.splice(hexes.indexOf(same), 1, hex);
    } else {
      hexes.push(hex);
    }

    this.fillHexes(hex, hexes);

    this.hexAction.value = hexes.map((hex) => ActionHexToString(hex)).join('|');
    this.action.value = hexes.filter((hex) => hex.type != ActionHexType.invisible).map((hex) => ActionHexToString(hex)).join('|');
    this.change();
  }

  changeHex() {
    let hexes: ActionHex[] = [];
    ('' + this.hexAction.value).split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
      if (hex != null) {
        hexes.push(hex);
      }
    })

    this.hexAction.value = hexes.map((hex) => ActionHexToString(hex)).join('|');
    this.action.value = hexes.filter((hex) => hex.type != ActionHexType.invisible).map((hex) => ActionHexToString(hex)).join('|');
    this.change();
  }


  removeHex(hex: ActionHex) {

    let hexes: ActionHex[] = [];
    ('' + this.hexAction.value).split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
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

    this.hexAction.value = hexes.map((hex) => ActionHexToString(hex)).join('|');
    this.action.value = hexes.filter((hex) => hex.type != ActionHexType.invisible).map((hex) => ActionHexToString(hex)).join('|');
    this.change();
  }

  fillHexes(hex: ActionHex, hexes: ActionHex[]) {
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if ((hex.x + x != hex.x || hex.y + y != hex.y) && hex.x + x >= 0 && hex.y + y >= 0) {
          if (!hexes.find((other) => hex.x + x == other.x && hex.y + y == other.y)) {
            hexes.push(new ActionHex(hex.x + x, hex.y + y, ActionHexType.invisible, ""));
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
    if (new Condition(this.value).types.indexOf(ConditionType.value) != -1) {
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

  changeCard() {
    if (this.value == ActionCardType.experience || this.value == ActionCardType.slotXp) {
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

  changeSummonType(event: any) {
    this.monster = "";
    this.monsterType = undefined;
    if (event.target.value == 'monster') {
      this.summon = undefined;
      this.changeSummonMonster();
    } else if (event.target.value == 'summon') {
      this.summon = new SummonData("", "", "", 0, 0, 0, 0, false);
      this.action.value = JSON.stringify(this.summon);
    }
  }

  changeSummonMonster() {
    this.action.value = this.monster + (this.monsterType ? ':' + this.monsterType : '');
    gameManager.uiChange.emit();
  }

  changeSummon() {
    if (this.summon) {
      this.action.value = JSON.stringify(this.summon);
    }
    gameManager.uiChange.emit();
  }

  editSummonAction() {
    if (this.summon) {
      if (!this.summon.action) {
        this.summon.action = new Action(ActionType.attack);
      }

      const dialog = this.dialog.open(EditorActionDialogComponent, {
        panelClass: ['dialog'],
        data: { action: this.summon.action }
      });

      dialog.closed.subscribe({
        next: (value) => {
          if (value == false && this.summon) {
            this.summon.action = undefined;
          }
          this.changeSummon();
        }
      })

    }
  }

  editSummonAdditionalAction() {
    if (this.summon) {
      if (!this.summon.additionalAction) {
        this.summon.additionalAction = new Action(ActionType.attack);
      }

      const dialog = this.dialog.open(EditorActionDialogComponent, {
        panelClass: ['dialog'],
        data: { action: this.summon.additionalAction }
      });

      dialog.closed.subscribe({
        next: (value) => {
          if (value == false && this.summon) {
            this.summon.additionalAction = undefined;
          }
          this.changeSummon();
        }
      })
    }
  }
}


@Component({
	standalone: false,
  selector: 'ghs-editor-action-dialog',
  templateUrl: './action-dialog.html',
  styleUrls: ['./action-dialog.scss']
})
export class EditorActionDialogComponent {

  relative: boolean = true;
  noPreview: ActionType[] = [];

  constructor(@Inject(DIALOG_DATA) public data: { action: Action }, private dialogRef: DialogRef) { }

  deleteAction() {
    this.dialogRef.close(false);
  }
}
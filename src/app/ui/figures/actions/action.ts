import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionHex, ActionType, ActionValueType } from 'src/app/game/model/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { FigureError } from 'src/app/game/model/FigureError';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-actions',
  templateUrl: './actions.html',
  styleUrls: [ './actions.scss' ]
})
export class ActionsComponent {

  @Input() monster!: Monster;
  @Input() actions!: Action[];
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;
  @Input() hint!: string | undefined;
  ActionType = ActionType;
  ActionValueType = ActionValueType;

}

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: [ './action.scss' ]
})
export class ActionComponent implements OnInit {

  @Input() monster!: Monster;
  @Input() action!: Action;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;

  additionalSubActions: Action[] = [];

  ActionType = ActionType;
  ActionValueType = ActionValueType;

  invertIcons: ActionType[] = [ ActionType.attack, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport ];

  getNormalValue() {
    if (this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue() {
    if (!this.monster.entities.some((monsterEntity: MonsterEntity) => monsterEntity.type == MonsterType.elite && !monsterEntity.dead)) {
      return this.getNormalValue();
    }

    return this.getValue(MonsterType.elite);
  }

  getStat(type: MonsterType): MonsterStat {
    return gameManager.monsterManager.getStat(this.monster, type);
  }

  getValues(action: Action): string[] {
    if (action.value && typeof action.value === "string") {
      return action.value.split('|');
    }
    return [];
  }

  getSpecial(action: Action): Action[] {
    return this.getStat(MonsterType.boss).special[ (action.value as number) - 1 ];
  }

  getValue(type: MonsterType): number | string {
    const stat = this.getStat(type);
    if (settingsManager.settings.calculate && !this.relative) {
      let statValue: number = 0;
      let sign: boolean = true;
      switch (this.action.type) {
        case ActionType.attack:
          if (typeof stat.attack === "number") {
            statValue = stat.attack;
          } else {
            try {
              statValue = EntityValueFunction(stat.attack, this.monster.level);
            } catch {
              sign = false;
            }
          }
          break;
        case ActionType.move:
          statValue = stat.movement;
          break;
        case ActionType.range:
          statValue = stat.range;
          break;
      }

      if (typeof this.action.value === "number" && sign) {
        if (isNaN(statValue)) {
          statValue = 0;
        }
        if (this.action.valueType == ActionValueType.plus) {
          return statValue + this.action.value;
        } else if (this.action.valueType == ActionValueType.minus) {
          return statValue - this.action.value;
        }
      }

    }

    if (this.action.valueType == ActionValueType.plus) {
      return "+ " + this.action.value;
    } else if (this.action.valueType == ActionValueType.minus) {
      return "- " + this.action.value;
    } else {
      return this.action.value;
    }
  }

  ngOnInit(): void {
    this.updateAdditionalSubActions();
    gameManager.uiChange.subscribe((value: boolean) => {
      this.updateAdditionalSubActions();
    })
  }


  updateAdditionalSubActions(): void {
    this.additionalSubActions = [];
    if (settingsManager.settings.calculateStats) {
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      if (this.action.type == ActionType.attack) {
        if (stat.range && (!this.action.subActions || !this.action.subActions.some((subAction: Action) => subAction.type == ActionType.range || subAction.type == ActionType.area || subAction.type == ActionType.specialTarget))) {
          this.additionalSubActions.unshift(new Action(ActionType.range, 0, ActionValueType.plus));
        }
      }
    }
  }

  isInvertIcon(type: ActionType) {
    return this.invertIcons.indexOf(type) != -1;
  }

}

@Component({
  selector: 'ghs-action-hex',
  templateUrl: './hex.html',
  styleUrls: [ './hex.scss' ]
})
export class ActionHexComponent implements OnChanges {

  @Input() value!: string;
  @Input() size!: number;
  hexes: ActionHex[] = [];
  ActionHex = ActionHex;

  ngOnChanges(changes: any) {
    this.hexes = [];
    this.value.split('|').forEach((hexValue: string) => {
      const hex: ActionHex | null = ActionHex.fromString(hexValue);
      if (hex != null) {
        this.hexes.push(hex);
      }
    })
  }

}
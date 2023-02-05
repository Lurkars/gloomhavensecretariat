import { Component, Input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionTypesIcons, ActionValueType } from 'src/app/game/model/Action';
import { ElementState } from 'src/app/game/model/Element';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';
import { valueCalc } from '../../helper/valueCalc';

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class ActionComponent implements OnInit {

  @Input() monster: Monster | undefined;
  @Input() action!: Action | undefined;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() highlight: boolean = false;
  @Input() highlightElements: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;

  settingsManager: SettingsManager = settingsManager;

  subActions: Action[] = [];
  additionalSubActions: Action[] = [];
  elementActions: Action[] = [];
  additionAttackSubActionTypes: ActionType[] = [ActionType.condition, ActionType.target, ActionType.pierce, ActionType.pull, ActionType.push, ActionType.swing, ActionType.area];

  ActionType = ActionType;
  ActionValueType = ActionValueType;
  MonsterType = MonsterType;

  hasAOE: boolean = false;

  forceRelative: boolean = false;

  ngOnInit(): void {
    this.updateSubActions();
    this.forceRelative = !this.hasEntities();
    this.checkPlusAction();
    gameManager.uiChange.subscribe({
      next: () => {
        this.updateSubActions();
        this.forceRelative = !this.hasEntities();
        this.checkPlusAction();
      }
    })
  }

  checkPlusAction() {
    if (!this.relative && !this.forceRelative && settingsManager.settings.calculate && this.action && (this.action.type == ActionType.shield || this.action.type == ActionType.retaliate) && this.action.valueType != ActionValueType.minus && this.action.subActions && this.action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && (subAction.value + '').startsWith('self'))) {
      this.forceRelative = true;
    }
  }

  hasEntities(type: MonsterType | string | undefined = undefined): boolean {
    if (typeof type === 'string') {
      type = type as MonsterType;
    }
    if (type == MonsterType.normal && this.monster && this.monster.boss) {
      return this.hasEntities(MonsterType.boss);
    }

    return this.monster && this.monster.entities.some((monsterEntity) => (!type || monsterEntity.type == type) && !monsterEntity.dead && monsterEntity.health > 0) || false;
  }

  getNormalValue(): number | string {
    if (this.monster && this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue(): number | string {
    if (!this.hasEntities(MonsterType.elite)) {
      return this.getNormalValue();
    }

    return this.getValue(MonsterType.elite);
  }

  getStat(type: MonsterType): MonsterStat {
    if (this.monster) {
      return gameManager.monsterManager.getStat(this.monster, type);
    }
    return new MonsterStat(type, gameManager.game.level, 0, 0, 0, 0);
  }

  getRange(type: MonsterType = MonsterType.normal): string | number {
    if (this.monster && this.monster.boss) {
      type = MonsterType.boss;
    }

    return valueCalc(this.getStat(type).range, this.monster ? this.monster.level : undefined);
  }

  getEliteRange(): number | string {
    if (this.monster && !this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && !monsterEntity.dead)) {
      return this.getRange();
    }

    return this.getRange(MonsterType.elite);
  }

  getValues(action: Action): string[] {
    if (action.value && typeof action.value === "string") {
      return action.value.split(':');
    }
    return [];
  }

  getSpecial(action: Action): Action[] {
    if (this.monster && this.monster.boss) {
      return this.getStat(MonsterType.boss).special[(action.value as number) - 1];
    } else {
      const normalSpecial = this.getStat(MonsterType.normal).special[(action.value as number) - 1];
      const eliteSpecial = this.getStat(MonsterType.elite).special[(action.value as number) - 1];

      if (normalSpecial != eliteSpecial && JSON.stringify(normalSpecial) != JSON.stringify(eliteSpecial)) {
        return [
          new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, normalSpecial),
          new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, eliteSpecial)
        ]
      }

      return normalSpecial;
    }
  }

  getValue(type: MonsterType): number | string {
    if (!this.action) {
      return "";
    }

    if (settingsManager.settings.calculate && !this.relative && !this.forceRelative) {
      const stat = this.getStat(type);
      let statValue: number = 0;
      let sign: boolean = true;
      switch (this.action.type) {
        case ActionType.attack:
          if (typeof stat.attack === "number") {
            statValue = stat.attack;
          } else {
            try {
              statValue = EntityValueFunction(stat.attack, this.monster && this.monster.level || gameManager.game.level);
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
        case ActionType.shield:
        case ActionType.retaliate:
          if (!this.action.subActions || !this.action.subActions.find((shieldSubAction) => shieldSubAction.type == ActionType.specialTarget && shieldSubAction.value != 'self')) {
            const statAction = stat.actions && stat.actions.find((statAction) => this.action && statAction.type == this.action.type);
            if (statAction && statAction != this.action) {
              statValue = EntityValueFunction(statAction.value);
            }
          }
          break;
      }

      if ((this.action.type == ActionType.shield || this.action.type == ActionType.retaliate) && statValue > 0) {
        return statValue + EntityValueFunction(this.action.value);
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
      return "+" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
    } else if (this.action.valueType == ActionValueType.minus) {
      return "-" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
    } else {
      return this.action.value;
    }
  }

  updateSubActions(): void {
    if (!this.action) {
      return;
    }
    this.subActions = JSON.parse(JSON.stringify(this.action.subActions || []));

    if (settingsManager.settings.fhStyle && [ActionType.element, ActionType.concatenation, ActionType.box].indexOf(this.action.type) == -1) {
      this.elementActions = this.subActions.filter((action) => action.type == ActionType.element);
      this.subActions = this.subActions.filter((action) => action.type != ActionType.element);
    } else {
      this.elementActions = [];
    }

    this.additionalSubActions = JSON.parse(JSON.stringify(this.subActions));
    this.hasAOE = this.additionalSubActions.some((subAction, index) => index == 0 && subAction.type == ActionType.area) && (this.action.type != ActionType.element || this.action.valueType != ActionValueType.minus);
    if (this.monster && settingsManager.settings.calculateStats && !this.relative) {
      let newSubActions: Action[] = [];
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
      if (this.action.type == ActionType.attack && this.action.valueType != ActionValueType.add && this.action.valueType != ActionValueType.subtract) {
        if (stat.range && (!this.subActions.some((subAction) => subAction.type == ActionType.range || subAction.type == ActionType.area && ("" + subAction.value).indexOf('active') != -1 || subAction.type == ActionType.specialTarget))) {
          const newSubAction = new Action(ActionType.range, 0, ActionValueType.plus);
          newSubAction.small = true;
          this.additionalSubActions.splice(this.hasAOE ? 1 : 0, 0, newSubAction);
        }

        if (stat.actions && this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && (monsterEntity.type == MonsterType.normal || monsterEntity.type == MonsterType.boss))) {
          let normalActions: Action | undefined = undefined;
          stat.actions.filter((statAction) => this.additionAttackSubActionTypes.indexOf(statAction.type) != -1).forEach((statAction) => {
            const newStatAction = new Action(statAction.type, statAction.value, statAction.valueType, statAction.subActions);
            if (!this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction)) {
              if (statAction.type != ActionType.area || this.subActions.every((subAction) => subAction.type != ActionType.area)) {
                if (!eliteStat || eliteStat.actions && this.subActionExists(eliteStat.actions, newStatAction) || (settingsManager.settings.hideStats && this.monster && !this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite))) {
                  newStatAction.small = true;
                  newSubActions.push(newStatAction);
                } else if (eliteStat && (!eliteStat.actions || !this.subActionExists(eliteStat.actions, newStatAction))) {
                  if (!normalActions && !this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction)) {
                    normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction]);
                    newSubActions.push(normalActions);
                  } else if (normalActions && !this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction) && !this.subActionExists(normalActions.subActions, newStatAction)) {
                    normalActions.subActions.push(newStatAction);
                  }
                }
              }
            }
          })
        }

        if (eliteStat && this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite)) {
          let eliteActions: Action | undefined = undefined;
          eliteStat.actions.filter((eliteAction) => this.additionAttackSubActionTypes.indexOf(eliteAction.type) != -1).forEach((eliteAction) => {
            const newEliteAction = new Action(eliteAction.type, eliteAction.value, eliteAction.valueType, eliteAction.subActions);
            if (!stat.actions || !this.subActionExists(stat.actions, newEliteAction)) {
              if (!eliteActions && !this.subActionExists(this.subActions, newEliteAction) && !this.subActionExists(newSubActions, newEliteAction)) {
                eliteActions = new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [newEliteAction]);
                newSubActions.push(eliteActions);
              } else if (eliteActions && !this.subActionExists(this.subActions, newEliteAction) && !this.subActionExists(newSubActions, newEliteAction) && !this.subActionExists(eliteActions.subActions, newEliteAction)) {
                eliteActions.subActions.push(newEliteAction);
              }
            }
          })
        }
      }

      newSubActions.forEach((subAction) => {
        if (subAction.type == ActionType.target) {
          if (!this.additionalSubActions.some((other) => other.type == ActionType.target || other.type == ActionType.specialTarget)) {
            if (subAction.valueType == ActionValueType.add) {
              subAction.valueType = ActionValueType.fixed;
              subAction.value = (+subAction.value) + 1;
            }
            this.additionalSubActions.push(subAction);
          } else if (subAction.valueType == ActionValueType.add && this.additionalSubActions.some((other) => other.type == ActionType.target) && !this.additionalSubActions.some((other) => other.type == ActionType.specialTarget)) {
            const targetAction = this.additionalSubActions.find((other) => other.type == ActionType.target);
            if (targetAction) {
              subAction.valueType = ActionValueType.fixed;
              subAction.value = +targetAction.value + +subAction.value;
              this.additionalSubActions.splice(this.additionalSubActions.indexOf(targetAction), 1, subAction);
            }
          }
        } else if (subAction.type == ActionType.range && !this.additionalSubActions.some((other) => other.type == ActionType.range)) {
          this.additionalSubActions.push(subAction);
        } else if (subAction.type != ActionType.range && !this.subActionExists(this.additionalSubActions, subAction)) {
          if (subAction.type == ActionType.area) {
            this.additionalSubActions.splice(0, 0, subAction);
            this.hasAOE = true;
          } else {
            if (subAction.type == ActionType.card && this.subActions.find((subAction) => subAction.type == ActionType.pierce)) {
              const pieceAction = this.subActions.find((subAction) => subAction.type == ActionType.pierce);
              if (pieceAction) {
                pieceAction.value = +pieceAction.value
                  + +subAction.value
              }
            } else {
              subAction.small = true;
              if (subAction.type == ActionType.monsterType) {
                subAction.small = false;
                subAction.subActions.forEach((sub) => sub.small = true);
              }
              this.additionalSubActions.push(subAction);
            }
          }
        }
      })

      let redundantAction = this.additionalSubActions.find((action) => (action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType == ActionValueType.minus && action.subActions.every((subAction) => this.subActionExists(newSubActions, subAction)));

      if (settingsManager.settings.fhStyle) {
        redundantAction = this.elementActions.find((action) => (action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType == ActionValueType.minus && action.subActions.every((subAction) => this.subActionExists(newSubActions, subAction)));
      }

      while (redundantAction) {
        if (settingsManager.settings.fhStyle) {
          this.elementActions.splice(this.elementActions.indexOf(redundantAction), 1);
          redundantAction = this.elementActions.find((action) => (action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType == ActionValueType.minus && action.subActions.every((subAction) => this.subActionExists(newSubActions, subAction)));
        } else {
          this.additionalSubActions.splice(this.additionalSubActions.indexOf(redundantAction), 1);
          redundantAction = this.additionalSubActions.find((action) => (action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType == ActionValueType.minus && action.subActions.every((subAction) => this.subActionExists(newSubActions, subAction)));
        }
      }

      if (this.additionalSubActions.some((action, index, self) => action.type == ActionType.monsterType && index < self.length - 1 && self[index + 1].type == ActionType.monsterType)) {
        const index = this.additionalSubActions.findIndex((action) => action.type == ActionType.monsterType);
        this.additionalSubActions.splice(index, 2, new Action(ActionType.grid, "", ActionValueType.fixed, [this.additionalSubActions[index], this.additionalSubActions[index + 1]]));
      }
    }

  }

  subActionExists(additionalSubActions: Action[], subAction: Action): boolean {
    return additionalSubActions.some((action) => action.type == subAction.type && action.value == subAction.value && (action.valueType || ActionValueType.fixed) == (subAction.valueType || ActionValueType.fixed));
  }

  isGhsSvg(type: ActionType) {
    return ActionTypesIcons.indexOf(type) != -1;
  }

  highlightElement(elementType: string, consume: boolean): boolean {
    return this.highlightElements && this.monster && this.monster.active && (!consume && gameManager.game.elementBoard.some((element) => element.type == elementType && element.state != ElementState.new && element.state != ElementState.strong) || consume && gameManager.game.elementBoard.some((element) => element.type == elementType && (element.state == ElementState.strong || element.state == ElementState.waning))) || false;
  }

  elementAction(event: any, action: Action, element: string) {
    if (this.monster && this.highlightElement(element, action.valueType == ActionValueType.minus)) {
      if (action.valueType == ActionValueType.minus) {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element && this.monster) {
            gameManager.stateManager.before("monsterConsumeElement", "data.monster." + this.monster.name, "game.element." + element);
            elementModel.state = ElementState.inert;
            gameManager.stateManager.after();
          }
        })
      } else {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element && this.monster) {
            gameManager.stateManager.before("monsterInfuseElement", "data.monster." + this.monster.name, "game.element." + element);
            elementModel.state = ElementState.new;
            gameManager.stateManager.after();
          }
        })
      }
      event.preventDefault();
    }
  }
}
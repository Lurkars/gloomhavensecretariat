import { Component, Input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/Action';
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

  invertIcons: ActionType[] = [ActionType.attack, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport];

  hasAOE: boolean = false;

  getNormalValue(): number | string {
    if (this.monster && this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue(): number | string {
    if (this.monster && !this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && !monsterEntity.dead)) {
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

    if (settingsManager.settings.calculate && !this.relative) {
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

  ngOnInit(): void {
    this.updateSubActions();
    gameManager.uiChange.subscribe({
      next: () => {
        this.updateSubActions();
      }
    })
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
    this.hasAOE = this.additionalSubActions.some((subAction, index) => index == 0 && subAction.type == ActionType.area);
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

        if (stat.actions) {
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
                    normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction])
                    newSubActions.push(normalActions);
                  } else if (normalActions && !this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction) && !this.subActionExists(normalActions.subActions, newStatAction)) {
                    newStatAction.small = true;
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
                newEliteAction.small = true;
                newSubActions.push(eliteActions);
              } else if (eliteActions && !this.subActionExists(this.subActions, newEliteAction) && !this.subActionExists(newSubActions, newEliteAction) && !this.subActionExists(eliteActions.subActions, newEliteAction)) {
                newEliteAction.small = true;
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
            subAction.small = true;
            this.additionalSubActions.push(subAction);
          }
        }
      })

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
    return this.invertIcons.indexOf(type) != -1;
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
      event.stopPropagation();
    }
  }
}
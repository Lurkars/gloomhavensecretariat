import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EntityExpressionRegex, EntityValueFunction, EntityValueRegex } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Action, ActionSpecialTarget, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionType } from 'src/app/game/model/data/Condition';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { valueCalc } from '../../helper/valueCalc';

export const ActionTypesIcons: ActionType[] = [ActionType.attack, ActionType.damage, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport];

@Component({
	standalone: false,
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class ActionComponent implements OnInit, OnDestroy {

  @Input() monster: Monster | undefined;
  @Input() monsterType: MonsterType | undefined;
  @Input() objective: ObjectiveContainer | undefined;
  @Input('action') origAction!: Action | undefined;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() textBlack: boolean = false;
  @Input() right: boolean = false;
  @Input() highlight: boolean = false;
  @Input() interactiveAbilities: boolean = false;
  @Input() interactiveActions: InteractiveAction[] = [];
  @Output() interactiveActionsChange = new EventEmitter<InteractiveAction[]>();
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;
  @Input('index') actionIndex: string = "";
  @Input() style: 'gh' | 'fh' | false = false;

  action!: Action | undefined;
  normalValue: number | string = "";
  eliteValue: number | string = "";
  values: string[] = [];
  specialActions: Action[] = [];
  subActions: Action[] = [];
  fhStyle: boolean = false;
  flying: boolean = false;
  isInteractiveApplicableAction: boolean = false;

  settingsManager: SettingsManager = settingsManager;
  EntityValueFunction = EntityValueFunction;

  additionalSubActions: Action[] = [];
  elementActions: Action[] = [];
  additionAttackSubActionTypes: ActionType[] = [ActionType.condition, ActionType.target, ActionType.pierce, ActionType.pull, ActionType.push, ActionType.swing, ActionType.area];

  ActionType = ActionType;
  ActionValueType = ActionValueType;
  MonsterType = MonsterType;

  hasAOE: boolean = false;

  forceRelative: boolean = false;

  level: number = 0;

  ngOnInit(): void {
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.fhStyle = settingsManager.settings.fhStyle && !this.style || this.style == 'fh';
    if (this.origAction) {
      this.action = JSON.parse(JSON.stringify(this.origAction));
    } else {
      this.action = undefined;
    }
    if (this.action && !this.action.subActions) {
      this.action.subActions = [];
    }
    if (!settingsManager.settings.calculate && this.action && this.action.subActions) {
      const nonCalcAction = this.action.subActions.find((subAction) => subAction.type == ActionType.nonCalc);
      if (nonCalcAction) {
        this.action = nonCalcAction;
      }
    }
    if (this.action && this.action.value === undefined) {
      this.action.value = "";
    }

    if (this.action && this.action.type == ActionType.monsterType) {
      this.monsterType = this.action.value as MonsterType;
    }

    this.updateSubActions();
    this.applyChallenges();

    this.forceRelative = this.monster != undefined && !this.hasEntities();
    if (this.monster && !this.relative && !this.forceRelative && settingsManager.settings.calculate && this.action && (this.action.type == ActionType.shield || this.action.type == ActionType.retaliate) && this.action.valueType != ActionValueType.minus && this.action.subActions && this.action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && !(subAction.value + '').startsWith('self'))) {
      this.forceRelative = true;
      this.action.valueType = ActionValueType.plus;
    }

    if (this.monster) {
      this.level = this.monster.level;
    } else {
      this.level = gameManager.game.level;
    }

    this.flying = false;
    if (this.monster) {
      this.flying = this.monster.flying && (!this.monster.statEffect || this.monster.statEffect.flying != 'disabled') || this.monster.statEffect != undefined && this.monster.statEffect.flying == true;
    }

    if (this.action) {
      this.normalValue = this.getNormalValue();
      this.eliteValue = this.getEliteValue();
      this.values = this.getValues(this.action, true);
      this.specialActions = this.getSpecial(this.action);
    }

    this.isInteractiveApplicableAction = this.interactiveAbilities && this.monster && this.monster.entities.some((entity) => this.origAction && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.origAction, this.actionIndex)) || this.objective && this.objective.entities.some((entity) => this.origAction && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.origAction, this.actionIndex)) || false;
  }

  hasEntities(type: MonsterType | string | undefined = undefined): boolean {
    if (typeof type === 'string') {
      type = type as MonsterType;
    }
    if (type == MonsterType.normal && this.monster && this.monster.boss) {
      return this.hasEntities(MonsterType.boss);
    }

    return this.monster && (!this.monsterType || !type || this.monsterType == type) && this.monster.entities.some((monsterEntity) => (!type || monsterEntity.type == type) && gameManager.entityManager.isAlive(monsterEntity)) || false;
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

  getMonsterType(value: string): MonsterType {
    return value as MonsterType;
  }

  getStat(type: MonsterType): MonsterStat {
    if (this.monster) {
      return gameManager.monsterManager.getStat(this.monster, type);
    }
    return new MonsterStat(type, gameManager.game.level);
  }

  getRange(type: MonsterType = MonsterType.normal): string | number {
    if (this.monster && this.monster.boss) {
      type = MonsterType.boss;
    }

    return valueCalc(this.getStat(type).range, this.monster ? this.monster.level : undefined);
  }

  getEliteRange(): number | string {
    if (this.monster && !this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && gameManager.entityManager.isAlive(monsterEntity))) {
      return this.getRange();
    }

    return this.getRange(MonsterType.elite);
  }

  getValues(action: Action, force: boolean = false): string[] {
    if (!force) {
      return [...this.values];
    }
    return gameManager.actionsManager.getValues(action);
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
          } else if (stat.attack.indexOf('X') != -1) {
            if (this.action.valueType == ActionValueType.plus) {
              return stat.attack + " +" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
            } else if (this.action.valueType == ActionValueType.minus) {
              return stat.attack + " -" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
            }
            sign = false;
          } else {
            try {
              statValue = EntityValueFunction(stat.attack, this.level);
            } catch (e) {
              sign = false;
            }
          }

          if (stat.actions) {
            stat.actions.forEach((statAction) => {
              if (statAction.type == ActionType.attack) {
                if (statAction.valueType == ActionValueType.add) {
                  statValue += EntityValueFunction(statAction.value, this.level);
                } else if (statAction.valueType == ActionValueType.subtract) {
                  statValue -= EntityValueFunction(statAction.value, this.level);
                  if (statValue < 0) {
                    statValue = 0;
                  }
                }
              }
            })
          }

          break;
        case ActionType.move:
          statValue = EntityValueFunction(stat.movement, this.level);
          break;
        case ActionType.range:
          statValue = EntityValueFunction(stat.range, this.level);
          break;
      }

      if (sign && (this.action.value || this.action.value == 0) && (typeof this.action.value === 'number' || this.action.value.match(EntityExpressionRegex) || this.action.value.match(EntityValueRegex))) {
        if (this.action.valueType == ActionValueType.plus) {
          return statValue + EntityValueFunction(this.action.value);
        } else if (this.action.valueType == ActionValueType.minus) {
          if (!statValue) {
            return "-";
          }
          return statValue - EntityValueFunction(this.action.value);
        }
      }
    }

    if (settingsManager.settings.calculateStats && settingsManager.settings.calculateShieldStats && !this.relative && !this.forceRelative) {
      const stat = this.getStat(type);
      let statValue: number = 0;
      if (this.action.type == ActionType.shield || this.action.type == ActionType.retaliate) {
        if (!this.action.subActions || !this.action.subActions.find((shieldSubAction) => shieldSubAction.type == ActionType.specialTarget && !(shieldSubAction.value + '').startsWith('self'))) {
          const rangeSubAction: Action | undefined = this.action.subActions && this.action.subActions.find((subAction) => subAction.type == ActionType.range);
          const statActions = stat.actions && stat.actions.filter((statAction) => this.action && statAction.type == this.action.type) || [];
          statActions.forEach((statAction) => {
            if (this.action && statAction != this.action) {
              const statRangeSubAction: Action | undefined = statAction.subActions && statAction.subActions.find((subAction) => subAction.type == ActionType.range);
              if (!rangeSubAction && !statRangeSubAction || rangeSubAction && statRangeSubAction && EntityValueFunction(rangeSubAction.value, this.level) == EntityValueFunction(statRangeSubAction.value, this.level)) {
                statValue = EntityValueFunction(statAction.value, this.level);
              }
            }
          })
        }

        if (statValue > 0) {
          return statValue + EntityValueFunction(this.action.value, this.level);
        }
      }
    }

    if (this.action.valueType == ActionValueType.plus) {
      return "+" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
    } else if (this.action.valueType == ActionValueType.minus) {
      return "-" + (settingsManager.settings.fhStyle ? '' : ' ') + this.action.value;
    } else {
      return settingsManager.settings.calculate && (('' + this.action.value).match(EntityExpressionRegex) || ('' + this.action.value).match(EntityValueRegex)) ? EntityValueFunction(this.action.value, this.level) : this.action.value;
    }
  }

  getConditionName(name: string): string {
    return new Condition(name).name;
  }

  updateSubActions(): void {
    if (!this.action) {
      return;
    }
    this.elementActions = [];
    if (settingsManager.settings.fhStyle && [ActionType.element, ActionType.concatenation, ActionType.box].indexOf(this.action.type) == -1) {
      this.action.subActions.forEach((action) => {
        if (action.type == ActionType.element) {
          this.elementActions.push(action);
        }
      });
      this.action.subActions = this.action.subActions.filter((action) => action.type != ActionType.element);
    }

    this.action.subActions = this.action.subActions.filter((action) => action.type != ActionType.nonCalc);

    this.additionalSubActions = JSON.parse(JSON.stringify(this.action.subActions));
    this.hasAOE = this.additionalSubActions.some((subAction, index) => index == 0 && subAction.type == ActionType.area) && (this.action.type != ActionType.element || this.action.valueType != ActionValueType.minus);
    if (this.monster && settingsManager.settings.calculateStats && !this.relative) {
      let newSubActions: Action[] = [];
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
      if (this.action.type == ActionType.attack && this.action.valueType != ActionValueType.add && this.action.valueType != ActionValueType.subtract) {
        let normalActions: Action | undefined = this.additionalSubActions.find((typeAction) => typeAction.type == ActionType.monsterType && typeAction.value == MonsterType.normal);
        let eliteActions: Action | undefined = this.additionalSubActions.find((typeAction) => typeAction.type == ActionType.monsterType && typeAction.value == MonsterType.elite);

        if ((stat.range || eliteStat && eliteStat.range) && (!this.action.subActions.some((subAction) => subAction.type == ActionType.range || subAction.type == ActionType.area && ("" + subAction.value).indexOf('active') != -1 || subAction.type == ActionType.specialTarget))) {
          const newStatAction = new Action(ActionType.range, 0, ActionValueType.plus);
          newStatAction.small = true;
          if (stat.range && (eliteStat && eliteStat.range || !eliteStat)) {
            this.additionalSubActions.splice(this.hasAOE ? 1 : 0, 0, newStatAction);
          } else if (stat.range) {
            if (normalActions) {
              normalActions.subActions.push(newStatAction);
            } else {
              normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction]);
              newSubActions.push(normalActions);
            }
          } else if (eliteStat && eliteStat.range) {
            if (eliteActions) {
              eliteActions.subActions.push(newStatAction);
            } else {
              eliteActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction]);
              newSubActions.push(eliteActions);
            }
          }
        }

        if (stat.actions && this.monster.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && (monsterEntity.type == MonsterType.normal || monsterEntity.type == MonsterType.boss))) {
          stat.actions.filter((statAction) => this.additionAttackSubActionTypes.indexOf(statAction.type) != -1).forEach((statAction) => {
            const newStatAction = new Action(statAction.type, statAction.value, statAction.valueType, statAction.subActions);
            if (this.action && !this.subActionExists(this.action.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction)) {
              if (statAction.type != ActionType.area || this.action.subActions.every((subAction) => subAction.type != ActionType.area)) {
                if (!eliteStat || eliteStat.actions && this.subActionExists(eliteStat.actions, newStatAction, false) || (this.monster && !this.monster.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == MonsterType.elite))) {
                  newStatAction.small = true;
                  newSubActions.push(newStatAction);
                } else if (eliteStat && (!eliteStat.actions || !this.subActionExists(eliteStat.actions, newStatAction))) {
                  if (!this.subActionExists(this.action.subActions, newStatAction) && !this.subActionExists(newSubActions, newStatAction)) {
                    if (normalActions) {
                      if (!this.subActionExists(normalActions.subActions, newStatAction)) {
                        normalActions.subActions.push(newStatAction);
                      }
                    } else {
                      normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction]);
                      newSubActions.push(normalActions);
                    }
                  }
                }
              }
            }
          })
        }

        if (eliteStat && eliteStat.actions && this.monster.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == MonsterType.elite)) {
          eliteStat.actions.filter((eliteAction) => this.additionAttackSubActionTypes.indexOf(eliteAction.type) != -1).forEach((eliteAction) => {
            const newEliteAction = new Action(eliteAction.type, eliteAction.value, eliteAction.valueType, eliteAction.subActions);
            if (this.action && (!stat.actions || !this.subActionExists(stat.actions, newEliteAction, false) || !this.hasEntities(MonsterType.normal))) {
              if (this.monster && !this.monster.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == MonsterType.normal)) {
                newEliteAction.small = true;
                newSubActions.push(newEliteAction);
              } else if (!this.subActionExists(this.action.subActions, newEliteAction) && !this.subActionExists(newSubActions, newEliteAction)) {

                if (eliteActions) {
                  if (!this.subActionExists(eliteActions.subActions, newEliteAction)) {
                    eliteActions.subActions.push(newEliteAction);
                  }
                } else {
                  eliteActions = new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [newEliteAction]);
                  newSubActions.push(eliteActions);
                }
              }
            }
          })
        }
      }

      newSubActions.forEach((subAction) => {
        if (this.action) {
          if (subAction.type == ActionType.target) {
            if (!this.additionalSubActions.some((other) => other.type == ActionType.target || other.type == ActionType.specialTarget && other.value != ActionSpecialTarget.enemyOneAll)) {
              if (subAction.valueType == ActionValueType.add) {
                subAction.valueType = ActionValueType.fixed;
                subAction.value = EntityValueFunction(subAction.value, this.level) + 1;
              }
              if (this.additionalSubActions.length > 0 && (this.additionalSubActions[this.additionalSubActions.length - 1].type == ActionType.element || this.additionalSubActions[this.additionalSubActions.length - 1].type == ActionType.specialTarget && this.additionalSubActions[this.additionalSubActions.length - 1].value == ActionSpecialTarget.enemyOneAll)) {
                this.additionalSubActions.splice(this.additionalSubActions.length - 1, 0, subAction);
              } else {
                this.additionalSubActions.push(subAction);
              }
            } else if ((subAction.valueType == ActionValueType.add || subAction.valueType == ActionValueType.fixed) && this.additionalSubActions.some((other) => other.type == ActionType.target) && !this.additionalSubActions.some((other) => other.type == ActionType.specialTarget)) {
              const targetAction = this.additionalSubActions.find((other) => other.type == ActionType.target && other != subAction);
              if (targetAction) {
                subAction.valueType = ActionValueType.fixed;
                subAction.value = EntityValueFunction(subAction.value, this.level) + (targetAction.valueType != ActionValueType.subtract && targetAction.valueType != ActionValueType.minus ? EntityValueFunction(targetAction.value, this.level) : - EntityValueFunction(targetAction.value, this.level));
                this.additionalSubActions.splice(this.additionalSubActions.indexOf(targetAction), 1, subAction);
              }
            }
          } else if (subAction.type == ActionType.range && !this.additionalSubActions.some((other) => other.type == ActionType.range)) {
            if (this.additionalSubActions.length > 0 && this.action.subActions[this.additionalSubActions.length - 1].type == ActionType.element) {
              this.additionalSubActions.splice(this.action.subActions.length - 1, 0, subAction);
            } else {
              this.additionalSubActions.push(subAction);
            }
          } else if (subAction.type != ActionType.range && !this.subActionExists(this.additionalSubActions, subAction)) {
            if (subAction.type == ActionType.area) {
              this.additionalSubActions.splice(0, 0, subAction);
              this.hasAOE = true;
            } else {
              if (this.action && subAction.type == ActionType.card && this.action.subActions.find((subAction) => subAction.type == ActionType.pierce)) {
                const pieceAction = this.action.subActions.find((subAction) => subAction.type == ActionType.pierce);
                if (pieceAction) {
                  pieceAction.value = EntityValueFunction(pieceAction.value, this.level) + EntityValueFunction(subAction.value, this.level);
                }
              } else {
                subAction.small = true;
                if (subAction.type == ActionType.monsterType) {
                  subAction.small = false;
                  subAction.subActions.forEach((sub) => sub.small = true);
                }
                if (this.additionalSubActions.length > 0 && this.additionalSubActions[this.additionalSubActions.length - 1].type == ActionType.element) {
                  this.additionalSubActions.splice(this.additionalSubActions.length - 1, 0, subAction);
                } else {
                  this.additionalSubActions.push(subAction);
                }
              }
            }
          }
        }
      })

      const targetSubAction = this.additionalSubActions.find((other) => other.type == ActionType.target && (other.valueType == ActionValueType.add || other.valueType == ActionValueType.subtract));
      if (targetSubAction) {
        let removeTargetSubAction = false;
        newSubActions.forEach((subAction) => {
          if (this.action) {
            if (subAction.type == ActionType.monsterType && subAction.subActions.find((typeSubAction) => typeSubAction.type == ActionType.target)) {
              const subActionTargetAction = subAction.subActions.find((typeSubAction) => typeSubAction.type == ActionType.target);
              if (subActionTargetAction) {
                removeTargetSubAction = true;
                subActionTargetAction.value = EntityValueFunction(subActionTargetAction.value, this.level) + (targetSubAction.valueType == ActionValueType.add ? EntityValueFunction(targetSubAction.value, this.level) : -EntityValueFunction(targetSubAction.value, this.level));
              }
            }
          }
        })
        if (removeTargetSubAction) {
          this.additionalSubActions.splice(this.additionalSubActions.indexOf(targetSubAction), 1);
        } else {

        }
      }

      if (this.action.type == ActionType.move && !this.action.subActions.find((subAction) => subAction.type == ActionType.jump)) {
        let jumpAction = new Action(ActionType.jump, "");
        jumpAction.small = true;
        if (stat.actions.find((subAction) => subAction.type == ActionType.jump)) {

          if (!eliteStat || eliteStat.actions.find((subAction) => subAction.type == ActionType.jump) || !this.hasEntities(MonsterType.elite)) {
            this.additionalSubActions.push(jumpAction);
          } else {
            this.additionalSubActions.push(new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [jumpAction]));
          }
        } else if (eliteStat && eliteStat.actions.find((subAction) => subAction.type == ActionType.jump)) {
          if (this.hasEntities(MonsterType.normal)) {
            this.additionalSubActions.push(new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [jumpAction]));
          } else {
            this.additionalSubActions.push(jumpAction);
          }
        }
      }

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

    this.subActions = this.action.subActions.filter((action) => !action.hidden);
    this.additionalSubActions = this.additionalSubActions.filter((action) => !action.hidden);
  }

  subActionExists(additionalSubActions: Action[], subAction: Action, stackableCondition: boolean = true): boolean {
    if (stackableCondition && subAction.type == ActionType.condition && (new Condition(subAction.value + '').types.indexOf(ConditionType.stackable) != -1)) {
      return false;
    }

    return additionalSubActions.some((action) => action.type == subAction.type && action.value == subAction.value && (action.valueType || ActionValueType.fixed) == (subAction.valueType || ActionValueType.fixed));
  }

  applyChallenges() {

    if (this.action && this.monster) {
      if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1488, 'fh')) {
        if (this.action.type == ActionType.attack) {
          this.additionalSubActions.forEach((subAction) => {
            if (this.monster && subAction.type == ActionType.range) {
              subAction.value = EntityValueFunction(subAction.value, this.monster.level) + (subAction.valueType == ActionValueType.minus || subAction.valueType == ActionValueType.subtract ? -1 : 1);
            }
          })
        }

        if (this.action.type == ActionType.move) {
          this.action.value = EntityValueFunction(this.action.value, this.monster.level) + (this.action.valueType == ActionValueType.minus || this.action.valueType == ActionValueType.subtract ? -1 : 1);
        }
      }

      if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1498, 'fh')) {
        if (this.action.type == ActionType.attack && this.additionalSubActions.find((subAction) => subAction.type == ActionType.range)) {
          this.additionalSubActions.push(new Action(ActionType.push, 1, ActionValueType.fixed, [], true));
        }
      }

      if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1521, 'fh')) {
        if (this.action.type == ActionType.move && !this.additionalSubActions.find((subAction) => subAction.type == ActionType.jump)) {
          this.additionalSubActions.push(new Action(ActionType.jump, "", ActionValueType.fixed, [], true));
        }
      }

      if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1522, 'fh')) {
        if (this.action.type == ActionType.attack && !this.additionalSubActions.find((subAction) => subAction.type == ActionType.target) && !this.additionalSubActions.find((subAction) => subAction.type == ActionType.area)) {
          this.action.value = EntityValueFunction(this.action.value, this.monster.level) - (this.action.valueType == ActionValueType.minus || this.action.valueType == ActionValueType.subtract ? -1 : 1);
          this.additionalSubActions.push(new Action(ActionType.target, 2, ActionValueType.fixed, [], true));
        }
      }
    }

  }

  isGhsSvg(type: ActionType) {
    return ActionTypesIcons.indexOf(type) != -1;
  }

  highlightAction(): boolean {
    return this.interactiveActions.find((interactiveAction) => interactiveAction.index == this.actionIndex) != undefined || false;
  }

  toggleHighlight(event: MouseEvent | TouchEvent) {
    if (this.isInteractiveApplicableAction) {
      if (this.highlightAction()) {
        this.interactiveActions = this.interactiveActions.filter((interactiveAction) => !interactiveAction.index.startsWith(this.actionIndex));
      } else if (this.origAction) {
        this.interactiveActions.push({ action: this.origAction, index: this.actionIndex });
        if (this.origAction.subActions) {
          let interactiveSubActions: InteractiveAction[] = [];
          if (this.monster) {
            interactiveSubActions = gameManager.actionsManager.getAllInteractiveActions(this.monster, this.origAction.subActions, this.actionIndex);
          } else if (this.objective) {
            interactiveSubActions = gameManager.actionsManager.getAllInteractiveActions(this.objective, this.origAction.subActions, this.actionIndex);
          }
          interactiveSubActions.forEach((interactiveSubAction) => {
            if (!this.interactiveActions.some((interactiveAction) => interactiveAction.index == interactiveSubAction.index)) {
              this.interactiveActions.push(interactiveSubAction);
            }
          })
        }
      }
      this.interactiveActionsChange.emit(this.interactiveActions);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  getOrigIndex(action: Action): number {
    if (this.origAction && this.origAction.subActions) {
      const origAction = this.origAction.subActions.find((subAction) => JSON.stringify(action) == JSON.stringify(subAction));
      if (origAction) {
        return this.origAction.subActions.indexOf(origAction);
      }
    }

    return -1;
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    this.interactiveActionsChange.emit(change);
  }
}
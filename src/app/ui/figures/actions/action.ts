import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType, ActionSpecialTarget } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { Element, ElementState } from 'src/app/game/model/data/Element';
import { EntityValueFunction, EntityExpressionRegex, EntityValueRegex } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Objective } from 'src/app/game/model/Objective';
import { valueCalc } from '../../helper/valueCalc';
import { Subscription } from 'rxjs';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/data/AttackModifier';

export const ActionTypesIcons: ActionType[] = [ActionType.attack, ActionType.damage, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport];

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class ActionComponent implements OnInit, OnDestroy {

  @Input() monster: Monster | undefined;
  @Input() monsterType: MonsterType | undefined;
  @Input() objective: Objective | undefined;
  @Input('action') origAction!: Action | undefined;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() highlight: boolean = false;
  @Input() highlightElements: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;
  @Input('index') actionIndex: string = "";

  action!: Action | undefined;
  subActions: Action[] = [];

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
    if (this.origAction) {
      this.action = JSON.parse(JSON.stringify(this.origAction));
    } else {
      this.action = undefined;
    }
    if (this.action && !this.action.subActions) {
      this.action.subActions = [];
    }
    if (this.action && this.action.value === undefined) {
      this.action.value = "";
    }

    if (this.action && this.action.type == ActionType.monsterType) {
      this.monsterType = this.action.value as MonsterType;
    }

    this.updateSubActions();
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
  }

  hasEntities(type: MonsterType | string | undefined = undefined): boolean {
    if (typeof type === 'string') {
      type = type as MonsterType;
    }
    if (type == MonsterType.normal && this.monster && this.monster.boss) {
      return this.hasEntities(MonsterType.boss);
    }

    return this.monster && this.monster.entities.some((monsterEntity) => (!type || monsterEntity.type == type) && gameManager.entityManager.isAlive(monsterEntity)) || false;
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
    if (this.monster && !this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && gameManager.entityManager.isAlive(monsterEntity))) {
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
              statValue = EntityValueFunction(stat.attack, this.level);
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

      if (sign && (this.action.value || this.action.value == 0) && (typeof this.action.value === 'number' || this.action.value.match(EntityExpressionRegex) || this.action.value.match(EntityValueRegex))) {
        if (this.action.valueType == ActionValueType.plus) {
          return statValue + EntityValueFunction(this.action.value);
        } else if (this.action.valueType == ActionValueType.minus) {
          return statValue - EntityValueFunction(this.action.value);
        }
      }
    }

    if (settingsManager.settings.calculateStats && settingsManager.settings.calculateShieldStats && !this.relative && !this.forceRelative) {
      const stat = this.getStat(type);
      let statValue: number = 0;
      if (this.action.type == ActionType.shield || this.action.type == ActionType.retaliate) {
        if (!this.action.subActions || !this.action.subActions.find((shieldSubAction) => shieldSubAction.type == ActionType.specialTarget && !(shieldSubAction.value + '').startsWith('self'))) {
          const statAction = stat.actions && stat.actions.find((statAction) => this.action && statAction.type == this.action.type);
          if (statAction && statAction != this.action) {
            statValue = EntityValueFunction(statAction.value, this.level);
          }
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
    if (settingsManager.settings.fhStyle && [ActionType.element, ActionType.concatenation, ActionType.box].indexOf(this.action.type) == -1) {
      this.elementActions = this.action.subActions.filter((action) => action.type == ActionType.element);
      this.action.subActions = this.action.subActions.filter((action) => action.type != ActionType.element);
    } else {
      this.elementActions = [];
    }

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
                if (!eliteStat || eliteStat.actions && this.subActionExists(eliteStat.actions, newStatAction, false) || (settingsManager.settings.hideStats && this.monster && !this.monster.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == MonsterType.elite))) {
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
              if (!this.hasEntities(MonsterType.normal)) {
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
    if (stackableCondition && subAction.type == ActionType.condition && (new Condition(subAction.value + '').types.indexOf(ConditionType.stack) != -1)) {
      return false;
    }

    return additionalSubActions.some((action) => action.type == subAction.type && action.value == subAction.value && (action.valueType || ActionValueType.fixed) == (subAction.valueType || ActionValueType.fixed));
  }

  isGhsSvg(type: ActionType) {
    return ActionTypesIcons.indexOf(type) != -1;
  }

  highlightAction(): boolean {
    if (this.monster && this.action && ((this.action.type == ActionType.heal || this.action.type == ActionType.condition) && (this.action.subActions && this.action.subActions.length == 1 && this.action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && ('' + subAction.value).startsWith('self'))) || this.action.type == ActionType.sufferDamage || this.action.type == ActionType.switchType)) {
      if (this.action.type == ActionType.heal && this.monster.entities.every((entity) => entity.dead || entity.health < 1 || entity.health == entity.maxHealth)) {
        return false;
      }

      return this.highlightElements && (this.monster.active && this.monster && this.monster.entities.find((entity) => this.action && gameManager.entityManager.isAlive(entity, true) && !entity.tags.find((tag) => this.action && tag == 'roundAction-' + (this.actionIndex ? this.actionIndex + '-' : '') + this.action.type)) != undefined || false);
    }
    return false;
  }

  applyHighlightAction(event: TouchEvent | MouseEvent) {
    if (this.monster && this.highlightAction() && this.action) {
      gameManager.stateManager.before('applyHightlightAction.' + this.action.type, "data.monster." + this.monster.name, '' + this.action.value);
      let after: boolean = true;
      this.monster.entities.filter((entity) => gameManager.entityManager.isAlive(entity, true)).forEach((entity) => {
        if (this.action && !entity.tags.find((tag) => tag == 'roundAction-' + (this.actionIndex ? this.actionIndex + '-' : '') + this.action?.type)) {
          entity.tags.push('roundAction-' + (this.actionIndex ? this.actionIndex + '-' : '') + this.action.type);
          if (this.action.type == ActionType.heal) {
            const heal = EntityValueFunction(this.action.value, this.level);
            entity.health += heal;
            gameManager.entityManager.addCondition(entity, new Condition(ConditionName.heal, heal), this.monster && this.monster.active || false, this.monster && this.monster.off || false);
            gameManager.entityManager.applyCondition(entity, ConditionName.heal, true);
          } else if (this.action.type == ActionType.condition) {
            if (this.action.value == 'bless' || this.action.value == 'curse') {
              const am = settingsManager.settings.allyAttackModifierDeck && (gameManager.fhRules() || settingsManager.settings.alwaysAllyAttackModifierDeck) && (this.monster?.isAlly || this.monster?.isAllied) ? gameManager.game.allyAttackModifierDeck : gameManager.game.monsterAttackModifierDeck;
              gameManager.attackModifierManager.addModifier(am, new AttackModifier(this.action.value == 'bless' ? AttackModifierType.bless : AttackModifierType.curse));
            } else {
              gameManager.entityManager.addCondition(entity, new Condition('' + this.action.value), this.monster?.active || false, this.monster?.off || false);
            }
          } else if (this.action.type == ActionType.sufferDamage) {
            entity.health -= EntityValueFunction(this.action.value, this.level);
            if (entity.health <= 0) {
              entity.health = 0;
              entity.dead = true;
            }
            if (this.monster && entity.dead) {
              after = false;
              setTimeout(() => {
                if (this.monster && entity.dead) {
                  gameManager.monsterManager.removeMonsterEntity(this.monster, entity);
                  if (this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active)) {
                    this.monster.off = true;
                    if (this.monster.active) {
                      gameManager.roundManager.toggleFigure(this.monster);
                    }
                  }
                }
                gameManager.stateManager.after();
              }, settingsManager.settings.disableAnimations ? 0 : 1500);
            }
          }
        }
      })

      if (this.action.type == ActionType.switchType && this.monster) {
        const normalStat = this.monster.stats.find((stat) => this.monster && stat.level == this.monster.level && stat.type == MonsterType.normal);
        const eliteStat = this.monster.stats.find((stat) => this.monster && stat.level == this.monster.level && stat.type == MonsterType.elite);
        if (normalStat && eliteStat) {
          this.monster.entities.forEach((entity) => {
            if (this.monster && gameManager.entityManager.isAlive(entity)) {
              entity.type = entity.type == MonsterType.elite ? MonsterType.normal : MonsterType.elite;
              entity.maxHealth = EntityValueFunction(entity.type == MonsterType.normal ? normalStat.health : eliteStat.health, this.monster.level)
              if (entity.health > entity.maxHealth) {
                entity.health = entity.maxHealth;
              } else if (entity.health < entity.maxHealth && entity.health == EntityValueFunction(entity.type == MonsterType.normal ? eliteStat.health : normalStat.health, this.monster.level)) {
                entity.health = entity.maxHealth;
              }
            }
          });
        }
      }

      if (after) {
        gameManager.stateManager.after();
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

  highlightElement(elementTypes: string[], consume: boolean, index: number): boolean {
    return this.highlightElements && (this.monster && this.monster.active &&

      (!consume && (elementTypes[index] == Element.wild || gameManager.game.elementBoard.some((element) => element.type == elementTypes[index] && element.state != ElementState.new && element.state != ElementState.strong && element.state != ElementState.always)) ||

        consume && gameManager.game.elementBoard.some((element) => (element.type == elementTypes[index] || elementTypes[index] == Element.wild) && (element.state == ElementState.strong || element.state == ElementState.waning || element.state == ElementState.always)))

      && (index == 0 || this.elementActionPerformed(elementTypes[index - 1], consume, index - 1))

      && this.elementActionPerformed(elementTypes[index], consume, index) == undefined || false);
  }

  wildToConsume(): Element[] {
    return gameManager.game.elementBoard.filter((element) => element.state != ElementState.inert && element.state != ElementState.new).map((element) => element.type);
  }

  wildToCreate(): Element[] {
    return gameManager.game.elementBoard.filter((element) => element.state != ElementState.new && element.state != ElementState.strong && element.state != ElementState.always).map((element) => element.type);
  }

  elementAction(event: any, action: Action, element: string, index: number, wild: boolean = false) {
    if (this.monster && this.highlightElement(this.getValues(action), action.valueType == ActionValueType.minus, index)) {
      const entity = this.monster && this.monster.entities.find((entity) => gameManager.entityManager.isAlive(entity) && !entity.tags.some((tag) => tag == 'roundAction-element-' + (action.valueType == ActionValueType.minus ? 'consume-' : '') + (this.actionIndex ? this.actionIndex + '-' : '') + index + element));
      if (action.valueType == ActionValueType.minus) {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element && this.monster) {
            gameManager.stateManager.before("monsterConsumeElement", "data.monster." + this.monster.name, "game.element." + element);
            if (elementModel.state != ElementState.always) {
              elementModel.state = ElementState.consumed;
            }
            if (entity) {
              entity.tags.push('roundAction-element-consume-' + (this.actionIndex ? this.actionIndex + '-' : '') + index + '-' + (wild ? 'wild' : element));
            }
            gameManager.stateManager.after();
          }
        })
      } else {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element && this.monster) {
            gameManager.stateManager.before("monsterInfuseElement", "data.monster." + this.monster.name, "game.element." + element);
            if (elementModel.state != ElementState.always) {
              elementModel.state = ElementState.new;
            }
            if (entity) {
              entity.tags.push('roundAction-element-' + (this.actionIndex ? this.actionIndex + '-' : '') + index + '-' + (wild ? 'wild' : element));
            }
            gameManager.stateManager.after();
          }
        })
      }
      event.preventDefault();
    }
  }

  elementActionPerformed(elementType: string, consume: boolean, index: number): MonsterEntity | undefined {
    return this.monster && this.monster.entities.find((entity) => gameManager.entityManager.isAlive(entity) && entity.tags.some((tag) => tag == 'roundAction-element-' + (consume ? 'consume-' : '') + (this.actionIndex ? this.actionIndex + '-' : '') + index + '-' + elementType));
  }

  elementActionsPerformed(elementTypes: string[], consume: boolean): boolean {
    return this.monster && elementTypes.every((elementType, index) => this.monster && this.monster.entities.find((entity) => gameManager.entityManager.isAlive(entity) && entity.tags.some((tag) => tag == 'roundAction-element-' + (consume ? 'consume-' : '') + (this.actionIndex ? this.actionIndex + '-' : '') + index + '-' + elementType))) || false;
  }

  elementActionsPerformedSome(elementTypes: string[], consume: boolean): boolean {
    return this.monster && elementTypes.some((elementType, index) => this.monster && this.monster.entities.find((entity) => gameManager.entityManager.isAlive(entity) && entity.tags.some((tag) => tag == 'roundAction-element-' + (consume ? 'consume-' : '') + (this.actionIndex ? this.actionIndex + '-' : '') + index + '-' + elementType))) || true;
  }
}
import { Component, Input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/Action';
import { ElementState } from 'src/app/game/model/Element';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: ['./action.scss']
})
export class ActionComponent implements OnInit {

  @Input() monster!: Monster;
  @Input() action!: Action;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
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

  getNormalValue() {
    if (this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue() {
    if (!this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && !monsterEntity.dead)) {
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
    if (this.monster.boss) {
      return this.getStat(MonsterType.boss).special[(action.value as number) - 1];
    } else {
      return [
        new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, this.getStat(MonsterType.normal).special[(action.value as number) - 1]),
        new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, this.getStat(MonsterType.elite).special[(action.value as number) - 1])
      ]
    }
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
    this.updateSubActions();
    gameManager.uiChange.subscribe({
      next: () => {
        this.updateSubActions();
      }
    })
  }

  updateSubActions(): void {
    this.subActions = JSON.parse(JSON.stringify(this.action.subActions || []));

    if (settingsManager.settings.fhStyle && this.action.type != ActionType.element) {
      this.elementActions = this.subActions.filter((action) => action.type == ActionType.element);
      this.subActions = this.subActions.filter((action) => action.type != ActionType.element);
    } else {
      this.elementActions = [];
    }

    this.additionalSubActions = JSON.parse(JSON.stringify(this.subActions));
    if (settingsManager.settings.calculateStats) {
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
      if (this.action.type == ActionType.attack) {
        if (stat.range && (!this.subActions.some((subAction) => subAction.type == ActionType.range || subAction.type == ActionType.area && ("" + subAction.value).indexOf('active') != -1 || subAction.type == ActionType.specialTarget))) {
          const area = this.subActions.find((subAction) => subAction.type == ActionType.area);
          this.additionalSubActions.splice(area ? this.subActions.indexOf(area) + 1 : 0, 0, new Action(ActionType.range, 0, ActionValueType.plus));
        }

        if (stat.actions) {
          let normalActions: Action | undefined = undefined;
          stat.actions.filter((statAction) => this.additionAttackSubActionTypes.indexOf(statAction.type) != -1).forEach((statAction) => {
            const newStatAction = new Action(statAction.type, statAction.value, statAction.valueType, statAction.subActions);
            if (!this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction)) {
              if (statAction.type != ActionType.area || this.subActions.every((subAction) => subAction.type != ActionType.area)) {
                if (!eliteStat || eliteStat.actions && this.subActionExists(eliteStat.actions, newStatAction) || (settingsManager.settings.hideStats && !this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite))) {
                  this.additionalSubActions.push(newStatAction);
                } else if (eliteStat && (!eliteStat.actions || !this.subActionExists(eliteStat.actions, newStatAction))) {
                  if (!normalActions && !this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction)) {
                    normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [newStatAction])
                    this.additionalSubActions.push(normalActions);
                  } else if (normalActions && !this.subActionExists(this.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction) && !this.subActionExists(normalActions.subActions, newStatAction)) {
                    normalActions.subActions.push(newStatAction);
                  }
                }
              }
            }
          })
        }

        if (eliteStat && (!settingsManager.settings.hideStats || this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite))) {
          let eliteActions: Action | undefined = undefined;
          eliteStat.actions.filter((eliteAction) => this.additionAttackSubActionTypes.indexOf(eliteAction.type) != -1).forEach((eliteAction) => {
            const newEliteAction = new Action(eliteAction.type, eliteAction.value, eliteAction.valueType, eliteAction.subActions);
            if (!stat.actions || !this.subActionExists(stat.actions, newEliteAction)) {
              if (!eliteActions && !this.subActionExists(this.subActions, newEliteAction) && !this.subActionExists(this.additionalSubActions, newEliteAction)) {
                eliteActions = new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [newEliteAction]);
                this.additionalSubActions.push(eliteActions);
              } else if (eliteActions && !this.subActionExists(this.subActions, newEliteAction) && !this.subActionExists(this.additionalSubActions, newEliteAction) && !this.subActionExists(eliteActions.subActions, newEliteAction)) {
                eliteActions.subActions.push(newEliteAction);
              }
            }
          })
        }
      }
    }

    this.hasAOE = this.additionalSubActions.some((subAction, index) => index == 0 && subAction.type == ActionType.area);
  }

  subActionExists(additionalSubActions: Action[], subAction: Action): boolean {
    return additionalSubActions.some((action) => action.type == subAction.type && action.value == subAction.value && (action.valueType || ActionValueType.fixed) == (subAction.valueType || ActionValueType.fixed));
  }

  isInvertIcon(type: ActionType) {
    return this.invertIcons.indexOf(type) != -1;
  }

  highlightElement(elementType: string, consume: boolean): boolean {
    return this.highlightElements && this.monster.active && (!consume && gameManager.game.elementBoard.some((element) => element.type == elementType && element.state != ElementState.new && element.state != ElementState.strong) || consume && gameManager.game.elementBoard.some((element) => element.type == elementType && (element.state == ElementState.strong || element.state == ElementState.waning)));
  }

  elementAction(event: any, action: Action, element: string) {
    if (this.highlightElement(element, action.valueType == ActionValueType.minus)) {
      if (action.valueType == ActionValueType.minus) {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element) {
            gameManager.stateManager.before("monsterConsumeElement", "data.monster." + this.monster.name, "game.element." + element);
            elementModel.state = ElementState.inert;
            gameManager.stateManager.after();
          }
        })
      } else {
        gameManager.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type == element) {
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
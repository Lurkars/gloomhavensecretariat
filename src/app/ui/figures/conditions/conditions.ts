import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Condition, ConditionName, EntityCondition, EntityConditionState } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-conditions',
  templateUrl: './conditions.html',
  styleUrls: ['./conditions.scss']
})
export class ConditionsComponent implements OnInit {

  @Input() entity!: Entity;
  @Input() entities!: Entity[];
  @Input() figure!: Figure;
  @Input() type!: string;
  @Input() columns: number = 3;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  standardNegative: Condition[] = [];
  upgradeNegative: Condition[] = [];
  stackNegative: Condition[] = [];
  standardPositive: Condition[] = [];
  upgradePositive: Condition[] = [];
  stackPositive: Condition[] = [];

  monsterType: MonsterType | boolean = false;

  constructor() {
    gameManager.uiChange.subscribe({
      next: () => {
        this.initializeConditions();
      }
    })
  }

  ngOnInit(): void {
    this.initializeConditions();
    if (this.entities) {
      const types = this.entities.map((entity) => entity instanceof MonsterEntity && entity.type).filter((type, index, self) => type && self.indexOf(type) == index);
      if (types.length == 1) {
        this.monsterType = types[0];
      }
    }
  }

  initializeConditions() {
    this.standardNegative = gameManager.conditionsForTypes('standard', 'negative', this.type);
    this.upgradeNegative = gameManager.conditionsForTypes('upgrade', 'negative', this.type);
    this.stackNegative = gameManager.conditionsForTypes('stack', 'negative', this.type);
    this.standardPositive = gameManager.conditionsForTypes('standard', 'positive', this.type);
    this.upgradePositive = gameManager.conditionsForTypes('upgrade', 'positive', this.type);
    this.stackPositive = gameManager.conditionsForTypes('stack', 'positive', this.type);
  }

  hasCondition(condition: Condition): boolean {
    if (this.entity) {
      return gameManager.entityManager.hasCondition(this.entity, condition);
    } else {
      return this.entities.every((entity) => gameManager.entityManager.hasCondition(entity, condition));
    }
  }

  isImmune(conditionName: ConditionName) {

    if (!(this.figure instanceof Monster)) {
      return false;
    }

    if (!(this.entity instanceof MonsterEntity)) {
      return this.entities.every((entity) => this.figure instanceof Monster && entity instanceof MonsterEntity && gameManager.entityManager.isImmune(this.figure, entity, conditionName));
    }

    return gameManager.entityManager.isImmune(this.figure, this.entity, conditionName);
  }

  inc(condition: Condition) {
    condition.value = this.getValue(condition) + 1;
    this.checkUpdate(condition);
  }

  dec(condition: Condition) {
    condition.value = this.getValue(condition) - 1;
    if (condition.value < 1) {
      condition.value = 1;
    }
    this.checkUpdate(condition);
  }

  getValue(condition: Condition): number {
    const entity = this.entity || this.entities[0];
    if (entity) {
      const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
      if (entityCondition) {
        return entityCondition.value;
      }
      return condition.value;
    }
    return 1;
  }

  checkUpdate(condition: Condition) {
    const entity = this.entity || this.entities[0];
    if (entity) {
      const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
      if (entityCondition) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(entity, this.figure, "setConditionValue"), "game.condition." + condition.name, "" + condition.value, this.monsterType ? 'monster.' + this.monsterType + ' ' : '');
        entityCondition.value = condition.value;
        gameManager.stateManager.after();
      }
    }
  }

  toggleCondition(condition: Condition) {
    if (this.entity) {
      this.setCondition(this.entity, this.hasCondition(condition), condition);
    } else {
      this.entities.forEach((entity) => {
        this.setCondition(entity, this.hasCondition(condition), condition);
      })
    }
  }

  setCondition(entity: Entity, remove: boolean, condition: Condition) {
    if (remove) {
      let entityCondition: EntityCondition | undefined = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
      if (entityCondition) {
        entityCondition.expired = true;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.removed;
      }
    } else {
      let entityCondition: EntityCondition | undefined = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
      if (!entityCondition) {
        entityCondition = new EntityCondition(condition.name, condition.value);
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.new;
        entity.entityConditions.push(entityCondition);
      } else {
        entityCondition.expired = false;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.new;
      }
    }
  }
}


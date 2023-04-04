import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Condition, ConditionName, EntityCondition, EntityConditionState } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/data/MonsterType";

@Component({
  selector: 'ghs-conditions',
  templateUrl: './conditions.html',
  styleUrls: ['./conditions.scss']
})
export class ConditionsComponent implements OnInit {

  @Input() entityConditions!: EntityCondition[];
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
    if (this.entityConditions) {
      return this.entityConditions.some((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
    } else if (this.entity) {
      return gameManager.entityManager.hasCondition(this.entity, condition);
    } else {
      return this.entities.every((entity) => gameManager.entityManager.hasCondition(entity, condition));
    }
  }

  isImmune(conditionName: ConditionName) {

    if (this.figure instanceof Character) {
      let immunities: ConditionName[] = [];
      if (this.figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '38')) {
        immunities.push(ConditionName.stun, ConditionName.muddle);
      }
      if (this.figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '52')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (this.figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '103')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (this.figure.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '57')) {
        immunities.push(ConditionName.muddle);
      }
      if (this.figure.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '138')) {
        immunities.push(ConditionName.disarm, ConditionName.stun, ConditionName.muddle);
      }

      return immunities.indexOf(conditionName) != -1;
    }

    if (this.figure instanceof Monster) {
      if (!(this.entity instanceof MonsterEntity)) {
        return this.entities.every((entity) => this.figure instanceof Monster && entity instanceof MonsterEntity && gameManager.entityManager.isImmune(this.figure, entity, conditionName));
      }
      return gameManager.entityManager.isImmune(this.figure, this.entity, conditionName);
    }

    return false;
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
    const entityCondition = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
    if (entityCondition) {
      return entityCondition.value;
    }
    return condition.value;
  }

  checkUpdate(condition: Condition) {
    const entityCondition = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
    if (entityCondition) {
      entityCondition.value = condition.value;
    }
  }

  toggleCondition(condition: Condition) {
    if (this.hasCondition(condition)) {
      let entityCondition: EntityCondition | undefined = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
      if (entityCondition) {
        entityCondition.expired = true;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.removed;
      }
    } else {
      let entityCondition: EntityCondition | undefined = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
      if (!entityCondition) {
        entityCondition = new EntityCondition(condition.name, condition.value);
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.new;
        this.entityConditions.push(entityCondition);
      } else {
        entityCondition.expired = false;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.new;
      }
    }
  }

}

import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Condition, ConditionName, EntityCondition, EntityConditionState } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { Objective } from "src/app/game/model/Objective";
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
  @Output('change') onChange: EventEmitter<EntityCondition[]> = new EventEmitter<EntityCondition[]>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  standardNegative: Condition[] = [];
  upgradeNegative: Condition[] = [];
  stackNegative: Condition[] = [];
  standardPositive: Condition[] = [];
  upgradePositive: Condition[] = [];
  stackPositive: Condition[] = [];
  permanent: Condition[] = [];

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

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT' && window.document.activeElement.tagName != 'TEXTAREA')) {
        if (!event.ctrlKey && !event.shiftKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].indexOf(event.key) != -1) {
          if (!(this.entity instanceof Objective) || this.entity.escort) {
            let index = +event.key;
            let condition: Condition | undefined;
            if (index == 0) {
              index = 9;
            } else {
              index--;
            }
            if (index < this.standardNegative.length) {
              condition = this.standardNegative[index];
            } else if (index < this.standardNegative.length + this.standardPositive.length) {
              condition = this.standardPositive[index - this.standardNegative.length];

            }
            if (condition && !this.isImmune(condition.name)) {
              this.toggleCondition(condition);
            }
          }
          event.preventDefault();
        }
      }
    })
  }

  initializeConditions() {
    this.standardNegative = gameManager.conditionsForTypes('standard', 'negative', this.type);
    this.upgradeNegative = gameManager.conditionsForTypes('upgrade', 'negative', this.type);
    this.stackNegative = gameManager.conditionsForTypes('stack', 'negative', this.type);
    this.standardPositive = gameManager.conditionsForTypes('standard', 'positive', this.type);
    this.upgradePositive = gameManager.conditionsForTypes('upgrade', 'positive', this.type);
    this.initializePermanentConditions();
  }

  initializePermanentConditions() {
    this.permanent = [];
    this.entityConditions.forEach((entityCondition) => {
      if (this.isPermanent(entityCondition.name) && this.hasCondition(entityCondition)) {
        if (!this.permanent.find((condition) => condition.name == entityCondition.name)) {
          this.permanent.push(new Condition(entityCondition.name));
        }
      }
    })
    if (this.entity instanceof Character) {
      this.entity.stats.forEach((stat) => {
        if (stat.level <= this.entity.level && stat.permanentConditions) {
          stat.permanentConditions.forEach((conditionName) => {
            if (!this.permanent.find((condition) => condition.name == conditionName)) {
              this.permanent.push(new Condition(conditionName));
            }
          })
        }
      })
    }
  }

  hasCondition(condition: Condition): boolean {
    if (this.entityConditions) {
      return this.entityConditions.some((entityCondition) => entityCondition.name == condition.name && entityCondition.state != EntityConditionState.removed && !entityCondition.expired);
    } else if (this.entity) {
      return gameManager.entityManager.hasCondition(this.entity, condition);
    } else {
      return this.entities.every((entity) => gameManager.entityManager.hasCondition(entity, condition));
    }
  }

  isImmune(conditionName: ConditionName): boolean {

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

  isPermanent(conditionName: ConditionName): boolean {
    if (this.entityConditions) {
      return this.entityConditions.some((entityCondition) => entityCondition.name == conditionName && entityCondition.permanent && !entityCondition.expired);
    }

    return false;
  }

  inc(condition: Condition) {
    condition.value = this.getValue(condition) + 1;
    this.checkUpdate(condition);

    this.onChange.emit(this.entityConditions);
  }

  dec(condition: Condition) {
    condition.value = this.getValue(condition) - 1;
    if (condition.value < 1) {
      condition.value = 1;
    }
    this.checkUpdate(condition);

    this.onChange.emit(this.entityConditions);
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

  toggleCondition(condition: Condition, permanent: boolean = false) {
    if (this.hasCondition(condition) && (!permanent || this.isPermanent(condition.name))) {
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
      entityCondition.permanent = permanent;
    }

    if (permanent) {
      this.initializePermanentConditions();
    }

    this.onChange.emit(this.entityConditions);
  }

}

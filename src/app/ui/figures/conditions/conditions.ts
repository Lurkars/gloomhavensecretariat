import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Condition, ConditionName, EntityCondition, EntityConditionState } from "src/app/game/model/data/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { Objective } from "src/app/game/model/Objective";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";

@Component({
  selector: 'ghs-conditions',
  templateUrl: './conditions.html',
  styleUrls: ['./conditions.scss']
})
export class ConditionsComponent implements OnInit {

  @Input() entityConditions!: EntityCondition[];
  @Input() immunities!: ConditionName[];
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

  monsterType: MonsterType | boolean = false;

  permanentEnabled: boolean = false;
  immunityEnabled: boolean = false;

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
          if ((!(this.entity instanceof Objective) || this.entity.escort) && (!(this.figure instanceof ObjectiveContainer) || this.figure.escort)) {
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
  }

  hasCondition(condition: Condition, permanent: boolean = false, immunity: boolean = false): boolean {
    if (this.entityConditions) {
      return this.entityConditions.some((entityCondition) => entityCondition.name == condition.name && entityCondition.state != EntityConditionState.removed && !entityCondition.expired && (!this.permanentEnabled || (permanent || this.permanentEnabled) && entityCondition.permanent));
    } else if (this.entity) {
      return gameManager.entityManager.hasCondition(this.entity, condition, permanent || this.permanentEnabled);
    } else {
      return this.entities.every((entity) => gameManager.entityManager.hasCondition(entity, condition, permanent || this.permanentEnabled));
    }
  }

  isImmune(conditionName: ConditionName): boolean {
    if (this.immunities) {
      return this.immunities.indexOf(conditionName) != -1;
    } else if (this.figure instanceof Monster) {
      if (!(this.entity instanceof MonsterEntity)) {
        return this.entities.every((entity) => this.figure instanceof Monster && entity instanceof MonsterEntity && gameManager.entityManager.isImmune(entity, this.figure, conditionName));
      } else {
        return gameManager.entityManager.isImmune(this.entity, this.figure, conditionName);
      }
    } else if (this.figure instanceof Character && this.entity instanceof Character) {
      return gameManager.entityManager.isImmune(this.entity, this.figure, conditionName);
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
    if (this.immunityEnabled && !permanent) {
      if (this.immunities.indexOf(condition.name) == -1) {
        this.immunities.push(condition.name);
      } else {
        this.immunities.splice(this.immunities.indexOf(condition.name), 1);
      }
    } else {
      if (this.hasCondition(condition, permanent || this.permanentEnabled)) {
        let entityCondition: EntityCondition | undefined = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name && (!permanent || entityCondition.permanent));
        if (entityCondition) {
          entityCondition.expired = true;
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.removed;
        }
      } else {
        let entityCondition: EntityCondition | undefined = this.entityConditions.find((entityCondition) => entityCondition.name == condition.name && (!permanent || entityCondition.permanent));

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
        entityCondition.permanent = permanent || this.permanentEnabled;
      }

      this.onChange.emit(this.entityConditions);
    }
  }

}

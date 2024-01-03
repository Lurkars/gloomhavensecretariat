import { Component, EventEmitter, HostListener, Input, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "src/app/game/model/data/Condition";
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
  ConditionType = ConditionType;

  conditions: Condition[] = [];
  conditionSeparator: number = 0;

  monsterType: MonsterType | boolean = false;

  permanentEnabled: boolean = false;
  immunityEnabled: boolean = false;
  timeout: any;
  numberStore: number = 0;

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

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const keyNumber = +event.key;
      if (this.timeout) {
        clearTimeout(this.timeout);
        const combined: number = this.numberStore * 10 + keyNumber;
        this.numberStore = combined;
        this.selectCondition();
      } else if (keyNumber * 10 < this.conditions.length + 2) {
        this.numberStore = keyNumber;
        this.timeout = setTimeout(() => {
          this.selectCondition();
        }, 1000);
      } else {
        this.numberStore = keyNumber;
        this.selectCondition();
      }

      event.preventDefault();
      event.stopPropagation();
    }
  }

  selectCondition() {
    const index = this.numberStore;
    if ((!(this.entity instanceof Objective) || this.entity.escort) && (!(this.figure instanceof ObjectiveContainer) || this.figure.escort)) {
      let condition: Condition | undefined;
      if (index <= this.conditions.length) {
        condition = this.conditions[index - 1];
      } else if (index == this.conditions.length + 1) {
        this.permanentEnabled = !this.permanentEnabled;
        this.immunityEnabled = false;
      } else if (index == this.conditions.length + 2) {
        this.immunityEnabled = !this.immunityEnabled;
        this.permanentEnabled = false;
      }
      if (condition && (!this.isImmune(condition.name) || this.immunityEnabled && !gameManager.entityManager.isImmune(this.entity, this.figure, condition.name, true))) {
        this.toggleCondition(condition);
      }
    }
    this.timeout = undefined;
    this.numberStore = -1;
  }

  initializeConditions() {
    this.conditions = [];
    this.conditions.push(...gameManager.conditionsForTypes('standard', 'negative', this.type));
    this.conditions.push(...gameManager.conditionsForTypes('upgrade', 'negative', this.type));
    this.conditions.push(...gameManager.conditionsForTypes('stack', 'negative', this.type));
    this.conditionSeparator = this.conditions.length - 1;
    this.conditions.push(...gameManager.conditionsForTypes('standard', 'positive', this.type));
    this.conditions.push(...gameManager.conditionsForTypes('upgrade', 'positive', this.type));
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

  isImmune(conditionName: ConditionName, ignoreManual: boolean = false): boolean {
    let immune: boolean = false;

    if (this.immunities && !ignoreManual) {
      immune = this.immunities.indexOf(conditionName) != -1;
    }

    if (!immune && this.figure instanceof Monster) {
      if (!(this.entity instanceof MonsterEntity)) {
        immune = this.entities.every((entity) => this.figure instanceof Monster && entity instanceof MonsterEntity && gameManager.entityManager.isImmune(entity, this.figure, conditionName, true));
      } else {
        immune = gameManager.entityManager.isImmune(this.entity, this.figure, conditionName, true);
      }
    }

    if (!immune && this.figure instanceof Character && this.entity instanceof Character) {
      immune = gameManager.entityManager.isImmune(this.entity, this.figure, conditionName, true);
    }

    return immune;
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

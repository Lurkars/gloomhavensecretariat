import { NumberSymbol } from "@angular/common";
import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { FigureError } from "./FigureError";
import { Monster } from "./Monster";
import { MonsterStat } from "./MonsterStat";
import { MonsterType } from "./MonsterType";
import { SummonState } from "./Summon";

export class MonsterEntity implements Entity {
  number: number;
  type: MonsterType;
  stat: MonsterStat;
  dead: boolean = false;
  summon: SummonState = SummonState.false;

  // from entity
  level: number;
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];

  constructor(number: number, type: MonsterType, monster: Monster) {
    this.number = number;
    this.type = type;

    const stat = monster.stats.find((element) => {
      return element.level == monster.level && element.type == type;
    });

    if (!stat) {
      console.error("No monster stat found for level '" + monster.level + "' and type '" + type + "'!");
      this.stat = new MonsterStat(type, monster.level, 0, 0, 0, 0);
      if (monster.errors.indexOf(FigureError.stat) == -1) {
        monster.errors.push(FigureError.stat);
      }
    } else {
      this.stat = stat;
    }

    if (typeof this.stat.health === "number") {
      this.maxHealth = this.stat.health;
    } else {
      this.maxHealth = EntityValueFunction(this.stat.health, monster.level);
    }
    this.health = this.maxHealth;
    this.level = monster.level;
  }

  toModel(): GameMonsterEntityModel {
    return new GameMonsterEntityModel(this.number, this.type, this.dead, this.summon, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers);
  }

  fromModel(model: GameMonsterEntityModel) {
    this.dead = model.dead;
    this.summon = model.summon;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.entityConditions = [];
    if (model.entityConditions) {
      this.entityConditions = model.entityConditions.map((gecm) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }
    this.markers = model.markers;
  }


}

export class GameMonsterEntityModel {
  number: number;
  type: MonsterType;
  dead: boolean;
  summon: SummonState;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  markers: string[];

  constructor(number: number,
    type: MonsterType,
    dead: boolean,
    summon: SummonState,
    health: NumberSymbol,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[]) {
    this.number = number;
    this.type = type;
    this.dead = dead;
    this.summon = summon;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = entityConditions;
    this.markers = markers;
  }
}
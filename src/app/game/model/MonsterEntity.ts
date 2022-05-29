import { NumberSymbol } from "@angular/common";
import { Condition } from "./Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { Monster } from "./Monster";
import { MonsterStat } from "./MonsterStat";
import { MonsterType } from "./MonsterType";

export class MonsterEntity implements Entity {
  number: number;
  type: MonsterType;
  stat: MonsterStat;
  dead: boolean = false;

  // from entity
  level: number;
  health: number;
  maxHealth: number;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];

  constructor(number: number, type: MonsterType, monster: Monster) {
    this.number = number;
    this.type = type;

    if (!monster.stats.some((element: MonsterStat) => {
      return element.level == monster.level && element.type == type;
    })) {
      throw Error("Could not create monster entity.")
    }

    this.stat = monster.stats.filter((element: MonsterStat) => {
      return element.level == monster.level && element.type == type;
    })[ 0 ];

    if (typeof this.stat.health === "number") {
      this.maxHealth = this.stat.health;
    } else {
      this.maxHealth = EntityValueFunction(this.stat.health);
    }
    this.health = this.maxHealth;
    this.level = monster.level;
  }

  toModel(): GameMonsterEntityModel {
    return new GameMonsterEntityModel(this.number, this.type, this.health, this.maxHealth, this.conditions, this.turnConditions);
  }

  fromModel(model: GameMonsterEntityModel) {
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.conditions = model.conditions;
    this.turnConditions = model.turnConditions;
  }


}

export class GameMonsterEntityModel {
  number: number;
  type: MonsterType;
  health: number;
  maxHealth: number;
  conditions: Condition[];
  turnConditions: Condition[];


  constructor(number: number,
    type: MonsterType,
    health: NumberSymbol,
    maxHealth: number,
    conditions: Condition[],
    turnConditions: Condition[]) {
    this.number = number;
    this.type = type;
    this.health = health;
    this.maxHealth = maxHealth;
    this.conditions = conditions;
    this.turnConditions = turnConditions;
  }
}
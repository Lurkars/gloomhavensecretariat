import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { FigureError, FigureErrorType } from "./data/FigureError";
import { Monster } from "./Monster";
import { MonsterStat, MonsterStatEffect } from "./data/MonsterStat";
import { MonsterType } from "./data/MonsterType";
import { SummonState } from "./Summon";

export class MonsterEntity implements Entity {
  number: number;
  marker: string = "";
  type: MonsterType;
  stat: MonsterStat;
  dead: boolean = false;
  summon: SummonState = SummonState.false;
  effect: MonsterStatEffect | undefined;

  // from entity
  active: boolean = false;
  off: boolean = false;
  level: number;
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];
  tags: string[] = [];

  constructor(number: number, type: MonsterType, monster: Monster) {
    this.number = number;
    this.type = type;

    const stat = monster.stats.find((stat) => {
      return stat.level == monster.level && stat.type == type;
    });

    if (!stat) {
      this.stat = new MonsterStat(type, monster.level, 0, 0, 0, 0);
      monster.errors = monster.errors || [];
      if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + monster.name + " level: " + monster.level);
        monster.errors.push(new FigureError(FigureErrorType.stat, "monster", monster.name, monster.edition, type, "" + monster.level));
      }
    } else {
      this.stat = stat;
    }

    this.maxHealth = EntityValueFunction(this.stat.health, monster.level);
    this.health = this.maxHealth;
    if (this.health == 0) {
      this.health = 1;
    }
    this.level = monster.level;
  }

  toModel(): GameMonsterEntityModel {
    return new GameMonsterEntityModel(this.number, this.marker, this.type, this.dead, this.summon, this.active, this.off, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.tags || []);
  }

  fromModel(model: GameMonsterEntityModel) {
    this.marker = model.marker;
    this.dead = model.dead;
    this.summon = model.summon;
    this.active = model.active;
    this.off = model.off;
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
    this.markers = model.markers || [];
    this.tags = model.tags || [];
  }


}

export class GameMonsterEntityModel {
  number: number;
  marker: string;
  type: MonsterType;
  dead: boolean;
  summon: SummonState;
  active: boolean;
  off: boolean;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  tags: string[];

  constructor(number: number,
    marker: string,
    type: MonsterType,
    dead: boolean,
    summon: SummonState,
    active: boolean,
    off: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[],
    tags: string[]) {
    this.number = number;
    this.marker = marker;
    this.type = type;
    this.dead = dead;
    this.summon = summon;
    this.active = active;
    this.off = off;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
  }
}
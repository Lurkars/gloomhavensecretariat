import { gameManager } from "../businesslogic/GameManager";
import { Entity, EntityValueFunction } from "./Entity";
import { Monster } from "./Monster";
import { SummonState } from "./Summon";
import { Action } from "./data/Action";
import { ConditionName, EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { FigureError, FigureErrorType } from "./data/FigureError";
import { MonsterStat } from "./data/MonsterStat";
import { MonsterType } from "./data/MonsterType";

export class MonsterEntity implements Entity {
  number: number;
  marker: string = "";
  type: MonsterType;
  stat: MonsterStat;
  dead: boolean = false;
  summon: SummonState = SummonState.false;
  dormant: boolean = false;
  revealed: boolean = false;

  // from entity
  active: boolean = false;
  off: boolean = false;
  level: number;
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  immunities: ConditionName[] = [];
  markers: string[] = [];
  tags: string[] = [];
  shield: Action | undefined;
  shieldPersistent: Action | undefined;
  retaliate: Action[] = [];
  retaliatePersistent: Action[] = [];

  constructor(number: number, type: MonsterType, monster: Monster) {
    this.number = number;
    this.type = type;

    const stat = gameManager.monsterManager.getStat(monster, type);

    if (!stat) {
      this.stat = new MonsterStat(type, monster.level);
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
    return new GameMonsterEntityModel(this.number, this.marker, this.type, this.dead, this.summon, this.active, this.off, this.revealed, this.dormant, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.immunities, this.markers, this.tags || [], this.shield, this.shieldPersistent, this.retaliate, this.retaliatePersistent);
  }

  fromModel(model: GameMonsterEntityModel) {
    this.marker = model.marker;
    this.dead = model.dead;
    this.summon = model.summon;
    this.active = model.active;
    this.off = model.off;
    this.revealed = model.revealed;
    this.dormant = model.dormant;
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
    this.immunities = model.immunities || [];
    this.markers = model.markers || [];
    this.tags = model.tags || [];

    this.shield = model.shield ? JSON.parse(model.shield) : undefined;
    this.shieldPersistent = model.shieldPersistent ? JSON.parse(model.shieldPersistent) : undefined;
    this.retaliate = (model.retaliate || []).map((value) => JSON.parse(value));
    this.retaliatePersistent = (model.retaliatePersistent || []).map((value) => JSON.parse(value));
  }


}

export class GameMonsterEntityModel {
  number: number;
  marker: string;
  type: MonsterType;
  dead: boolean;
  summon: SummonState;
  revealed: boolean;
  dormant: boolean;
  active: boolean;
  off: boolean;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  immunities: ConditionName[];
  markers: string[];
  tags: string[];
  shield: string;
  shieldPersistent: string;
  retaliate: string[];
  retaliatePersistent: string[];

  constructor(number: number,
    marker: string,
    type: MonsterType,
    dead: boolean,
    summon: SummonState,
    active: boolean,
    off: boolean,
    revealed: boolean,
    dormant: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    immunities: ConditionName[],
    markers: string[],
    tags: string[],
    shield: Action | undefined,
    shieldPersistent: Action | undefined,
    retaliate: Action[],
    retaliatePersistent: Action[]) {
    this.number = number;
    this.marker = marker;
    this.type = type;
    this.dead = dead;
    this.summon = summon;
    this.active = active;
    this.off = off;
    this.revealed = revealed;
    this.dormant = dormant;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.immunities = JSON.parse(JSON.stringify(immunities));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.shield = shield ? JSON.stringify(shield) : "";
    this.shieldPersistent = shieldPersistent ? JSON.stringify(shieldPersistent) : "";
    this.retaliate = retaliate.map((action) => JSON.stringify(action));
    this.retaliatePersistent = retaliatePersistent.map((action) => JSON.stringify(action));
  }
}
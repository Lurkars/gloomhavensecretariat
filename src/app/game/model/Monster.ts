import { GameMonsterEntityModel, MonsterEntity } from "./MonsterEntity";
import { Ability } from "./Ability";
import { Figure } from "./Figure";
import { MonsterData } from "./data/MonsterData";
import { gameManager } from "../businesslogic/GameManager";
import { SummonColor } from "./Summon";
import { MonsterStat } from "./MonsterStat";
import { MonsterManager } from "../businesslogic/MonsterManager";

export class Monster extends MonsterData implements Figure {

  summonColor: SummonColor = SummonColor.blue;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  getInitiative(): number {
    const ability: Ability | undefined = gameManager.monsterManager.getAbility(this);
    return ability && ability.initiative || 0;
  }

  // Monster
  ability: number = -1;
  abilities: number[] = [];
  entities: MonsterEntity[] = [];

  constructor(monsterData: MonsterData) {
    super(monsterData.name, monsterData.count, monsterData.baseStat, monsterData.stats, monsterData.edition, monsterData.deck, monsterData.boss, monsterData.thumbnail, monsterData.spoiler);
    this.abilities = gameManager.abilities(this.deck, this.edition).map((ability: Ability, index: number) => index);
    this.level = 0;
    if (monsterData.baseStat) {
      for (let stat of monsterData.stats) {
        if (!stat.health) {
          stat.health = monsterData.baseStat.health;
        }
        if (!stat.movement) {
          stat.movement = monsterData.baseStat.movement;
        }
        if (!stat.attack) {
          stat.attack = monsterData.baseStat.attack;
        }
        if (!stat.range) {
          stat.range = monsterData.baseStat.range;
        }
        if (!stat.actions) {
          stat.actions = monsterData.baseStat.actions;
        }
        if (!stat.immunities) {
          stat.immunities = monsterData.baseStat.immunities;
        }
        if (!stat.special) {
          stat.special = monsterData.baseStat.special;
        }
        if (!stat.note) {
          stat.note = monsterData.baseStat.note;
        }
        if (!stat.type) {
          stat.type = monsterData.baseStat.type;
        }
      }
    }
  }

  toModel(): GameMonsterModel {
    return new GameMonsterModel(this.name, this.level, this.off, this.active, this.ability, this.abilities, this.entities.map((value: MonsterEntity) => value.toModel()))
  }


  fromModel(model: GameMonsterModel) {
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.abilities = model.abilities || gameManager.abilities(this.deck, this.edition).map((ability: Ability, index: number) => index);
    this.ability = model.ability;
    this.entities = model.entities.map((value: GameMonsterEntityModel) => {
      const entity = new MonsterEntity(value.number, value.type, this);
      entity.fromModel(value);
      return entity;
    })
  }
}

export class GameMonsterModel {
  name: String;
  level: number;
  off: boolean;
  active: boolean;
  ability: number;
  abilities: number[];
  entities: GameMonsterEntityModel[];

  constructor(name: String,
    level: number,
    off: boolean,
    active: boolean,
    ability: number,
    abilities: number[],
    entities: GameMonsterEntityModel[]) {
    this.name = name;
    this.level = level;
    this.off = off;
    this.active = active;
    this.ability = ability;
    this.abilities = abilities;
    this.entities = entities;
  }
}
import { GameMonsterEntityModel, MonsterEntity } from "./MonsterEntity";
import { Ability } from "./Ability";
import { Figure } from "./Figure";
import { MonsterData } from "./data/MonsterData";
import { gameManager } from "../businesslogic/GameManager";
import { SummonColor } from "./Summon";

export class Monster extends MonsterData implements Figure {

  summonColor: SummonColor = SummonColor.blue;

  // from figure
  level: number = 1;
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
          stat.actions = Object.assign([], monsterData.baseStat.actions);
        }
        if (!stat.immunities) {
          stat.immunities = Object.assign([], monsterData.baseStat.immunities);
        }
        if (!stat.special) {
          stat.special = [];
          for (let special of monsterData.baseStat.special) {
            stat.special.push(Object.assign([], special));
          }
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
    this.entities = this.entities.filter((monsterEntity: MonsterEntity) => model.entities.map((gmem: GameMonsterEntityModel) => gmem.number).indexOf(monsterEntity.number) != -1);
    model.entities.forEach((value: GameMonsterEntityModel) => {
      let entity = new MonsterEntity(value.number, value.type, this);

      if (this.entities.some((monsterEntity: MonsterEntity) => monsterEntity.number == value.number)) {
        entity = this.entities.filter((monsterEntity: MonsterEntity) => monsterEntity.number == value.number)[ 0 ];
      } else {
        this.entities.push(entity);
      }
      entity.fromModel(value);
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
import { MonsterStat } from "./MonsterStat";
import { GameMonsterEntityModel, MonsterEntity } from "./MonsterEntity";
import { MonsterAbility } from "./MonsterAbility";
import { Figure } from "./Figure";
import { Editional } from "./Editional";
import { MonsterData } from "./data/MonsterData";

export class Monster extends MonsterData implements Figure {

  // from figure
  level: number;
  off: boolean = false;

  getInitiative(): number {
    return this.ability && this.ability.initiative || 0;
  }

  // Monster
  ability: MonsterAbility | undefined = undefined;
  availableAbilities: number[] = [];
  discardedAbilities: number[] = [];
  entities: MonsterEntity[] = [];

  constructor(monsterData: MonsterData) {
    super(monsterData.name, monsterData.count, monsterData.abilities, monsterData.stats, monsterData.edition, monsterData.boss);
    this.availableAbilities = this.abilities.map((ability: MonsterAbility, index: number) => index);
    this.level = 0;
  }

  toModel(): GameMonsterModel {
    return new GameMonsterModel(this.name, this.level, this.off, this.ability ? this.abilities.indexOf(this.ability) : -1, this.availableAbilities, this.discardedAbilities, this.entities.map((value: MonsterEntity) => value.toModel()))
  }


  fromModel(model: GameMonsterModel) {
    this.level = model.level;
    this.off = model.off;
    this.availableAbilities = model.availableAbilities;
    this.discardedAbilities = model.discardedAbilities;
    this.ability = model.ability == -1 ? undefined : this.abilities[ model.ability ];
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
  ability: number;
  availableAbilities: number[];
  discardedAbilities: number[];
  entities: GameMonsterEntityModel[];

  constructor(name: String,
    level: number,
    off: boolean,
    ability: number,
    availableAbilities: number[],
    discardedAbilities: number[],
    entities: GameMonsterEntityModel[]) {
    this.name = name;
    this.level = level;
    this.off = off;
    this.ability = ability;
    this.availableAbilities = availableAbilities;
    this.discardedAbilities = discardedAbilities;
    this.entities = entities;
  }
}
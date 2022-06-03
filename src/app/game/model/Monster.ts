import { GameMonsterEntityModel, MonsterEntity } from "./MonsterEntity";
import { Ability } from "./Ability";
import { Figure } from "./Figure";
import { MonsterData } from "./data/MonsterData";
import { gameManager } from "../businesslogic/GameManager";
import { SummonColor } from "./Summon";

export class Monster extends MonsterData implements Figure {

  summonColor: SummonColor = SummonColor.blue;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  getInitiative(): number {
    return this.ability && this.ability.initiative || 0;
  }

  // Monster
  ability: Ability | undefined = undefined;
  availableAbilities: number[] = [];
  discardedAbilities: number[] = [];
  entities: MonsterEntity[] = [];

  constructor(monsterData: MonsterData) {
    super(monsterData.name, monsterData.count, monsterData.stats, monsterData.edition, monsterData.deck, monsterData.boss);
    this.availableAbilities = gameManager.abilities(this.deck, this.edition).map((ability: Ability, index: number) => index);
    this.level = 0;
  }

  toModel(): GameMonsterModel {
    return new GameMonsterModel(this.name, this.level, this.off, this.active, this.ability ? gameManager.abilities(this.deck, this.edition).indexOf(this.ability) : -1, this.availableAbilities, this.discardedAbilities, this.entities.map((value: MonsterEntity) => value.toModel()))
  }


  fromModel(model: GameMonsterModel) {
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.availableAbilities = model.availableAbilities;
    this.discardedAbilities = model.discardedAbilities;
    this.ability = model.ability == -1 ? undefined : gameManager.abilities(this.deck, this.edition)[ model.ability ];
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
  availableAbilities: number[];
  discardedAbilities: number[];
  entities: GameMonsterEntityModel[];

  constructor(name: String,
    level: number,
    off: boolean,
    active: boolean,
    ability: number,
    availableAbilities: number[],
    discardedAbilities: number[],
    entities: GameMonsterEntityModel[]) {
    this.name = name;
    this.level = level;
    this.off = off;
    this.active = active;
    this.ability = ability;
    this.availableAbilities = availableAbilities;
    this.discardedAbilities = discardedAbilities;
    this.entities = entities;
  }
}
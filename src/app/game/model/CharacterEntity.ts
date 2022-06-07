import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { Condition } from "./Condition";
import { CharacterStat } from "./CharacterStat";
import { CharacterData } from "./data/CharacterData";
import { GameSummonModel, Summon } from "./Summon";

export class CharacterEntity extends CharacterData implements Entity, Figure {
  title: string = "";
  initiative: number = 0;
  experience: number = 0;
  loot: number = 0;
  exhausted: boolean = false;
  stat: CharacterStat;
  summons: Summon[] = [];

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number;
  maxHealth: number;
  conditions: Condition[];
  turnConditions: Condition[];

  getInitiative(): number {
    return this.initiative;
  }

  constructor(character: CharacterData, level: number) {
    super(character.name, character.stats, character.edition);

    if (!this.stats.some((characterStat: CharacterStat) => characterStat.level == level)) {
      throw Error("Invalid character level: " + level);
    }

    this.stat = this.stats.filter((characterStat: CharacterStat) => characterStat.level == level)[ 0 ];

    this.level = level;
    this.maxHealth = this.stat.health;
    this.health = this.maxHealth;
    this.conditions = [];
    this.turnConditions = [];
  }

  setLevel(level: number) {
    if (!this.stats.some((characterStat: CharacterStat) => characterStat.level == level)) {
      throw Error("Invalid character level: " + level);
    }

    this.stat = this.stats.filter((characterStat: CharacterStat) => characterStat.level == level)[ 0 ];
    this.level = level;

    if (this.health == this.maxHealth) {
      this.health = this.stat.health;
    }

    this.maxHealth = this.stat.health;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  toModel(): GameCharacterEntityModel {
    return new GameCharacterEntityModel(this.name, this.title, this.initiative, this.experience, this.loot, this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.conditions, this.turnConditions, this.summons.map((summon: Summon) => summon.toModel()));
  }

  fromModel(model: GameCharacterEntityModel) {
    this.title = model.title;
    this.initiative = model.initiative;
    this.experience = model.experience;
    this.loot = model.loot;
    this.exhausted = model.exhausted;
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.conditions = model.conditions;
    this.turnConditions = model.turnConditions;
    this.summons = model.summons.map((value: GameSummonModel) => {
      const entity = new Summon(value.level, value.number, value.color);
      entity.fromModel(value);
      return entity;
    })
  }

}


export class GameCharacterEntityModel {

  name: string;
  title: string;
  initiative: number;
  experience: number;
  loot: number;
  exhausted: boolean;
  level: number;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number;
  conditions: Condition[];
  turnConditions: Condition[];
  summons: GameSummonModel[];


  constructor(name: string,
    title: string,
    initiative: number,
    experience: number,
    loot: number,
    exhausted: boolean,
    level: number,
    off: boolean,
    active: boolean,
    health: number,
    maxHealth: number,
    conditions: Condition[],
    turnConditions: Condition[],
    summons: GameSummonModel[]) {
    this.name = name;
    this.title = title;
    this.initiative = initiative;
    this.experience = experience;
    this.loot = loot;
    this.exhausted = exhausted;
    this.level = level;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.conditions = conditions;
    this.turnConditions = turnConditions;
    this.summons = summons;
  }

}
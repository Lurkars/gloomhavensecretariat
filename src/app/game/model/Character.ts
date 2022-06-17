import { Figure } from "./Figure";
import { Entity, EntityValueFunction } from "./Entity";
import { Condition } from "./Condition";
import { CharacterStat } from "./CharacterStat";
import { CharacterData } from "./data/CharacterData";
import { GameSummonModel, Summon, SummonColor, SummonState } from "./Summon";
import { gameManager } from "../businesslogic/GameManager";

export class Character extends CharacterData implements Entity, Figure {
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
    super(character.name, character.stats, character.edition, character.summon, character.icon, character.thumbnail);

    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }

    if (!this.stats.some((characterStat: CharacterStat) => characterStat.level == level)) {
      throw Error("Invalid character level: " + level);
    }

    this.stat = this.stats.filter((characterStat: CharacterStat) => characterStat.level == level)[ 0 ];

    this.level = level;
    this.maxHealth = this.stat.health;
    this.health = this.maxHealth;
    this.conditions = [];
    this.turnConditions = [];

    if (this.summon && this.summon.automatic && (!this.summon.level || this.summon.level <= this.level)) {
      this.createSummon();
    }
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

    if (this.summon) {
      if (this.summons.some((summon: Summon) => summon.number == 0)) {
        let summon = this.summons.filter((summon: Summon) => summon.number == 0)[ 0 ];
        if (summon.health == summon.maxHealth) {
          summon.health = typeof this.summon.health == "number" ? this.summon.health : EntityValueFunction(this.summon.health, this.level);
        }
        summon.maxHealth = typeof this.summon.health == "number" ? this.summon.health : EntityValueFunction(this.summon.health, this.level);
        summon.attack = typeof this.summon.attack == "number" ? this.summon.attack : EntityValueFunction(this.summon.attack, this.level);
        summon.movement = typeof this.summon.movement == "number" ? this.summon.movement : EntityValueFunction(this.summon.movement, this.level);
        summon.range = typeof this.summon.range == "number" ? this.summon.range : EntityValueFunction(this.summon.range, this.level);
      } else if (this.summon.automatic && this.summon.level && this.summon.level <= this.level) {
        this.createSummon();
      }
    }
  }

  createSummon() {
    if (this.summon) {
      let summon: Summon = new Summon(this.level, 0, SummonColor.custom);
      summon.maxHealth = typeof this.summon.health == "number" ? this.summon.health : EntityValueFunction(this.summon.health, this.level);
      summon.attack = typeof this.summon.attack == "number" ? this.summon.attack : EntityValueFunction(this.summon.attack, this.level);
      summon.movement = typeof this.summon.movement == "number" ? this.summon.movement : EntityValueFunction(this.summon.movement, this.level);
      summon.range = typeof this.summon.range == "number" ? this.summon.range : EntityValueFunction(this.summon.range, this.level);
      summon.health = summon.maxHealth;
      summon.state = SummonState.true;
      summon.init = false;
      gameManager.characterManager.addSummon(this, summon);
      // TODO: FIX
    }
  }

  toModel(): GameCharacterModel {
    return new GameCharacterModel(this.name, this.title, this.initiative, this.experience, this.loot, this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.conditions, this.turnConditions, this.summons.map((summon: Summon) => summon.toModel()));
  }

  fromModel(model: GameCharacterModel) {
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

    this.summons = this.summons.filter((summon: Summon) => {
      let found: boolean = false;
      model.summons.forEach((gsm: GameSummonModel) => {
        if (gsm.number == summon.number && gsm.color == summon.color) {
          found = true;
          return;
        }
      })
      return found;
    });

    model.summons.forEach((value: GameSummonModel) => {
      let summon = new Summon(value.level, value.number, value.color);
      if (this.summons.some((summonEntity: Summon) => summonEntity.number == summon.number && summonEntity.color == summon.color)) {
        summon = this.summons.filter((summonEntity: Summon) => summonEntity.number == summon.number && summonEntity.color == summon.color)[ 0 ];
      } else {
        this.summons.push(summon);
      }
      summon.fromModel(value);
    })
  }

}


export class GameCharacterModel {

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
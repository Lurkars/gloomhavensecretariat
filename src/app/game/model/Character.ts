import { Figure } from "./Figure";
import { Entity, EntityValueFunction } from "./Entity";
import { CharacterStat } from "./CharacterStat";
import { CharacterData } from "./data/CharacterData";
import { GameSummonModel, Summon, SummonColor, SummonState } from "./Summon";
import { gameManager } from "../businesslogic/GameManager";
import { FigureError } from "./FigureError";
import { ConditionName, EntityCondition, EntityConditionState, GameEntityConditionModel } from "./Condition";
import { SummonData } from "./data/SummonData";
import { CharacterProgress } from "./CharacterProgress";

export class Character extends CharacterData implements Entity, Figure {
  title: string = "";
  initiative: number = 0;
  experience: number = 0;
  loot: number = 0;
  exhausted: boolean = false;
  stat: CharacterStat;
  summons: Summon[] = [];
  progress: CharacterProgress;

  initiativeVisible: boolean = false;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];

  getInitiative(): number {
    return this.exhausted ? 99 : this.initiative;
  }

  constructor(character: CharacterData, level: number) {
    super(character.name, character.stats, character.edition, character.characterClass, character.availableSummons, character.icon, character.thumbnail, character.color, character.marker);
    this.errors = character.errors;
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }

    const stat = this.stats.find((characterStat: CharacterStat) => characterStat.level == level)
    if (!stat) {
      console.error("No character stat found for level: " + level);
      if (this.errors.indexOf(FigureError.stat) == -1) {
        this.errors.push(FigureError.stat);
      }
      this.stat = new CharacterStat(level, 0);
      this.level = 0;
      this.maxHealth = 0;
    } else {
      this.stat = stat;
      this.level = level;
      this.maxHealth = this.stat.health;
    }

    this.health = this.maxHealth;
    this.availableSummons.filter((summonData: SummonData) => summonData.special).forEach((summonData: SummonData) => this.createSpecial(summonData));
    this.progress = new CharacterProgress();
  }

  setLevel(level: number) {
    const stat = this.stats.find((characterStat: CharacterStat) => characterStat.level == level)
    if (!stat) {
      console.error("No character stat found for level: " + level);
      if (this.errors.indexOf(FigureError.stat) == -1) {
        this.errors.push(FigureError.stat);
      }
      this.stat = new CharacterStat(level, 0);
    } else {
      this.stat = stat;
    }

    this.level = level;

    if (this.health == this.maxHealth) {
      this.health = this.stat.health;
    }

    this.maxHealth = this.stat.health;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }

    this.availableSummons.filter((summonData: SummonData) => summonData.special).forEach((summonData: SummonData) => this.createSpecial(summonData));

    if (this.progress.experience < gameManager.characterManager.xpMap[ level - 1 ] || this.progress.experience >= gameManager.characterManager.xpMap[ level ]) {
      this.progress.experience = gameManager.characterManager.xpMap[ level - 1 ];
    }
  }

  createSpecial(summonData: SummonData) {
    this.summons = this.summons.filter((summon: Summon) => summon.name != summonData.name || summon.number != 0 || summon.color != SummonColor.custom);
    if (!summonData.level || summonData.level <= this.level) {
      let summon: Summon = new Summon(summonData.name, this.level, 0, SummonColor.custom);
      summon.maxHealth = typeof summonData.health == "number" ? summonData.health : EntityValueFunction(summonData.health, this.level);
      summon.attack = typeof summonData.attack == "number" ? summonData.attack : EntityValueFunction(summonData.attack, this.level);
      summon.movement = typeof summonData.movement == "number" ? summonData.movement : EntityValueFunction(summonData.movement, this.level);
      summon.range = typeof summonData.range == "number" ? summonData.range : EntityValueFunction(summonData.range, this.level);
      summon.health = summon.maxHealth;
      summon.state = SummonState.true;
      summon.init = false;
      gameManager.characterManager.addSummon(this, summon);
    }
  }

  toModel(): GameCharacterModel {
    return new GameCharacterModel(this.name, this.edition, this.title, this.initiative, this.experience, this.loot, this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition: EntityCondition) => condition.toModel()), this.markers, this.summons.map((summon: Summon) => summon.toModel()), this.progress, this.initiativeVisible);
  }

  fromModel(model: GameCharacterModel) {
    this.edition = model.edition;

    if (!this.edition) {
      const characterData = gameManager.charactersData(true).find((characterData: CharacterData) => characterData.name == model.name);
      if (characterData) {
        this.edition = characterData.edition;
      } else {
        this.edition = "";
      }
    }
    this.title = model.title;

    if (!this.initiativeVisible || model.initiative <= 0 || this.initiative != model.initiative) {
      this.initiativeVisible = model.initiativeVisible;
    }

    this.initiative = model.initiative;
    this.experience = model.experience;
    this.loot = model.loot;
    this.exhausted = model.exhausted;
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.entityConditions = [];
    if (model.entityConditions) {
      this.entityConditions = model.entityConditions.map((gecm: GameEntityConditionModel) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }
    this.markers = model.markers;

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
      let summon = this.summons.find((summonEntity: Summon) => summonEntity.name == summonEntity.name && summonEntity.number == value.number && summonEntity.color == value.color) as Summon;
      if (!summon) {
        summon = new Summon(value.name, value.level, value.number, value.color);
        this.summons.push(summon);
      }
      summon.fromModel(value);
    })

    this.progress = model.progress || new CharacterProgress();

    // migration
    if (model.conditions) {
      model.conditions.forEach((value: string) => {
        let entityCondition = new EntityCondition(value as ConditionName);
        if (model.turnConditions && model.turnConditions.indexOf(value) != -1) {
          entityCondition.state = EntityConditionState.expire;
        }
        if (model.expiredConditions && model.expiredConditions.indexOf(value) != -1) {
          entityCondition.expired = true;
        }
        this.entityConditions.push(entityCondition);
      })
    }
  }

}


export class GameCharacterModel {

  name: string;
  edition: string;
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
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  summons: GameSummonModel[];
  progress: CharacterProgress | undefined;
  initiativeVisible: boolean;

  // depreacted
  conditions: string[] = [];
  turnConditions: string[] = [];
  expiredConditions: string[] = [];


  constructor(name: string,
    edition: string,
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
    entityConditions: GameEntityConditionModel[],
    markers: string[],
    summons: GameSummonModel[],
    progress: CharacterProgress | undefined,
    initiativeVisible: boolean) {
    this.name = name;
    this.edition = edition;
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
    this.entityConditions = entityConditions;
    this.markers = markers;
    this.summons = summons;
    this.progress = progress;
    this.initiativeVisible = initiativeVisible;
  }

}
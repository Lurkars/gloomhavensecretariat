import { gameManager } from "../businesslogic/GameManager";
import { EntityValueFunction } from "./Entity";
import { Figure } from "./Figure";
import { GameMonsterEntityModel, MonsterEntity } from "./MonsterEntity";
import { SummonColor } from "./Summon";
import { Ability } from "./data/Ability";
import { MonsterData } from "./data/MonsterData";
import { MonsterStatEffect } from "./data/MonsterStat";

export class Monster extends MonsterData implements Figure {

  summonColor: SummonColor = SummonColor.blue;
  statEffect: MonsterStatEffect | undefined;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;
  drawExtra: boolean = false;
  lastDraw: number = 0;
  type: string = 'monster';

  getInitiative(): number {
    const ability: Ability | undefined = gameManager.monsterManager.getAbility(this);
    let initiative = gameManager.gameplayFigure(this) && ability && ability.initiative || 100;

    if (this.statEffect && this.statEffect.initiative) {
      initiative = this.statEffect.absolute ? EntityValueFunction(this.statEffect.initiative) : initiative + EntityValueFunction(this.statEffect.initiative);
    }

    // apply Challenge #1501
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1501, 'fh') && !this.isAlly) {
      initiative -= 10;
    }

    return Math.min(Math.max(initiative, 1), 100);
  }

  // Monster
  ability: number = -1;
  abilities: number[] = [];
  entities: MonsterEntity[] = [];
  isAlly: boolean = false;
  isAllied: boolean = false;

  tags: string[] = [];

  constructor(monsterData: MonsterData, level: number = 1) {
    super(monsterData);
    this.errors = monsterData.errors;
    this.level = level;
    this.tags = [];
    if (monsterData.baseStat && monsterData.stats) {
      for (let stat of monsterData.stats) {
        if (!stat.health && stat.health != 0) {
          stat.health = monsterData.baseStat.health || 0;
        }
        if (!stat.movement && stat.movement != 0) {
          stat.movement = monsterData.baseStat.movement || 0;
        }
        if (!stat.attack && stat.attack != 0) {
          stat.attack = monsterData.baseStat.attack || 0;
        }
        if (!stat.range && stat.range != 0) {
          stat.range = monsterData.baseStat.range || 0;
        }
        if (!stat.actions) {
          stat.actions = Object.assign([], monsterData.baseStat.actions);
        }
        if (!stat.immunities) {
          stat.immunities = Object.assign([], monsterData.baseStat.immunities);
        }
        if (!stat.special) {
          stat.special = [];
          if (monsterData.baseStat.special) {
            for (let special of monsterData.baseStat.special) {
              stat.special.push(Object.assign([], special));
            }
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
    return new GameMonsterModel(this.name, this.edition, this.level, this.off, this.active, this.drawExtra, this.lastDraw, this.ability, this.abilities, this.entities.map((value) => value.toModel()), this.isAlly, this.isAllied, this.tags)
  }


  fromModel(model: GameMonsterModel) {
    this.edition = model.edition;
    if (!this.edition) {
      const monsterData = gameManager.monstersData().find((monsterData) => monsterData.name == model.name);
      if (monsterData) {
        this.edition = monsterData.edition;
      } else {
        this.edition = "";
      }
    }
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.drawExtra = model.drawExtra;
    this.lastDraw = model.lastDraw;
    this.abilities = model.abilities && model.abilities.length > 0 && model.abilities || gameManager.abilities(this) && gameManager.abilities(this).map((ability, index) => index) || [];
    this.ability = model.ability;
    this.entities = this.entities.filter((monsterEntity) => model.entities.find((gmem) => gmem.number == monsterEntity.number && gmem.type == monsterEntity.type));
    model.entities.forEach((value, index) => {
      let entity = this.entities.find((monsterEntity) => monsterEntity.number == value.number && monsterEntity.type == value.type) as MonsterEntity;
      if (!entity) {
        entity = new MonsterEntity(value.number, value.type, this);
        this.entities.splice(index, 0, entity);
      } else if (index != this.entities.indexOf(entity)) {
        this.entities.splice(this.entities.indexOf(entity), 1);
        this.entities.splice(index, 0, entity);
      }
      entity.fromModel(value);
    })
    this.isAlly = model.isAlly;
    this.isAllied = model.isAllied;
    this.statEffect = undefined;
    this.tags = model.tags || [];
  }
}

export class GameMonsterModel {
  name: string;
  edition: string;
  level: number;
  off: boolean;
  active: boolean;
  drawExtra: boolean;
  lastDraw: number;
  ability: number;
  abilities: number[];
  entities: GameMonsterEntityModel[];
  isAlly: boolean;
  isAllied: boolean;
  tags: string[];

  constructor(name: string,
    edition: string,
    level: number,
    off: boolean,
    active: boolean,
    drawExtra: boolean,
    lastDraw: number,
    ability: number,
    abilities: number[],
    entities: GameMonsterEntityModel[],
    isAlly: boolean,
    isAllied: boolean,
    tags: string[]) {
    this.name = name;
    this.edition = edition;
    this.level = level;
    this.off = off;
    this.active = active;
    this.drawExtra = drawExtra;
    this.lastDraw = lastDraw;
    this.ability = ability;
    this.abilities = JSON.parse(JSON.stringify(abilities));
    this.entities = JSON.parse(JSON.stringify(entities));
    this.isAlly = isAlly;
    this.isAllied = isAllied;
    this.tags = JSON.parse(JSON.stringify(tags));
  }
}
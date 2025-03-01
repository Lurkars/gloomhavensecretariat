import { Action, ActionType } from "src/app/game/model/data/Action";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { EntityValueFunction } from "../model/Entity";
import { Game, GameState } from "../model/Game";
import { Monster } from '../model/Monster';
import { MonsterEntity } from "../model/MonsterEntity";
import { SummonState } from "../model/Summon";
import { Ability } from "../model/data/Ability";
import { ConditionType, EntityConditionState } from "../model/data/Condition";
import { MonsterData } from "../model/data/MonsterData";
import { MonsterStat, MonsterStatEffect } from "../model/data/MonsterStat";
import { MonsterType } from "../model/data/MonsterType";
import { MonsterSpawnData } from "../model/data/ScenarioRule";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class MonsterManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  monsterThumbnail(monsterData: MonsterData) {
    if (monsterData.thumbnailUrl) {
      return monsterData.thumbnailUrl;
    }

    if (!monsterData.thumbnail && monsterData.standeeShare) {
      const share = gameManager.monstersData(monsterData.standeeShareEdition || monsterData.edition).find((value) => value.name == monsterData.standeeShare);
      if (share) {
        this.monsterThumbnail(share);
        if (share.thumbnail) {
          monsterData.thumbnail = share.thumbnail;
        }
      }
    }

    if (!monsterData.thumbnail) {
      monsterData.thumbnail = monsterData.edition + '-' + monsterData.name;
    }
    return './assets/images/monster/thumbnail/' + monsterData.thumbnail + '.png';
  }

  monsterArtwork(monsterData: MonsterData) {
    if (monsterData.noArtwork) {
      return this.monsterThumbnail(monsterData);
    }
    this.monsterThumbnail(monsterData);
    return './assets/artwork/monster/' + monsterData.thumbnail + '.png';
  }

  getStat(monster: Monster, type: MonsterType): MonsterStat {
    let stat = monster.stats.find((monsterStat) => {
      return monsterStat.level == monster.level && monsterStat.type == type;
    });

    if (monster.bb) {
      if (type == MonsterType.elite && monster.stats[0] && monster.stats[0].type == MonsterType.elite) {
        stat = monster.stats[0];
      } else {
        stat = Object.assign(new MonsterStat(type), monster.baseStat);
      }
    }

    if (!stat) {
      monster.errors = monster.errors || [];
      if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + monster.name + " level: " + monster.level);
        monster.errors.push(new FigureError(FigureErrorType.stat, "monster", monster.name, monster.edition, type, "" + monster.level));
      }
      stat = new MonsterStat(type, monster.level);
    }

    stat = JSON.parse(JSON.stringify(stat)) as MonsterStat;

    if (monster.statEffect) {
      let statEffect = new MonsterStatEffect();
      statEffect.name = monster.statEffect.name;
      const oldHP = EntityValueFunction(stat.health, monster.level);
      statEffect.health = typeof monster.statEffect.health === 'string' ? monster.statEffect.health.replaceAll('H', '' + stat.health).replace('[', '').replace(']', '') : monster.statEffect.health;
      statEffect.movement = typeof monster.statEffect.movement === 'string' ? monster.statEffect.movement.replaceAll('M', '' + stat.movement).replace('[', '').replace(']', '') : monster.statEffect.movement;
      statEffect.attack = typeof monster.statEffect.attack === 'string' ? monster.statEffect.attack.replaceAll('A', '' + stat.attack).replace('[', '').replace(']', '') : monster.statEffect.attack;
      statEffect.range = typeof monster.statEffect.range === 'string' ? monster.statEffect.range.replaceAll('R', '' + stat.range).replace('[', '').replace(']', '') : monster.statEffect.range;
      statEffect.initiative = monster.statEffect.initiative;
      statEffect.flying = monster.statEffect.flying;
      statEffect.actions = monster.statEffect.actions;
      statEffect.special = monster.statEffect.special;
      statEffect.immunities = monster.statEffect.immunities;
      statEffect.absolute = monster.statEffect.absolute;
      statEffect.note = monster.statEffect.note;
      if (statEffect.absolute) {
        if (statEffect.health) {
          stat.health = '[' + statEffect.health + ']';
        }
        if (statEffect.movement) {
          stat.movement = '[' + statEffect.movement + ']';
        }
        if (statEffect.attack) {
          stat.attack = '[' + statEffect.attack + ']';
        }
        if (statEffect.range) {
          stat.range = '[' + statEffect.range + ']';
        }
        if (statEffect.actions) {
          stat.actions = statEffect.actions;
        }
        if (statEffect.special) {
          stat.special = statEffect.special;
        }
        if (statEffect.immunities) {
          stat.immunities = statEffect.immunities;
        }
      } else {
        if (statEffect.health) {
          stat.health = '[' + stat.health + '+' + statEffect.health + ']';
        }
        if (statEffect.movement) {
          stat.movement = '[' + stat.movement + '+' + statEffect.movement + ']';
        }
        if (statEffect.attack) {
          stat.attack = '[' + stat.attack + '+' + statEffect.attack + ']';
        }
        if (statEffect.range && EntityValueFunction(stat.range)) {
          stat.range = '[' + stat.range + '+' + statEffect.range + ']';
        }
        if (statEffect.actions) {
          stat.actions = stat.actions || [];
          stat.actions = [...stat.actions, ...statEffect.actions];
        }
        if (statEffect.immunities) {
          stat.immunities = stat.immunities || [];
          stat.immunities = [...stat.immunities, ...statEffect.immunities];
        }
      }

      if (statEffect.health) {
        monster.entities.forEach((monsterEntity) => {
          if (stat && monsterEntity.type == type && monsterEntity.maxHealth != EntityValueFunction(stat.health, monster.level)) {
            monsterEntity.maxHealth = EntityValueFunction(stat.health, monster.level);
            if (monsterEntity.health == oldHP || monsterEntity.health > monsterEntity.maxHealth) {
              monsterEntity.health = monsterEntity.maxHealth;
            }
          }
        })
      }
    }

    return stat;
  }

  getSpawnMonsters(monsters: MonsterData[]): MonsterData[] {
    let result: MonsterData[] = [];
    monsters.forEach((monster) => {
      this.getMonsterSpawns(monster).forEach((summon) => {
        if (result.indexOf(summon) == -1) {
          result.push(summon);
        }
      })
    })

    return result;
  }


  getMonsterSpawns(monster: MonsterData): MonsterData[] {
    let monsters: MonsterData[] = [];
    const deck = gameManager.deckData(new Monster(monster));
    if (deck && deck.abilities) {
      deck.abilities.forEach((ability) => {
        ability.actions.forEach((action) => {
          const summons = this.getActionSpawns(action, monster.edition);
          summons.forEach((summon) => {
            if (monsters.indexOf(summon) == -1) {
              monsters.push(summon);
            }
          })
        })
      })
    }

    if (monster.baseStat.special) {
      monster.baseStat.special.forEach((special) => {
        special.forEach((action) => {
          const summons = this.getActionSpawns(action, monster.edition);
          summons.forEach((summon) => {
            if (monsters.indexOf(summon) == -1) {
              monsters.push(summon);
            }
          })
        })
      })
    }

    if (monster.stats) {
      monster.stats.forEach((stat) => {
        if (stat.special) {
          stat.special.forEach((special) => {
            special.forEach((action) => {
              const summons = this.getActionSpawns(action, monster.edition);
              summons.forEach((summon) => {
                if (monsters.indexOf(summon) == -1) {
                  monsters.push(summon);
                }
              })
            })
          })
        }
      })
    }
    return monsters;
  }

  getActionSpawns(action: Action, edition: string): MonsterData[] {
    if (action.type == ActionType.summon || action.type == ActionType.spawn) {
      if (action.value != 'summonData' && action.value != 'monsterStandee') {
        const summon = gameManager.monstersData(edition).find((monsterData) => monsterData.name == ('' + action.value).split(':')[0]);
        if (summon) {
          return [summon];
        }
      } else if (action.value == 'monsterStandee' && action.valueObject) {
        let spawns: MonsterData[] = [];
        (action.valueObject as MonsterSpawnData[]).forEach((spawnData) => {
          const spawn = gameManager.monstersData(edition).find((monsterData) => monsterData.name == spawnData.monster.name);
          if (spawn) {
            spawns.push(spawn);
          }
        })
        return spawns;
      }
    }

    return action.subActions ? action.subActions.map((subAction) => this.getActionSpawns(subAction, edition)).flat() : [];
  }

  addMonsterByName(name: string, edition: string): Monster | undefined {
    let level = gameManager.game.level;
    if (name.indexOf(':') != -1) {
      level = eval(gameManager.game.level + name.split(':')[1]);
      if (level < 0) {
        level = 0;
      } else if (level > 7) {
        level = 7;
      }
      name = name.split(':')[0];
    }

    let monsterData = gameManager.monstersData().find((monsterData) => monsterData.name == name && (monsterData.edition == edition || gameManager.editionExtensions(edition).indexOf(monsterData.edition) != -1));

    if (!monsterData) {
      console.warn("Monster not found: '" + name + "' for edition :" + edition);
      monsterData = gameManager.monstersData().find((monsterData) => monsterData.name == name);
      if (monsterData) {
        monsterData.errors = monsterData.errors || [];
        if (!monsterData.errors.find((error) => error.type == FigureErrorType.monsterEdition)) {
          monsterData.errors.push(new FigureError(FigureErrorType.monsterEdition, "monster", monsterData.name, edition, monsterData.edition));
        }
      }
    }

    if (monsterData) {
      let monster = this.addMonster(monsterData, level);
      return monster;
    } else {
      console.error("Monster not found: '" + name + "'");
      return undefined;
    }
  }

  addMonster(monsterData: MonsterData, level: number): Monster {

    if (!this.game.scenario) {
      gameManager.scenarioManager.setScenario(gameManager.scenarioManager.createScenario());
    }

    let monster: Monster | undefined = this.game.figures.find((figure) =>
      figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition) as Monster;
    if (!monster) {
      monster = new Monster(monsterData);
      this.applySameDeck(monster);
      this.setLevel(monster, level);
      monster.off = true;
      this.resetMonsterAbilities(monster);
      this.game.figures.push(monster);
    } else if (level != gameManager.game.level && monster.level != level) {
      this.setLevel(monster, level);
    }

    if (gameManager.game.state == GameState.next) {
      gameManager.sortFigures(monster);
    }

    return monster;
  }

  resetMonsterAbilities(monster: Monster) {
    if (!this.applySameDeck(monster)) {
      if (!monster.abilities || monster.abilities.length == 0) {
        const abilities = gameManager.abilities(monster);
        monster.abilities = abilities.filter((ability) => isNaN(+ability.level) || +ability.level <= (monster && monster.level || 0)).map((ability) => abilities.indexOf(ability));
      }
      this.shuffleAbilities(monster);
    }
  }

  removeMonster(monster: Monster) {
    monster.entities = [];
    this.game.figures.splice(this.game.figures.indexOf(monster), 1);

    if (!monster.drawExtra) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster && figure.drawExtra && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition) {
          if (!this.getSameDeckMonster(figure)) {
            figure.drawExtra = false;
          }
        }
      })
    }
  }

  monsterEntityCount(monster: Monster, standee: boolean = false, type: MonsterType | undefined = undefined): number {
    return monster.entities.filter((monsterEntity) => (gameManager.entityManager.isAlive(monsterEntity, standee) || monsterEntity.dormant) && (!standee || monsterEntity.number > 0) && (!type || monsterEntity.type == type)).length;
  }

  monsterEntityCountIdentifier(monster: Monster, identifier: AdditionalIdentifier): number {
    if (identifier.type != 'all' && (identifier.name != monster.name || identifier.edition != monster.edition) || identifier.type != 'monster') {
      return 0;
    }

    return monster.entities.filter((entity) => gameManager.entityManager.isAlive(entity) && (!identifier.marker || identifier.marker == entity.marker) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => entity.tags.indexOf(tag) != -1))).length;
  }

  monsterEntityCountAll(monster: Monster): number {
    return gameManager.entityManager.entities(monster).length;
  }

  monsterStandeeShared(monster: Monster, list: Monster[]): Monster[] {
    if (monster.bb) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster && figure.bb && list.indexOf(figure) == -1) {
          list.push(figure);
        }
      })
      return list;
    }

    if (list.indexOf(monster) == -1) {
      list.push(monster);
    }

    if (monster.standeeShare) {
      let parent: Monster[] = this.game.figures.filter((figure) => figure instanceof Monster && monster.standeeShare && figure.name == monster.standeeShare && figure.edition == (monster.standeeShareEdition || monster.edition)).map((figure) => figure as Monster);

      parent.forEach((parentMonster) => {
        if (list.indexOf(parentMonster) == -1) {
          list.push(parentMonster);
          this.monsterStandeeShared(parentMonster, list);
        }
      })
    }

    let children: Monster[] = this.game.figures.filter((figure) => figure instanceof Monster && figure.standeeShare && monster.name == figure.standeeShare && monster.edition == (figure.standeeShareEdition || figure.edition)).map((figure) => figure as Monster);

    children.forEach((childMonster) => {
      if (list.indexOf(childMonster) == -1) {
        list.push(childMonster);
        this.monsterStandeeShared(childMonster, list);
      }
    })

    return list;
  }

  monsterStandeeUsed(monster: Monster, number: number): MonsterEntity | undefined {
    return this.monsterStandeeShared(monster, []).map((monster) => monster.entities).flat().find((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && entity.number == number);
  }

  monsterStandeeCount(monster: Monster, all: boolean = true): number {
    return this.monsterStandeeShared(monster, []).map((monster) => monster.entities).flat().filter((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && (all || entity.number > 0)).length;
  }

  monsterStandeeMax(monster: Monster): number {
    if (monster.bb && !settingsManager.settings.bbStandeeLimit) {
      return 10;
    }

    let max = EntityValueFunction(monster.standeeCount || monster.count || 0, monster.level);
    if ((!max || !monster.standeeCount) && monster.standeeShare) {
      const share = gameManager.monstersData(monster.standeeShareEdition || monster.edition).find((value) => value.name == monster.standeeShare);
      if (share) {
        max = EntityValueFunction(share.standeeCount || share.count, monster.level);
      }
    }
    return max;
  }

  monsterRandomStandee(monster: Monster): number {
    let number = -1;
    const monsterCount = this.monsterStandeeMax(monster);

    if ([...Array(monsterCount).keys()].every((n) => gameManager.monsterManager.monsterStandeeUsed(monster, n + 1))) {
      console.error("This should not happen: monsterRandomStandee called with all standees used already!");
      return number;
    }

    const randomCount = monster.randomCount ? EntityValueFunction(monster.randomCount) : 0;
    if (randomCount && randomCount < monsterCount && [...Array(randomCount).keys()].some((n) => !gameManager.monsterManager.monsterStandeeUsed(monster, n + 1))) {
      number = Math.floor(Math.random() * randomCount) + 1;
      while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
        number = Math.floor(Math.random() * randomCount) + 1;
      }
    } else {
      number = Math.floor(Math.random() * monsterCount) + 1;
      while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
        number = Math.floor(Math.random() * monsterCount) + 1;
      }
    }
    return number;
  }

  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false): MonsterEntity | undefined {
    if (monster.bb && !monster.baseStat || !monster.bb && !monster.stats.some((monsterStat) => {
      return monsterStat.type == type;
    })) {
      monster.errors = monster.errors || [];
      if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.monsterType)) {
        console.error("Missing type '" + type + "' for " + monster.name);
        monster.errors.push(new FigureError(FigureErrorType.monsterType, "monster", monster.name, monster.edition, type));
      }
      return undefined;
    }

    let monsterEntity: MonsterEntity = new MonsterEntity(number, type, monster);

    monster.entities = monster.entities.filter((other) => other.number != number);
    monster.entities.push(monsterEntity);
    gameManager.addEntityCount(monster, monsterEntity);

    if (monster.tags.indexOf('addedManually') != -1) {
      monster.tags = monster.tags.filter((tag) => tag != 'addedManually');
    }

    if (summon) {
      monsterEntity.summon = SummonState.new;
    }
    if (!summon || gameManager.fhRules()) {
      if (this.game.state == GameState.next) {
        if (monster.ability == -1) {
          if (!this.applySameDeck(monster)) {
            monster.ability = 0;
            monster.lastDraw = this.game.round;
          } else if (monster.ability == -1) {
            monster.ability = 0;
            monster.lastDraw = this.game.round;
          }
        } else if (monster.entities.length == 1 && !this.applySameDeck(monster) && monster.lastDraw < this.game.round) {
          monster.ability = monster.ability + 1 + this.game.figures.filter((f) => f instanceof Monster && (f.name != monster.name || f.edition != monster.edition) && gameManager.deckData(f).name == gameManager.deckData(monster).name && gameManager.deckData(f).edition == gameManager.deckData(monster).edition && f.drawExtra && f.ability > -1).length;
          monster.lastDraw = this.game.round;

          if (monster.ability >= monster.abilities.length) {
            this.shuffleAbilities(monster);
          }
        }
      }

      if (this.game.state == GameState.next && this.monsterEntityCount(monster) == 1) {
        let monsterIndex = gameManager.game.figures.indexOf(monster);
        const sameDeckMonster = this.getSameDeckMonster(monster);

        if (sameDeckMonster && gameManager.gameplayFigure(sameDeckMonster)) {
          this.applySameDeck(monster);
        }

        while (gameManager.game.figures.some((figure, index) => !figure.off && index < monsterIndex &&
          (figure.getInitiative() > monster.getInitiative() || figure.getInitiative() == monster.getInitiative() && figure instanceof Monster && figure.name.toLowerCase() > monster.name.toLowerCase()))) {
          gameManager.game.figures.splice(monsterIndex, 1);
          monsterIndex--;
          gameManager.game.figures.splice(monsterIndex, 0, monster);
        }
      }

      if (!summon && monster.off) {
        monster.off = false;
      } else if (summon && monster.entities.every((entity) => !gameManager.entityManager.isAlive(entity) || entity.summon == SummonState.new)) {
        monster.off = true;
      }

      if (this.game.state == GameState.next && monsterEntity.summon != SummonState.new) {
        monsterEntity.active = monster.active || gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(monster));
      }
    }

    return monsterEntity;
  }

  spawnMonsterEntity(monster: Monster, type: MonsterType, isAlly: boolean = false, isAllied: boolean = false, drawExtra: boolean = false, summon: boolean = false): MonsterEntity | undefined {
    monster.isAlly = isAlly;
    monster.isAllied = isAllied;
    monster.drawExtra = drawExtra;
    const monsterCount = this.monsterStandeeMax(monster);
    if (settingsManager.settings.automaticStandees && this.monsterStandeeCount(monster) < monsterCount) {
      let number = -1;
      while (this.monsterStandeeUsed(monster, number)) {
        number -= 1;
      }

      if (settingsManager.settings.randomStandees) {
        number = this.monsterRandomStandee(monster);
      } else if (this.monsterStandeeCount(monster, false) == monsterCount - 1) {
        number = 1;
        while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
          number++;
        }
      } else if (this.monsterStandeeCount(monster, false) == 0 && this.monsterStandeeCount(monster, true) == monsterCount - 1 && monster.entities.every((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && entity.type == type)) {
        monster.entities.forEach((entity, index) => {
          entity.number = index + 1;
        })
        number = monsterCount;
      }

      if (monster.boss) {
        type = MonsterType.boss;
      }

      const entity = this.addMonsterEntity(monster, number, type, summon);
      if (entity) {
        entity.revealed = true;
      }
      return entity;
    }
    return undefined;
  }

  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
    if (monster.entities.length == 0 || monster.entities.every((entity) => !gameManager.entityManager.isAlive(entity) && !entity.dormant)) {
      if (!monster.off && gameManager.game.state == GameState.next) {
        if (monster.active) {
          gameManager.roundManager.toggleFigure(monster);
        } else {
          monster.off = true;
        }
      } else {
        monster.off = true;
      }

      if (settingsManager.settings.removeUnusedMonster && monster.entities.length == 0) {
        this.removeMonster(monster);
      }
    }

    if (settingsManager.settings.scenarioStats && monsterEntity.dead) {
      gameManager.scenarioStatsManager.killMonsterEntity(monsterEntity);
    }
  }

  setLevel(monster: Monster, level: number) {
    const abilities = gameManager.abilities(monster);
    if (monster.abilities.length != abilities.filter((ability) => !ability.level || isNaN(+ability.level) || EntityValueFunction(ability.level) <= level).length) {
      monster.abilities = abilities.filter((ability) => !ability.level || isNaN(+ability.level) || EntityValueFunction(ability.level) <= level).map((ability, index) => index);
      this.shuffleAbilities(monster);
    }

    monster.level = level;

    monster.entities.forEach((monsterEntity) => {
      let stat = this.getStat(monster, monsterEntity.type);

      monsterEntity.level = monster.level;

      let maxHealth: number;
      if (typeof stat.health === "number") {
        maxHealth = stat.health;
      } else {
        maxHealth = EntityValueFunction(stat.health);
      }

      if (monsterEntity.health == monsterEntity.maxHealth) {
        monsterEntity.health = maxHealth;
      }

      monsterEntity.maxHealth = maxHealth;
      if (monsterEntity.health > monsterEntity.maxHealth) {
        monsterEntity.health = monsterEntity.maxHealth;
      }
    });
  }

  toggleActive(monster: Monster, entity: MonsterEntity) {
    if (this.game.state == GameState.next) {
      if (monster.active) {
        entity.active = !entity.active;
        if (monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active)) {
          gameManager.roundManager.toggleFigure(monster);
        }
      } else if (entity.active) {
        entity.active = false;
        if (monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active || monsterEntity.summon == SummonState.new)) {
          monster.off = true;
        }
      } else {
        monster.off = false;
        entity.active = true;
      }

      if (entity.active) {
        entity.off = false;
        if (!monster.active && this.game.figures.every((figure) => !figure.active)) {
          monster.active = true;
        }
      } else {
        entity.off = true;
      }
    }
  }

  getSameDeckMonster(monster: Monster): Monster | undefined {
    return this.game.figures.find((figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && !figure.drawExtra) as Monster | undefined;
  }

  applySameDeck(monster: Monster): boolean {
    const sameDeckMonster = this.getSameDeckMonster(monster);

    if (sameDeckMonster) {
      monster.abilities = JSON.parse(JSON.stringify(sameDeckMonster.abilities));
      monster.ability = sameDeckMonster.ability;
      monster.lastDraw = this.game.round;

      if (monster.drawExtra) {
        this.drawExtra(monster);
      }

      return true;
    }
    return false;
  }

  drawExtra(monster: Monster) {
    if (monster.drawExtra) {
      monster.ability = -1;
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Draw extra for '" + monster.name + "' (" + monster.deck + " not possible, not same deck monster found!");
        monster.drawExtra = false;
        return;
      }

      monster.ability = sameDeckMonster.ability + 1 + this.game.figures.filter((figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && figure.drawExtra && figure.ability > sameDeckMonster.ability).length;

      if (monster.ability >= monster.abilities.length) {
        this.shuffleAbilities(monster);
      }
      monster.lastDraw = this.game.round;
    } else {
      this.applySameDeck(monster);
    }
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Monster) {
        const ability = this.getAbility(figure);
        if (ability) {
          if (ability.shuffle || figure.ability >= figure.abilities.length) {
            this.shuffleAbilities(figure);
          }
        }

        figure.entities = figure.entities.filter((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) || monsterEntity.dormant);

        figure.entities.forEach((entity) => {
          if (entity.tags) {
            entity.tags = entity.tags.filter((tag) => !tag.startsWith('roundAction-'));
          }

          if (entity.summon == SummonState.new) {
            entity.summon = SummonState.true;
          }

          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
              if (entityCondition.state == EntityConditionState.normal) {
                entityCondition.lastState = entityCondition.state;
                entityCondition.state = EntityConditionState.expire;
              }
            }
          })
        })

        figure.tags = figure.tags.filter((tag) => !tag.startsWith('roundAction-'));

        figure.off = figure.entities.length == 0;
      }
    })
  }

  draw() {
    this.game.figures.filter((figure) => figure instanceof Monster && !figure.drawExtra).forEach((figure) => {
      if (figure instanceof Monster) {
        if (gameManager.gameplayFigure(figure)) {
          figure.ability = figure.ability + 1 + this.game.figures.filter((f) => f instanceof Monster && (f.name != figure.name || f.edition != figure.edition) && gameManager.deckData(f).name == gameManager.deckData(figure).name && gameManager.deckData(f).edition == gameManager.deckData(figure).edition && f.drawExtra && f.ability > -1).length;
          figure.lastDraw = this.game.round;

          if (this.hasBottomActions(figure)) {
            figure.ability += 1;
          }

          if (figure.ability >= figure.abilities.length) {
            this.shuffleAbilities(figure);
          }

          if (figure.bb && figure.tags.indexOf('bb-elite') != -1) {
            let nextAbility = figure.ability + 1;
            if (nextAbility >= figure.abilities.length) {
              nextAbility = 0;
            }
            const abilities = gameManager.deckData(figure).abilities;
            if (abilities[figure.abilities[nextAbility]].initiative < abilities[figure.abilities[figure.ability]].initiative) {
              const swap = figure.abilities[figure.ability];
              figure.abilities[figure.ability] = figure.abilities[nextAbility];
              figure.abilities[nextAbility] = swap;
            }
          }
        }
      }
    });

    this.game.figures.filter((figure) => figure instanceof Monster && figure.drawExtra).forEach((figure) => {
      if (figure instanceof Monster) {
        this.drawExtra(figure);

        if (figure.ability >= figure.abilities.length) {
          this.shuffleAbilities(figure);
        }
      }
    });
  }

  removeAbility(monster: Monster, index: number) {
    const deckData = gameManager.deckData(monster);
    this.game.figures.filter((figure) => {
      if (figure instanceof Monster) {
        const otherDeckData = gameManager.deckData(figure);
        return deckData.name == otherDeckData.name && deckData.edition == otherDeckData.edition;
      }
      return false;
    }).map((figure) => figure as Monster).forEach((sameDeckMonster) => {
      sameDeckMonster.abilities.splice(index, 1);
    });
  }

  restoreAbility(monster: Monster, ability: Ability) {
    const deckData = gameManager.deckData(monster);
    this.game.figures.filter((figure) => {
      if (figure instanceof Monster) {
        const otherDeckData = gameManager.deckData(figure);
        return deckData.name == otherDeckData.name && deckData.edition == otherDeckData.edition;
      }
      return false;
    }).map((figure) => figure as Monster).forEach((sameDeckMonster) => {
      sameDeckMonster.abilities.unshift(deckData.abilities.indexOf(ability));
    });
  }

  restoreDefaultAbilities(monster: Monster) {
    const deckData = gameManager.deckData(monster);
    this.game.figures.filter((figure) => {
      if (figure instanceof Monster) {
        const otherDeckData = gameManager.deckData(figure);
        return deckData.name == otherDeckData.name && deckData.edition == otherDeckData.edition;
      }
      return false;
    }).map((figure) => figure as Monster).forEach((sameDeckMonster) => {
      sameDeckMonster.abilities = deckData.abilities.filter((ability) => !ability.level || isNaN(+ability.level) || EntityValueFunction(ability.level) <= monster.level).map((ability, index) => index);
      sameDeckMonster.ability = -1;
    });
  }

  shuffleAbilities(monster: Monster, onlyUpcoming: boolean = false) {
    if (!onlyUpcoming) {
      if (gameManager.game.state == GameState.draw || monster.entities.length == 0) {
        monster.ability = -1;
      } else {
        monster.ability = 0;
      }
    }

    if (monster.drawExtra) {
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Shuffle for '" + monster.name + "' (" + monster.deck + " not possible, not same deck monster found!");
        monster.drawExtra = false;
        this.shuffleAbilities(monster, onlyUpcoming);
        return;
      }
      this.shuffleAbilities(sameDeckMonster, onlyUpcoming);
      return;
    }

    const deckData = gameManager.deckData(monster);
    const sameDeckMonsters = this.game.figures.filter((figure) => {
      if (figure instanceof Monster) {
        const otherDeckData = gameManager.deckData(figure);
        return deckData.name == otherDeckData.name && deckData.edition == otherDeckData.edition;
      }
      return false;
    }).map((figure) => figure as Monster)

    let restoreCards: number[] = onlyUpcoming && monster.ability > -1 ? monster.abilities.splice(0, monster.ability + 1 + sameDeckMonsters.filter((monster) => monster.drawExtra).length) : [];

    ghsShuffleArray(monster.abilities);

    if (onlyUpcoming) {
      monster.abilities.unshift(...restoreCards);
    }

    sameDeckMonsters.forEach((sameDeckMonster) => {
      sameDeckMonster.abilities = JSON.parse(JSON.stringify(monster.abilities));
      if (gameManager.game.state == GameState.draw) {
        sameDeckMonster.ability = -1;
      } else {
        sameDeckMonster.ability = monster.ability;

        if (sameDeckMonster.drawExtra) {
          this.drawExtra(sameDeckMonster);
        }
      }
    })
  }

  drawAbility(monster: Monster) {
    if (monster.drawExtra) {
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Draw for '" + monster.name + "' (" + monster.deck + " not possible, not same deck monster found!");
        monster.drawExtra = false;
        this.drawAbility(monster);
        return;
      }
      this.drawAbility(sameDeckMonster);
      return;
    }

    monster.ability += 1;

    if (this.hasBottomActions(monster)) {
      monster.ability += 1;
    }

    this.game.figures.forEach((figure) => {
      if (figure instanceof Monster && this.getSameDeckMonster(figure)) {
        figure.ability = monster.ability;

        if (figure.drawExtra) {
          this.drawExtra(figure);
        }
      }
    })
  }

  drawnAbilities(monster: Monster): number {
    let drawn = 0;
    if (monster.ability >= 0) {
      drawn = monster.ability + 1;
    }
    let other = gameManager.game.figures.find((figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && figure.ability >= drawn);
    while (other instanceof Monster) {
      drawn = other.ability + 1;
      other = gameManager.game.figures.find((figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && figure.ability >= drawn);
    }

    return drawn;
  }

  getAbility(monster: Monster): Ability | undefined {
    if (monster.ability < 0 || monster.ability >= monster.abilities.length || !settingsManager.settings.abilities) {
      return undefined;
    }

    const abilities = gameManager.abilities(monster);

    if (!abilities) {
      return undefined;
    }

    return abilities[monster.abilities[monster.ability]]
  }

  hasBottomActions(monster: Monster): boolean {
    return gameManager.abilities(monster).length > 0 && gameManager.abilities(monster).every((ability) => gameManager.hasBottomAbility(ability));
  }

  sortEntities(a: MonsterEntity, b: MonsterEntity): number {
    if (a.type == MonsterType.elite && b.type == MonsterType.normal) {
      return -1;
    } else if (a.type == MonsterType.normal && b.type == MonsterType.elite) {
      return 1;
    }
    return gameManager.monsterManager.sortEntitiesByNumber(a, b);
  }

  sortEntitiesByNumber(a: MonsterEntity, b: MonsterEntity): number {
    if (a.summon == SummonState.new && b.summon != SummonState.new) {
      return 1;
    } else if (a.summon != SummonState.new && b.summon == SummonState.new) {
      return -1;
    } else if (a.summon == SummonState.new && b.summon == SummonState.new) {
      return 0;
    }
    if (a.number < 0 && b.number >= 0) {
      return 1;
    } else if (b.number < 0 && a.number >= 0) {
      return -1;
    }
    return a.number < b.number ? -1 : 1;
  }
}
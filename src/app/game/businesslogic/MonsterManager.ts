import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { ConditionType, EntityConditionState } from 'src/app/game/model/data/Condition';
import { FigureError, FigureErrorType } from 'src/app/game/model/data/FigureError';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat, MonsterStatEffect } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';
import { RpgMonsterAction, rpgMonsterActions } from 'src/app/game/model/data/RpgMonsterAction';
import { MonsterSpawnData } from 'src/app/game/model/data/ScenarioRule';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { evaluateExpression } from 'src/app/game/util/ExpressionEvaluator';

export const RPG_DEFAULT_SPEED = 1;

/** tag on a dead monster entity: 'killed' or 'killed:<edition>:<character>:[summon]' */
export const KILLED_TAG = 'killed';

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
      const share = gameManager.editionManager
        .monstersData(monsterData.standeeShareEdition || monsterData.edition)
        .find((value) => value.name === monsterData.standeeShare);
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
      return monsterStat.level === monster.level && monsterStat.type === type;
    });

    if (monster.editionRules === 'bb') {
      if (type === MonsterType.elite && monster.stats[0] && monster.stats[0].type === MonsterType.elite) {
        stat = monster.stats[0];
      } else {
        stat = Object.assign(new MonsterStat(type), monster.baseStat);
      }
    }

    if (!stat) {
      monster.errors = monster.errors || [];
      if (
        !monster.errors.find((figureError) => figureError.type === FigureErrorType.unknown) &&
        !monster.errors.find((figureError) => figureError.type === FigureErrorType.stat)
      ) {
        console.error("Could not find '" + type + "' stats for monster: " + monster.name + ' level: ' + monster.level);
        monster.errors.push(new FigureError(FigureErrorType.stat, 'monster', monster.name, monster.edition, type, '' + monster.level));
      }
      stat = new MonsterStat(type, monster.level);
    }

    stat = JSON.parse(JSON.stringify(stat)) as MonsterStat;

    if (monster.statEffect) {
      const statEffect = new MonsterStatEffect();
      statEffect.name = monster.statEffect.name;
      const oldHP = EntityValueFunction(stat.health, monster.level);
      statEffect.health =
        typeof monster.statEffect.health === 'string'
          ? monster.statEffect.health
              .replaceAll('H', '' + stat.health)
              .replace('[', '')
              .replace(']', '')
          : monster.statEffect.health;
      statEffect.movement =
        typeof monster.statEffect.movement === 'string'
          ? monster.statEffect.movement
              .replaceAll('M', '' + stat.movement)
              .replace('[', '')
              .replace(']', '')
          : monster.statEffect.movement;
      statEffect.attack =
        typeof monster.statEffect.attack === 'string'
          ? monster.statEffect.attack
              .replaceAll('A', '' + stat.attack)
              .replace('[', '')
              .replace(']', '')
          : monster.statEffect.attack;
      statEffect.range =
        typeof monster.statEffect.range === 'string'
          ? monster.statEffect.range
              .replaceAll('R', '' + stat.range)
              .replace('[', '')
              .replace(']', '')
          : monster.statEffect.range;
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
          if (stat && monsterEntity.type === type && monsterEntity.maxHealth !== EntityValueFunction(stat.health, monster.level)) {
            monsterEntity.maxHealth = EntityValueFunction(stat.health, monster.level);
            if (monsterEntity.health === oldHP || monsterEntity.health > monsterEntity.maxHealth) {
              monsterEntity.health = monsterEntity.maxHealth;
            }
          }
        });
      }
    }

    return stat;
  }

  getSpawnMonsters(monsters: MonsterData[]): MonsterData[] {
    const result: MonsterData[] = [];
    monsters.forEach((monster) => {
      this.getMonsterSpawns(monster).forEach((summon) => {
        if (!result.includes(summon)) {
          result.push(summon);
        }
      });
    });

    return result;
  }

  getMonsterSpawns(monster: MonsterData): MonsterData[] {
    const monsters: MonsterData[] = [];
    const deck = gameManager.editionManager.deckData(new Monster(monster));
    if (deck && deck.abilities) {
      deck.abilities.forEach((abilityCard) => {
        abilityCard.actions.forEach((action) => {
          const summons = this.getActionSpawns(action, monster.edition);
          summons.forEach((summon) => {
            if (!monsters.includes(summon)) {
              monsters.push(summon);
            }
          });
        });
      });
    }

    if (monster.baseStat.special) {
      monster.baseStat.special.forEach((special) => {
        special.forEach((action) => {
          const summons = this.getActionSpawns(action, monster.edition);
          summons.forEach((summon) => {
            if (!monsters.includes(summon)) {
              monsters.push(summon);
            }
          });
        });
      });
    }

    if (monster.stats) {
      monster.stats.forEach((stat) => {
        if (stat.special) {
          stat.special.forEach((special) => {
            special.forEach((action) => {
              const summons = this.getActionSpawns(action, monster.edition);
              summons.forEach((summon) => {
                if (!monsters.includes(summon)) {
                  monsters.push(summon);
                }
              });
            });
          });
        }
      });
    }
    return monsters;
  }

  getActionSpawns(action: Action, edition: string): MonsterData[] {
    if (action.type === ActionType.summon || action.type === ActionType.spawn) {
      if (action.value !== 'summonData' && action.value !== 'monsterStandee') {
        const summon = gameManager.editionManager
          .monstersData(edition)
          .find((monsterData) => monsterData.name === ('' + action.value).split(':')[0]);
        if (summon) {
          return [summon];
        }
      } else if (action.value === 'monsterStandee' && action.valueObject) {
        const spawns: MonsterData[] = [];
        (action.valueObject as MonsterSpawnData[]).forEach((spawnData) => {
          const spawn = gameManager.editionManager.monstersData(edition).find((monsterData) => monsterData.name === spawnData.monster.name);
          if (spawn) {
            spawns.push(spawn);
          }
        });
        return spawns;
      }
    }

    return action.subActions ? action.subActions.map((subAction) => this.getActionSpawns(subAction, edition)).flat() : [];
  }

  addMonsterByName(name: string, edition: string): Monster | undefined {
    let level = this.game.level;
    if (name.split(':').length > 1) {
      level = evaluateExpression(this.game.level + name.split(':')[1]);
      if (level < 0) {
        level = 0;
      } else if (level > 7) {
        level = 7;
      }
      if (name.split(':').length > 2) {
        edition = name.split(':')[2];
      }
      name = name.split(':')[0];
    }

    let monsterData = gameManager.editionManager
      .monstersData()
      .find((monsterData) => monsterData.name === name && gameManager.editionManager.isEditionRelevant(monsterData.edition, edition));

    if (!monsterData) {
      console.warn("Monster not found: '" + name + "' for edition :" + edition);
      monsterData = gameManager.editionManager.monstersData().find((monsterData) => monsterData.name === name);
      if (monsterData) {
        monsterData.errors = monsterData.errors || [];
        if (!monsterData.errors.find((error) => error.type === FigureErrorType.monsterEdition)) {
          monsterData.errors.push(
            new FigureError(FigureErrorType.monsterEdition, 'monster', monsterData.name, edition, monsterData.edition)
          );
        }
      }
    }

    if (monsterData) {
      const monster = this.addMonster(monsterData, level);
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

    let monster: Monster | undefined = this.game.figures.find(
      (figure) => figure instanceof MonsterData && figure.name === monsterData.name && figure.edition === monsterData.edition
    ) as Monster;
    if (!monster) {
      monster = new Monster(monsterData);
      gameManager.monsterAbilityManager.applySameDeck(monster);
      this.setLevel(monster, level);
      monster.off = true;
      gameManager.monsterAbilityManager.resetMonsterAbilities(monster);
      this.game.figures.push(monster);
      if (gameManager.rpgRules()) {
        this.applyRpgSpeed(monster, RPG_DEFAULT_SPEED);
      }
    } else if (level !== this.game.level && monster.level !== level) {
      this.setLevel(monster, level);
    }

    if (this.game.state === GameState.next) {
      gameManager.roundManager.sortFigures(monster);
    }

    return monster;
  }

  removeMonster(monster: Monster) {
    monster.entities = [];
    this.game.figures.splice(this.game.figures.indexOf(monster), 1);

    if (!monster.drawExtra) {
      this.game.figures.forEach((figure) => {
        if (
          figure instanceof Monster &&
          figure.drawExtra &&
          (figure.name !== monster.name || figure.edition !== monster.edition) &&
          gameManager.editionManager.deckData(figure).name === gameManager.editionManager.deckData(monster).name &&
          gameManager.editionManager.deckData(figure).edition === gameManager.editionManager.deckData(monster).edition
        ) {
          if (!gameManager.monsterAbilityManager.getSameDeckMonster(figure)) {
            figure.drawExtra = false;
          }
        }
      });
    }
  }

  removeAllMonsters(unused: boolean = false) {
    (this.game.figures.filter((figure) => figure instanceof Monster) as Monster[])
      .filter((monster) => !unused || !monster.entities.some((entity) => gameManager.entityManager.isAlive(entity)))
      .forEach((monster) => this.removeMonster(monster));
  }

  changeType(entity: MonsterEntity, monster: Monster) {
    const normalStat = gameManager.monsterManager.getStat(monster, MonsterType.normal);
    const eliteStat = gameManager.monsterManager.getStat(monster, MonsterType.elite);
    if (normalStat && eliteStat) {
      entity.type = entity.type === MonsterType.normal ? MonsterType.elite : MonsterType.normal;
      entity.maxHealth = EntityValueFunction(entity.type === MonsterType.normal ? normalStat.health : eliteStat.health, monster.level);
      if (entity.health > entity.maxHealth) {
        entity.health = entity.maxHealth;
      } else if (
        entity.health < entity.maxHealth &&
        entity.health === EntityValueFunction(entity.type === MonsterType.normal ? eliteStat.health : normalStat.health, monster.level)
      ) {
        entity.health = entity.maxHealth;
      }

      if (monster.editionRules === 'bb') {
        if (monster.entities.every((entity) => entity.type === MonsterType.elite)) {
          if (!monster.tags.includes('bb-elite')) {
            monster.tags.push('bb-elite');
          }
        } else if (monster.tags.includes('bb-elite')) {
          monster.tags = monster.tags.filter((tag) => tag !== 'bb-elite');
        }
      }
    } else {
      console.warn('Missing stats!', monster);
    }
  }

  monsterEntityCount(monster: Monster, standee: boolean = false, type: MonsterType | undefined = undefined): number {
    return monster.entities.filter(
      (monsterEntity) =>
        (gameManager.entityManager.isAlive(monsterEntity, standee) || monsterEntity.dormant) &&
        (!standee || monsterEntity.number > 0) &&
        (!type || monsterEntity.type === type)
    ).length;
  }

  monsterEntityCountIdentifier(monster: Monster, identifier: AdditionalIdentifier): number {
    if (
      (identifier.type !== 'all' && (identifier.name !== monster.name || identifier.edition !== monster.edition)) ||
      identifier.type !== 'monster'
    ) {
      return 0;
    }

    return monster.entities.filter(
      (entity) =>
        gameManager.entityManager.isAlive(entity) &&
        (!identifier.marker || identifier.marker === entity.marker) &&
        (!identifier.tags || identifier.tags.length === 0 || identifier.tags.every((tag) => entity.tags.includes(tag)))
    ).length;
  }

  monsterEntityCountAll(monster: Monster): number {
    return gameManager.entityManager.entities(monster).length;
  }

  monsterStandeeShared(monster: Monster, list: Monster[]): Monster[] {
    if (monster.editionRules === 'bb') {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster && figure.editionRules === 'bb' && !list.includes(figure)) {
          list.push(figure);
        }
      });
      return list;
    }

    if (!list.includes(monster)) {
      list.push(monster);
    }

    if (monster.standeeShare) {
      const parent: Monster[] = this.game.figures
        .filter(
          (figure) =>
            figure instanceof Monster &&
            monster.standeeShare &&
            figure.name === monster.standeeShare &&
            figure.edition === (monster.standeeShareEdition || monster.edition)
        )
        .map((figure) => figure as Monster);

      parent.forEach((parentMonster) => {
        if (!list.includes(parentMonster)) {
          list.push(parentMonster);
          this.monsterStandeeShared(parentMonster, list);
        }
      });
    }

    const children: Monster[] = this.game.figures
      .filter(
        (figure) =>
          figure instanceof Monster &&
          figure.standeeShare &&
          monster.name === figure.standeeShare &&
          monster.edition === (figure.standeeShareEdition || figure.edition)
      )
      .map((figure) => figure as Monster);

    children.forEach((childMonster) => {
      if (!list.includes(childMonster)) {
        list.push(childMonster);
        this.monsterStandeeShared(childMonster, list);
      }
    });

    return list;
  }

  monsterStandeeUsed(monster: Monster, number: number): MonsterEntity | undefined {
    return this.monsterStandeeShared(monster, [])
      .map((monster) => monster.entities)
      .flat()
      .find((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && entity.number === number);
  }

  monsterStandeeCount(monster: Monster, all: boolean = true): number {
    return this.monsterStandeeShared(monster, [])
      .map((monster) => monster.entities)
      .flat()
      .filter((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && (all || entity.number > 0)).length;
  }

  monsterStandeeMax(monster: Monster): number {
    if (monster.editionRules === 'bb' && !settingsManager.settings.bbStandeeLimit) {
      return 10;
    }

    let max = EntityValueFunction(monster.standeeCount || monster.count || 0, monster.level);
    if ((!max || !monster.standeeCount) && monster.standeeShare) {
      const share = gameManager.editionManager
        .monstersData(monster.standeeShareEdition || monster.edition)
        .find((value) => value.name === monster.standeeShare);
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
      console.error('This should not happen: monsterRandomStandee called with all standees used already!');
      return number;
    }

    const randomCount = monster.randomCount ? EntityValueFunction(monster.randomCount) : 0;
    if (
      randomCount &&
      randomCount < monsterCount &&
      [...Array(randomCount).keys()].some((n) => !gameManager.monsterManager.monsterStandeeUsed(monster, n + 1))
    ) {
      number = gameManager.randomManager.int(randomCount) + 1;
      while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
        number = gameManager.randomManager.int(randomCount) + 1;
      }
    } else {
      number = gameManager.randomManager.int(monsterCount) + 1;
      while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
        number = gameManager.randomManager.int(monsterCount) + 1;
      }
    }
    return number;
  }

  nextStandeeNumber(monster: Monster): number {
    let number = 1;
    while (this.monsterStandeeUsed(monster, number)) {
      number += 1;
    }
    return number;
  }

  placeStandee(monster: Monster, number: number, type: MonsterType, summon: boolean = false): MonsterEntity | undefined {
    const dead = monster.entities.find((monsterEntity) => monsterEntity.number === number);
    if (dead) {
      this.removeMonsterEntity(monster, dead);
    }
    const entity = this.addMonsterEntity(
      monster,
      number,
      monster.editionRules === 'bb' && monster.tags.includes('bb-elite') ? MonsterType.elite : type,
      summon
    );
    if (entity && this.game.state === GameState.next) {
      monster.active = !this.game.figures.some((figure) => figure.active);
      if (monster.active) {
        gameManager.roundManager.sortFigures(monster);
        entity.active = true;
      }
    }
    return entity;
  }

  renumberStandee(monster: Monster, entity: MonsterEntity, number: number) {
    // a dead standee with this number is taken from the board
    const dead = monster.entities.find(
      (other) => other !== entity && other.number === number && !gameManager.entityManager.isAlive(other) && !other.dormant
    );
    if (dead) {
      this.removeMonsterEntity(monster, dead);
    }
    const existing = this.monsterStandeeUsed(monster, number);
    if (existing && existing !== entity) {
      let otherNumber = -1;
      while (this.monsterStandeeUsed(monster, otherNumber)) {
        otherNumber -= 1;
      }
      existing.number = otherNumber;
    }
    if (entity.number < 0) {
      entity.revealed = false;
    }
    entity.number = number;
  }

  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false): MonsterEntity | undefined {
    if (
      (monster.editionRules === 'bb' && !monster.baseStat) ||
      (monster.editionRules !== 'bb' &&
        !monster.stats.some((monsterStat) => {
          return monsterStat.type === type;
        }))
    ) {
      monster.errors = monster.errors || [];
      if (
        !monster.errors.find((figureError) => figureError.type === FigureErrorType.unknown) &&
        !monster.errors.find((figureError) => figureError.type === FigureErrorType.monsterType)
      ) {
        console.error("Missing type '" + type + "' for " + monster.name);
        monster.errors.push(new FigureError(FigureErrorType.monsterType, 'monster', monster.name, monster.edition, type));
      }
      return undefined;
    }

    const monsterEntity: MonsterEntity = new MonsterEntity(number, type, monster);

    if (gameManager.rpgRules() && !settingsManager.settings.activeStandees) {
      const sibling = monster.entities.find((other) => other.type === type && other.rpgAction > -1);
      monsterEntity.rpgAction = sibling ? sibling.rpgAction : -1;
    }

    monster.entities = monster.entities.filter((other) => other.number !== number);
    monster.entities.push(monsterEntity);
    gameManager.entityCounterManager.addEntityCount(monster, monsterEntity);

    if (monster.tags.includes('addedManually')) {
      monster.tags = monster.tags.filter((tag) => tag !== 'addedManually');
    }

    if (summon) {
      monsterEntity.summon = SummonState.new;
    }
    if (!summon || gameManager.fhRules(true)) {
      if (this.game.state === GameState.next && gameManager.rpgRules()) {
        if (monster.ability === -1) {
          this.applyRpgSpeed(monster, RPG_DEFAULT_SPEED);
          monster.lastDraw = this.game.round;
        }
      } else if (this.game.state === GameState.next) {
        if (monster.ability === -1) {
          if (!gameManager.monsterAbilityManager.applySameDeck(monster)) {
            monster.ability = 0;
            monster.lastDraw = this.game.round;
          } else if (monster.ability === -1) {
            monster.ability = 0;
            monster.lastDraw = this.game.round;
          }
        } else if (
          monster.entities.length === 1 &&
          !gameManager.monsterAbilityManager.applySameDeck(monster) &&
          monster.lastDraw < this.game.round
        ) {
          monster.ability =
            monster.ability +
            1 +
            this.game.figures.filter(
              (f) =>
                f instanceof Monster &&
                (f.name !== monster.name || f.edition !== monster.edition) &&
                gameManager.editionManager.deckData(f).name === gameManager.editionManager.deckData(monster).name &&
                gameManager.editionManager.deckData(f).edition === gameManager.editionManager.deckData(monster).edition &&
                f.drawExtra &&
                f.ability > -1
            ).length;
          monster.lastDraw = this.game.round;

          if (monster.ability >= monster.abilities.length) {
            gameManager.monsterAbilityManager.shuffleAbilities(monster);
          }
        }
      }

      if (this.game.state === GameState.next && this.monsterEntityCount(monster) === 1) {
        let monsterIndex = this.game.figures.indexOf(monster);
        const sameDeckMonster = gameManager.monsterAbilityManager.getSameDeckMonster(monster);

        if (sameDeckMonster && gameManager.entityManager.gameplayFigure(sameDeckMonster)) {
          gameManager.monsterAbilityManager.applySameDeck(monster);
        }

        while (
          this.game.figures.some(
            (figure, index) =>
              !figure.off &&
              index < monsterIndex &&
              (figure.getInitiative() > monster.getInitiative() ||
                (figure.getInitiative() === monster.getInitiative() &&
                  figure instanceof Monster &&
                  figure.name.toLowerCase() > monster.name.toLowerCase()))
          )
        ) {
          this.game.figures.splice(monsterIndex, 1);
          monsterIndex--;
          this.game.figures.splice(monsterIndex, 0, monster);
        }
      }

      if (!summon && monster.off) {
        monster.off = false;
      } else if (
        summon &&
        monster.entities.every((entity) => !gameManager.entityManager.isAlive(entity) || entity.summon === SummonState.new)
      ) {
        monster.off = true;
      }

      if (this.game.state === GameState.next && monsterEntity.summon !== SummonState.new) {
        monsterEntity.active =
          monster.active || this.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(monster));
      }
    }

    return monsterEntity;
  }

  spawnMonsterEntity(
    monster: Monster,
    type: MonsterType,
    isAlly: boolean = false,
    isAllied: boolean = false,
    drawExtra: boolean = false,
    summon: boolean = false
  ): MonsterEntity | undefined {
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
      } else if (this.monsterStandeeCount(monster, false) === monsterCount - 1) {
        number = 1;
        while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
          number++;
        }
      } else if (
        this.monsterStandeeCount(monster, false) === 0 &&
        this.monsterStandeeCount(monster, true) === monsterCount - 1 &&
        monster.entities.every((entity) => (gameManager.entityManager.isAlive(entity) || entity.dormant) && entity.type === type)
      ) {
        monster.entities.forEach((entity, index) => {
          entity.number = index + 1;
        });
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
    const index = monster.entities.indexOf(monsterEntity);
    if (index === -1) {
      return;
    }
    monster.entities.splice(index, 1);
    if (
      monster.entities.length === 0 ||
      monster.entities.every((entity) => !gameManager.entityManager.isAlive(entity) && !entity.dormant)
    ) {
      if (!monster.off && this.game.state === GameState.next) {
        if (monster.active) {
          gameManager.turnManager.toggleFigure(monster);
        } else {
          monster.off = true;
        }
      } else {
        monster.off = true;
      }

      if (settingsManager.settings.removeUnusedMonster && monster.entities.length === 0) {
        this.removeMonster(monster);
      }
    }

    // fallback for deaths that did not pass monsterEntityKilled (e.g. older saves)
    if (monsterEntity.dead) {
      this.monsterEntityKilled(monster, monsterEntity);
    }
  }

  private petCaptureItem(item: AdditionalIdentifier): boolean {
    return item.edition === 'fh' && item.name === '247' && (!item.tags || !item.tags.includes(ItemFlags.consumed));
  }

  petCaptureCharacter(): Character | undefined {
    return this.game.figures.find(
      (figure) => figure instanceof Character && figure.progress.equippedItems.some((item) => this.petCaptureItem(item))
    ) as Character | undefined;
  }

  catchMonster(monster: Monster, monsterEntity: MonsterEntity, force: boolean = false) {
    monsterEntity.dead = true;
    this.monsterEntityKilled(monster, monsterEntity);

    if (monster.entities.every((entity) => entity.dead) && monster.active) {
      gameManager.turnManager.toggleFigure(monster);
    }

    if (!this.game.party.pets.some((value) => value.edition === monster.edition && value.name === monster.pet)) {
      this.game.party.pets.push(new PetIdentifier(monster.pet, monster.edition));
      const character = this.petCaptureCharacter();
      if (character && !force) {
        const item = character.progress.equippedItems.find((equippedItem) => this.petCaptureItem(equippedItem));
        if (item) {
          item.tags = item.tags || [];
          item.tags.push(ItemFlags.consumed);
        }
      }
    }
  }

  /**
   * Credit a kill to the figure acting at the moment of death (scenario stats and personal quests).
   * The killer is stored as tag, so a later removal does not count again and a revive can revert it.
   */
  monsterEntityKilled(monster: Monster, monsterEntity: MonsterEntity) {
    if (this.killedTag(monsterEntity)) {
      return;
    }
    const killer = gameManager.scenarioStatsManager.activeKiller();
    monsterEntity.tags.push(
      killer ? [KILLED_TAG, killer.character.edition, killer.character.name, killer.summon ? 'summon' : ''].join(':') : KILLED_TAG
    );
    if (killer) {
      if (settingsManager.settings.scenarioStats) {
        gameManager.scenarioStatsManager.killMonsterEntity(monsterEntity, monster, killer);
      }
      this.trackKillPersonalQuest(killer.character, monster, monsterEntity, 1);
    }
  }

  /** revert a credited kill when a dead monster entity is revived */
  monsterEntityRevived(monster: Monster, monsterEntity: MonsterEntity) {
    const tag = this.killedTag(monsterEntity);
    if (!tag) {
      return;
    }
    monsterEntity.tags = monsterEntity.tags.filter((value) => value !== tag);
    const [, edition, name, summon] = tag.split(':');
    const character = this.game.figures.find(
      (figure) => figure instanceof Character && figure.edition === edition && figure.name === name
    ) as Character | undefined;
    if (character) {
      if (settingsManager.settings.scenarioStats) {
        gameManager.scenarioStatsManager.killMonsterEntity(monsterEntity, monster, { character, summon: summon === 'summon' }, true);
      }
      this.trackKillPersonalQuest(character, monster, monsterEntity, -1);
    }
  }

  private killedTag(monsterEntity: MonsterEntity): string | undefined {
    return monsterEntity.tags.find((tag) => tag === KILLED_TAG || tag.startsWith(KILLED_TAG + ':'));
  }

  private trackKillPersonalQuest(character: Character, monster: Monster, monsterEntity: MonsterEntity, value: number) {
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.kill, monster.name, value);
    if (monsterEntity.type === MonsterType.elite || monsterEntity.type === MonsterType.boss) {
      gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.kill, monsterEntity.type, value);
    }
  }

  canSetLevel(monster: Monster, level: number): boolean {
    return Number.isInteger(level) && level >= 0 && level <= 7;
  }

  setDormant(monster: Monster, dormant: boolean): boolean {
    if (typeof dormant !== 'boolean') {
      return false;
    }
    monster.entities.forEach((entity) => (entity.dormant = dormant));
    return true;
  }

  canSetSummonState(entity: MonsterEntity | Summon, state: SummonState): boolean {
    return entity instanceof MonsterEntity
      ? Object.values(SummonState).includes(state)
      : state === SummonState.new || state === SummonState.true;
  }

  setSummonState(entity: MonsterEntity | Summon, state: SummonState): boolean {
    if (!this.canSetSummonState(entity, state)) {
      return false;
    }
    if (entity instanceof MonsterEntity) {
      entity.summon = state;
    } else {
      entity.state = state;
    }
    return true;
  }

  setLevel(monster: Monster, level: number): boolean {
    if (!this.canSetLevel(monster, level)) {
      return false;
    }
    monster.level = level;

    if (!this.game.scenario || (gameManager.roundManager.firstRound && this.game.state === GameState.draw)) {
      gameManager.monsterAbilityManager.resetMonsterAbilities(monster);
    }

    monster.entities.forEach((monsterEntity) => {
      const stat = this.getStat(monster, monsterEntity.type);

      monsterEntity.level = monster.level;

      let maxHealth: number;
      if (typeof stat.health === 'number') {
        maxHealth = stat.health;
      } else {
        maxHealth = EntityValueFunction(stat.health);
      }

      if (monsterEntity.health === monsterEntity.maxHealth) {
        monsterEntity.health = maxHealth;
      }

      monsterEntity.maxHealth = maxHealth;
      if (monsterEntity.health > monsterEntity.maxHealth) {
        monsterEntity.health = monsterEntity.maxHealth;
      }
    });
    return true;
  }

  private activeStandees(monster: Monster): MonsterEntity[] {
    return monster.entities
      .filter((entity) => gameManager.entityManager.isAlive(entity) && entity.summon !== SummonState.new)
      .sort(this.sortEntities);
  }

  nextActiveStandee(monster: Monster, reverse: boolean = false): MonsterEntity | undefined {
    const entities = this.activeStandees(monster);
    const activeEntity = entities.find((entity) => entity.active);
    if (!activeEntity && reverse && monster.active) {
      return entities[entities.length - 1];
    } else if (activeEntity && !reverse) {
      return activeEntity;
    }
    return undefined;
  }

  stepActiveStandee(monster: Monster, entity: MonsterEntity, reverse: boolean = false) {
    const entities = this.activeStandees(monster);
    this.toggleActive(monster, entity);
    if (reverse) {
      entity.active = true;
    } else {
      const next = entities.slice(entities.indexOf(entity) + 1).find((other) => !other.off);
      if (next) {
        next.active = true;
      }
    }
  }

  activateStandees(monster: Monster) {
    monster.entities.forEach((entity) => {
      if (gameManager.entityManager.isAlive(entity)) {
        entity.active = true;
        entity.off = false;
      }
    });
  }

  toggleActive(monster: Monster, entity: MonsterEntity) {
    if (this.game.state === GameState.next) {
      if (monster.active) {
        entity.active = !entity.active;
        if (monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active)) {
          gameManager.turnManager.toggleFigure(monster);
        }
      } else if (entity.active) {
        entity.active = false;
        if (
          monster.entities.every(
            (monsterEntity) =>
              monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active || monsterEntity.summon === SummonState.new
          )
        ) {
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

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Monster) {
        let abilityCard = gameManager.rpgRules() ? undefined : gameManager.monsterAbilityManager.getAbilityCard(figure);
        if (abilityCard) {
          if (gameManager.monsterAbilityManager.hasBottomActions(figure)) {
            const secondAbilityCard = abilityCard;
            abilityCard = gameManager.monsterAbilityManager.getAbilityCard(figure, true);
            if (
              abilityCard &&
              ((figure.firstActiveAction === 'bottom' && abilityCard.bottomLost) ||
                (figure.firstActiveAction === 'top' && abilityCard.lost))
            ) {
              const index = gameManager.editionManager.abilityCards(figure).indexOf(abilityCard);
              figure.abilities = figure.abilities.filter((number) => number !== index);
              figure.ability -= 1;
            }
            if (
              secondAbilityCard &&
              ((figure.firstActiveAction === 'bottom' && secondAbilityCard.lost) ||
                (figure.firstActiveAction === 'top' && secondAbilityCard.bottomLost))
            ) {
              const index = gameManager.editionManager.abilityCards(figure).indexOf(secondAbilityCard);
              figure.abilities = figure.abilities.filter((number) => number !== index);
              figure.ability -= 1;
            }
          }

          if (
            gameManager.monsterAbilityManager.hasBottomActions(figure) &&
            figure.firstActiveAction &&
            figure.ability >= figure.abilities.length + (figure.abilities.length % 2 === 0 ? -1 : -2)
          ) {
            figure.abilities.splice(0, 1);
            gameManager.monsterAbilityManager.shuffleAbilities(figure);
          } else if ((abilityCard && abilityCard.shuffle) || figure.ability >= figure.abilities.length) {
            gameManager.monsterAbilityManager.shuffleAbilities(figure);
          }
        }

        const entitiesToRemove = figure.entities.filter((entity) => !gameManager.entityManager.isAlive(entity) && !entity.dormant);
        entitiesToRemove.forEach((entity) => this.removeMonsterEntity(figure, entity));

        figure.entities.forEach((entity) => {
          if (entity.tags) {
            entity.tags = entity.tags.filter((tag) => !tag.startsWith('roundAction-'));
          }

          if (entity.summon === SummonState.new) {
            entity.summon = SummonState.true;
          }

          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.types.includes(ConditionType.expire)) {
              if (entityCondition.state === EntityConditionState.normal) {
                entityCondition.lastState = entityCondition.state;
                entityCondition.state = EntityConditionState.expire;
              }
            }
          });
        });

        figure.tags = figure.tags.filter((tag) => !tag.startsWith('roundAction-'));

        figure.off = figure.entities.length === 0;

        if (gameManager.rpgRules()) {
          figure.entities.forEach((entity) => (entity.rpgAction = -1));
          this.applyRpgSpeed(figure, RPG_DEFAULT_SPEED);
        }
      }
    });
  }

  draw() {
    this.game.figures
      .filter((figure) => figure instanceof Monster && !figure.drawExtra)
      .forEach((figure) => {
        if (figure instanceof Monster) {
          if (gameManager.entityManager.gameplayFigure(figure) && gameManager.rpgRules()) {
            if (figure.ability < 0) {
              this.applyRpgSpeed(figure, RPG_DEFAULT_SPEED);
            }
            figure.lastDraw = this.game.round;
          } else if (gameManager.entityManager.gameplayFigure(figure)) {
            figure.ability =
              figure.ability +
              1 +
              this.game.figures.filter(
                (f) =>
                  f instanceof Monster &&
                  (f.name !== figure.name || f.edition !== figure.edition) &&
                  gameManager.editionManager.deckData(f).name === gameManager.editionManager.deckData(figure).name &&
                  gameManager.editionManager.deckData(f).edition === gameManager.editionManager.deckData(figure).edition &&
                  f.drawExtra &&
                  f.ability > -1
              ).length;
            figure.lastDraw = this.game.round;

            if (gameManager.monsterAbilityManager.hasBottomActions(figure)) {
              figure.ability += 1;
            }

            if (figure.ability >= figure.abilities.length) {
              gameManager.monsterAbilityManager.shuffleAbilities(figure);
            }

            if (figure.editionRules === 'bb' && figure.tags.includes('bb-elite')) {
              let nextAbility = figure.ability + 1;
              if (nextAbility >= figure.abilities.length) {
                nextAbility = 0;
              }
              const abilityCards = gameManager.editionManager.deckData(figure).abilities;
              if (abilityCards[figure.abilities[nextAbility]].initiative < abilityCards[figure.abilities[figure.ability]].initiative) {
                const swap = figure.abilities[figure.ability];
                figure.abilities[figure.ability] = figure.abilities[nextAbility];
                figure.abilities[nextAbility] = swap;
              }
            }
          }
        }
      });

    this.game.figures
      .filter((figure) => figure instanceof Monster && figure.drawExtra)
      .forEach((figure) => {
        if (figure instanceof Monster) {
          gameManager.monsterAbilityManager.drawExtra(figure);

          if (figure.ability >= figure.abilities.length) {
            gameManager.monsterAbilityManager.shuffleAbilities(figure);
          }
        }
      });
  }

  canSetRpgSpeed(monster: Monster, speed: number): boolean {
    return (
      gameManager.rpgRules() &&
      this.game.state === GameState.draw &&
      Number.isInteger(speed) &&
      speed >= 0 &&
      speed < gameManager.editionManager.abilityCards(monster).length
    );
  }

  setRpgSpeed(monster: Monster, speed: number): boolean {
    if (!this.canSetRpgSpeed(monster, speed)) {
      return false;
    }
    this.applyRpgSpeed(monster, speed);
    gameManager.roundManager.sortFigures();
    return true;
  }

  private applyRpgSpeed(monster: Monster, speed: number) {
    gameManager.monsterAbilityManager.rpgSameDeck(monster).forEach((figure) => {
      figure.abilities = gameManager.editionManager.abilityCards(figure).map((abilityCard, index) => index);
      if (figure.ability !== speed) {
        figure.entities.forEach((entity) => (entity.rpgAction = -1));
      }
      figure.ability = speed;
      figure.abilityVisible = true;
    });
  }

  rpgActions(monster: Monster): RpgMonsterAction[] {
    return monster.ability > -1
      ? rpgMonsterActions(gameManager.editionManager.abilityCards(monster)[monster.abilities[monster.ability]])
      : [];
  }

  rpgActionEntities(monster: Monster, action: number, entities: MonsterEntity[] = monster.entities): MonsterEntity[] {
    const rpgAction = this.rpgActions(monster)[action];
    return rpgAction
      ? entities.filter((entity) => gameManager.entityManager.isAlive(entity) && (!rpgAction.elite || entity.type === MonsterType.elite))
      : [];
  }

  canSetRpgAction(monster: Monster, action: number, entities: MonsterEntity[] = monster.entities): boolean {
    return (
      gameManager.rpgRules() &&
      this.game.state === GameState.draw &&
      Number.isInteger(action) &&
      this.rpgActionEntities(monster, action, entities).length > 0
    );
  }

  setRpgAction(monster: Monster, action: number, entities: MonsterEntity[] = monster.entities): boolean {
    if (!this.canSetRpgAction(monster, action, entities)) {
      return false;
    }
    const eligible = this.rpgActionEntities(monster, action, entities);
    const value = eligible.every((entity) => entity.rpgAction === action) ? -1 : action;
    eligible.forEach((entity) => (entity.rpgAction = value));
    monster.abilityVisible = true;
    return true;
  }

  sortEntities(a: MonsterEntity, b: MonsterEntity): number {
    if (a.type === MonsterType.elite && b.type === MonsterType.normal) {
      return -1;
    } else if (a.type === MonsterType.normal && b.type === MonsterType.elite) {
      return 1;
    }
    return gameManager.monsterManager.sortEntitiesByNumber(a, b);
  }

  sortEntitiesByNumber(a: MonsterEntity, b: MonsterEntity): number {
    if (a.summon === SummonState.new && b.summon !== SummonState.new) {
      return 1;
    } else if (a.summon !== SummonState.new && b.summon === SummonState.new) {
      return -1;
    } else if (a.summon === SummonState.new && b.summon === SummonState.new) {
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

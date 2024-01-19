import { Game, GameState } from "../model/Game";
import { Monster } from '../model/Monster';
import { gameManager } from "./GameManager";
import { MonsterType } from "../model/data/MonsterType";
import { MonsterStat } from "../model/data/MonsterStat";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterData } from "../model/data/MonsterData";
import { Ability } from "../model/data/Ability";
import { SummonState } from "../model/Summon";
import { settingsManager } from "./SettingsManager";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { ConditionType, EntityConditionState } from "../model/data/Condition";
import { EntityValueFunction } from "../model/Entity";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Action, ActionHint, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { MonsterSpawnData } from "../model/data/ScenarioRule";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";

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
    const stat = monster.stats.find((monsterStat) => {
      return monsterStat.level == monster.level && monsterStat.type == type;
    });
    if (!stat) {
      monster.errors = monster.errors || [];
      if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + monster.name + " level: " + monster.level);
        monster.errors.push(new FigureError(FigureErrorType.stat, "monster", monster.name, monster.edition, type, "" + monster.level));
      }
      return new MonsterStat(type, monster.level, 0, 0, 0, 0);
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

    gameManager.uiChange.emit();

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
    let max = EntityValueFunction(monster.standeeCount || monster.count, monster.level);
    if (monster.standeeShare) {
      const share = gameManager.monstersData(monster.standeeShareEdition || monster.edition).find((value) => value.name == monster.standeeShare);
      if (share) {
        max = EntityValueFunction(share.standeeCount || share.count, monster.level);
      }
    }
    return max;
  }

  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false): MonsterEntity | undefined {
    if (!monster.stats.some((monsterStat) => {
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
        number = Math.floor(Math.random() * monsterCount) + 1;
        while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
          number = Math.floor(Math.random() * monsterCount) + 1;
        }
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

      return this.addMonsterEntity(monster, number, type, summon);
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
    let removeMonster: Monster[] = [];
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
            let roundAction = entity.tags.find((tag) => tag.startsWith('roundAction-'));
            while (roundAction) {
              entity.tags.splice(entity.tags.indexOf(roundAction), 1);
              roundAction = entity.tags.find((tag) => tag.startsWith('roundAction-'));
            }
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

        figure.off = figure.entities.length == 0;

        if (figure.off && settingsManager.settings.removeUnusedMonster) {
          removeMonster.push(figure);
        }
      }
    })

    removeMonster.forEach((monster) => {
      this.removeMonster(monster);
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

  shuffleAbilities(monster: Monster) {
    if (gameManager.game.state == GameState.draw || monster.entities.length == 0) {
      monster.ability = -1;
    } else {
      monster.ability = 0;
    }

    if (monster.drawExtra) {
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Shuffle for '" + monster.name + "' (" + monster.deck + " not possible, not same deck monster found!");
        monster.drawExtra = false;
        this.shuffleAbilities(monster);
        return;
      }
      this.shuffleAbilities(sameDeckMonster);
      return;
    }

    ghsShuffleArray(monster.abilities);

    this.game.figures.filter((figure) => figure instanceof Monster && this.getSameDeckMonster(figure) && this.getSameDeckMonster(figure) == monster).map((figure) => figure as Monster).forEach((figure) => {
      figure.abilities = JSON.parse(JSON.stringify(monster.abilities));
      if (gameManager.game.state == GameState.draw) {
        figure.ability = -1;
      } else {
        figure.ability = monster.ability;

        if (figure.drawExtra) {
          this.drawExtra(figure);
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

  calcActionHints(monster: Monster, entity: MonsterEntity): ActionHint[] {
    let actionHints: ActionHint[] = [];
    const stat = gameManager.monsterManager.getStat(monster, entity.type);
    this.calcActionHint(monster, entity, ActionType.shield, stat.actions, actionHints);
    this.calcActionHint(monster, entity, ActionType.retaliate, stat.actions, actionHints);
    if (gameManager.entityManager.isAlive(entity, true) && (!entity.active || monster.active)) {
      const activeFigure = gameManager.game.figures.find((figure) => figure.active);
      if (monster.active || gameManager.game.state == GameState.next && (!activeFigure || gameManager.game.figures.indexOf(activeFigure) > gameManager.game.figures.indexOf(monster))) {
        let ability = gameManager.monsterManager.getAbility(monster);
        if (ability) {
          this.calcActionHint(monster, entity, ActionType.shield, ability.actions, actionHints);
          this.calcActionHint(monster, entity, ActionType.retaliate, ability.actions, actionHints);
        }
      }
    }

    return actionHints.sort((a, b) => {
      if (a.type == ActionType.shield && b.type != ActionType.shield) {
        return -1;
      } else if (b.type == ActionType.shield && a.type != ActionType.shield) {
        return 1;
      }
      return a.range - b.range;
    });
  }

  calcActionHint(monster: Monster, entity: MonsterEntity, type: ActionType, actions: Action[], actionHints: ActionHint[], parentIndex: number = 0) {
    actions.forEach((action, index) => {
      if (action.type == type && action.value != 'X') {
        let actionHint: ActionHint = { type: type, value: EntityValueFunction(action.value), range: 0 };
        if (action.subActions && action.subActions.length > 0) {
          let rangeSubAction = action.subActions.find((subAction) => subAction.type == ActionType.range && (!subAction.valueType || subAction.valueType == ActionValueType.fixed));
          if (rangeSubAction) {
            actionHint.range = EntityValueFunction(rangeSubAction.value);
          }
        }

        let existingActionHint = actionHints.find((existing) => existing.type == actionHint.type && existing.range == actionHint.range);

        if (existingActionHint) {
          existingActionHint.value += actionHint.value;
        } else {
          actionHints.push(actionHint)
        }
      } else if (action.type == ActionType.monsterType && action.value == entity.type) {
        this.calcActionHint(monster, entity, type, action.subActions, actionHints, index);
      } else if (action.type == ActionType.element && action.valueType == ActionValueType.minus && monster.entities.find((monsterEntity) => monsterEntity.tags.find((tag) => tag == 'roundAction-element-consume-' + index + '-' + parentIndex + '-' + action.value))) {
        this.calcActionHint(monster, entity, type, action.subActions, actionHints, index);
      }
    })
  }
}
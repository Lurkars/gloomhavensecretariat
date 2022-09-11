import { Game, GameState } from "../model/Game";
import { Monster } from '../model/Monster';
import { gameManager } from "./GameManager";
import { MonsterType } from "../model/MonsterType";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterData } from "../model/data/MonsterData";
import { Ability } from "../model/Ability";
import { SummonState } from "../model/Summon";
import { settingsManager } from "./SettingsManager";
import { FigureError, FigureErrorType } from "../model/FigureError";
import { ConditionType, EntityConditionState } from "../model/Condition";

export class MonsterManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  monsterThumbnail(monsterData: MonsterData) {
    if (monsterData.thumbnailUrl) {
      return monsterData.thumbnailUrl;
    }

    if (!monsterData.thumbnail) {
      monsterData.thumbnail = monsterData.edition + '-' + monsterData.name;
    }
    return './assets/images/monster/thumbnail/' + monsterData.thumbnail + '.png';
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

  addMonster(monsterData: MonsterData): Monster {
    let monster: Monster | undefined = this.game.figures.find((figure) =>
      figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition) as Monster;
    if (!monster) {
      monster = new Monster(monsterData);
      monster.level = gameManager.game.level;
      monster.off = true;
      if (!this.applySameDeck(monster)) {
        if (!monster.abilities || monster.abilities.length == 0) {
          const abilities = gameManager.abilities(monster);
          monster.abilities = abilities.filter((ability) => isNaN(+ability.level) || +ability.level <= (monster && monster.level || 0)).map((ability) => abilities.indexOf(ability));
        }
        this.shuffleAbilities(monster);
      }
      this.game.figures.push(monster);
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures();
      }

    }

    return monster;
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

  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false) {
    if (!monster.stats.some((monsterStat) => {
      return monsterStat.type == type;
    })) {
      monster.errors = monster.errors || [];
      if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.monsterType)) {
        console.error("Missing type '" + type + "' for " + monster.name);
        monster.errors.push(new FigureError(FigureErrorType.monsterType, "monster", monster.name, monster.edition, type));
      }
      return;
    }

    let monsterEntity: MonsterEntity = new MonsterEntity(number, type, monster);

    if (summon) {
      monsterEntity.summon = SummonState.new;
    }
    monster.entities.push(monsterEntity);

    if (this.game.state == GameState.next && monster.ability == -1) {
      if (!this.applySameDeck(monster)) {
        monster.ability = 0;
      } else if (monster.ability == -1) {
        monster.ability = 0;
      }
    }

    if (this.game.state == GameState.next && monster.entities.filter((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0).length == 1) {
      gameManager.sortFigures();
    }

    if (monster.off) {
      monster.off = false;
      if (this.game.state == GameState.next) {
        monster.active = !gameManager.game.figures.some((figure) => figure.active);
      }
    }

    if (this.game.state == GameState.next) {
      monsterEntity.active = monsterEntity.active || gameManager.game.figures.some((figure) => figure.active && figure.getInitiative() > monster.getInitiative());
      monsterEntity.off = false;
    }
  }

  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
    if (monster.entities.length == 0 || monster.entities.every((entity) => entity.dead || entity.health <= 0)) {
      if (!monster.off && gameManager.game.state == GameState.next) {
        gameManager.roundManager.toggleFigure(monster);
        monster.active = false;
      } else {
        monster.off = true;
      }
    }
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
        if (monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0 || !monsterEntity.active)) {
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

        if (settingsManager.settings.expireConditions) {
          figure.entities.forEach((monsterEntity) => {
            monsterEntity.entityConditions = monsterEntity.entityConditions.filter((entityCondition) => !entityCondition.expired);
          });
        }

        if (settingsManager.settings.applyConditions) {
          figure.entities.forEach((monsterEntity) => {
            monsterEntity.entityConditions.filter((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => entityCondition.state = EntityConditionState.normal);
          });
        }

        figure.entities = figure.entities.filter((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0);

        figure.off = figure.entities.length == 0;
      }
    })
  }

  draw() {
    this.game.figures.filter((figure) => figure instanceof Monster && !figure.drawExtra).forEach((figure) => {
      if (figure instanceof Monster) {
        if (figure.entities.length > 0 && figure.entities.some((entity) => !entity.dead && entity.health > 0)) {
          figure.ability = figure.ability + 1 + this.game.figures.filter((f) => f instanceof Monster && (f.name != figure.name || f.edition != figure.edition) && gameManager.deckData(f).name == gameManager.deckData(figure).name && gameManager.deckData(f).edition == gameManager.deckData(figure).edition && f.drawExtra && f.ability > -1).length;

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

    monster.abilities = monster.abilities
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

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

    this.game.figures.forEach((figure) => {
      if (figure instanceof Monster && this.getSameDeckMonster(figure)) {
        figure.ability = monster.ability;

        if (figure.drawExtra) {
          this.drawExtra(figure);
        }
      }
    })
  }

  getAbility(monster: Monster): Ability | undefined {
    if (monster.ability < 0 || monster.ability >= monster.abilities.length) {
      return undefined;
    }

    const abilities = gameManager.abilities(monster);

    if (!abilities) {
      return undefined;
    }

    return abilities[ monster.abilities[ monster.ability ] ]
  }
}
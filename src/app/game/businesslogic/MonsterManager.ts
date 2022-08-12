import { Game, GameState } from "../model/Game";
import { Monster } from '../model/Monster';
import { Figure } from "../model/Figure";
import { gameManager } from "./GameManager";
import { MonsterType } from "../model/MonsterType";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterData } from "../model/data/MonsterData";
import { Ability } from "../model/Ability";
import { SummonState } from "../model/Summon";
import { settingsManager } from "./SettingsManager";
import { FigureError } from "../model/FigureError";
import { ConditionType, EntityCondition, EntityConditionState } from "../model/Condition";

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
    const stat = monster.stats.find((monsterStat: MonsterStat) => {
      return monsterStat.level == monster.level && monsterStat.type == type;
    });
    if (!stat) {
      console.error("Could not find '" + type + "' stats for monster: " + monster.name + " level: " + monster.level);
      if (monster.errors.indexOf(FigureError.stat) == -1) {
        monster.errors.push(FigureError.stat);
      }
      return new MonsterStat(type, monster.level, 0, 0, 0, 0);
    }
    return stat;
  }

  addMonster(monsterData: MonsterData) {
    if (!this.game.figures.some((figure: Figure) => {
      return figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition;
    })) {
      const monster: Monster = new Monster(monsterData);
      monster.level = gameManager.game.level;
      monster.off = true;
      if (!this.applySameDeck(monster)) {
        if (!monster.abilities || monster.abilities.length == 0) {
          const abilities = gameManager.abilities(monster);
          monster.abilities = abilities.filter((ability: Ability) => isNaN(+ability.level) || +ability.level <= monster.level).map((ability: Ability) => abilities.indexOf(ability));
        }
        this.shuffleAbilities(monster);
      }
      this.game.figures.push(monster);
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures();
      }
    }
  }

  removeMonster(monster: Monster) {
    monster.entities = [];
    this.game.figures.splice(this.game.figures.indexOf(monster), 1);

    if (!monster.drawExtra) {
      this.game.figures.forEach((figure: Figure) => {
        if (figure instanceof Monster && figure.drawExtra && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition) {
          if (!this.getSameDeckMonster(figure)) {
            figure.drawExtra = false;
          }
        }
      })
    }
  }


  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false) {
    if (!monster.stats.some((monsterStat: MonsterStat) => {
      return monsterStat.type == type;
    })) {
      console.error("Missing type '" + type + "' for " + monster.name);
      if (monster.errors.indexOf(FigureError.monsterType) == -1) {
        monster.errors.push(FigureError.monsterType);
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

    if (monster.entities.filter((monsterEntity: MonsterEntity) => !monsterEntity.dead && monsterEntity.health > 0).length == 1) {
      gameManager.sortFigures();
    }

    if (monster.off) {
      monster.off = false;
      if (this.game.state == GameState.next) {
        monster.active = !gameManager.game.figures.some((figure: Figure) => figure.active);
      }
    }
  }

  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
    if (monster.entities.length == 0) {
      if (!monster.off && gameManager.game.state == GameState.next) {
        gameManager.toggleFigure(monster);
        monster.active = false;
      } else {
        monster.off = true;
      }
    }
  }

  getSameDeckMonster(monster: Monster): Monster | undefined {
    return this.game.figures.find((figure: Figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && !figure.drawExtra) as Monster | undefined;
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

      monster.ability = sameDeckMonster.ability + 1 + this.game.figures.filter((figure: Figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && figure.drawExtra && figure.ability > sameDeckMonster.ability).length;

      if (monster.ability >= monster.abilities.length) {
        this.shuffleAbilities(monster);
      }
    } else {
      this.applySameDeck(monster);
    }
  }

  next() {
    this.game.figures.forEach((figure: Figure, index: number) => {
      if (figure instanceof Monster) {
        const ability = this.getAbility(figure);
        if (ability) {
          if (ability.shuffle || figure.ability >= figure.abilities.length) {
            this.shuffleAbilities(figure);
          }
        }

        if (settingsManager.settings.expireConditions) {
          figure.entities.forEach((monsterEntity: MonsterEntity) => {
            monsterEntity.entityConditions = monsterEntity.entityConditions.filter((entityCondition: EntityCondition) => !entityCondition.expired);
          });
        }

        if (settingsManager.settings.applyConditions) {
          figure.entities.forEach((monsterEntity: MonsterEntity) => {
            monsterEntity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition: EntityCondition) => entityCondition.state = EntityConditionState.normal);
          });
        }

        figure.entities = figure.entities.filter((monsterEntity: MonsterEntity) => !monsterEntity.dead && monsterEntity.health > 0);

        figure.off = figure.entities.length == 0;
      }
    })
  }

  draw() {
    this.game.figures.filter((figure: Figure) => figure instanceof Monster && !figure.drawExtra).forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        if (figure.entities.length > 0) {
          figure.ability = figure.ability + 1 + this.game.figures.filter((f: Figure) => f instanceof Monster && (f.name != figure.name || f.edition != figure.edition) && gameManager.deckData(f).name == gameManager.deckData(figure).name && gameManager.deckData(f).edition == gameManager.deckData(figure).edition && f.drawExtra && f.ability > -1).length;

          if (figure.ability >= figure.abilities.length) {
            this.shuffleAbilities(figure);
          }
        }
      }
    });

    this.game.figures.filter((figure: Figure) => figure instanceof Monster && figure.drawExtra).forEach((figure: Figure) => {
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

    this.game.figures.filter((figure: Figure) => figure instanceof Monster && this.getSameDeckMonster(figure) && this.getSameDeckMonster(figure) == monster).map((figure: Figure) => figure as Monster).forEach((figure: Monster) => {
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

    this.game.figures.forEach((figure: Figure) => {
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
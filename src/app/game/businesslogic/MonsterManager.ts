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

export class MonsterManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  monsterThumbnail(monsterData: MonsterData) {
    if (monsterData.thumbnail) {
      return monsterData.thumbnail;
    }
    return './assets/images/monster/thumbnail/' + monsterData.edition + '-' + monsterData.name + '.png';
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
          monster.abilities = gameManager.abilities(monster).map((ability: Ability, index: number) => index);
        }
        this.shuffleAbilities(monster);
      }
      this.game.figures.push(monster);
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
          } else {
            this.drawExtra(figure);
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
      }
    }

    gameManager.sortFigures();

    if (monster.off) {
      monster.off = false;
      monster.active = false;
    }

  }

  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
    if (monster.entities.length == 0) {
      if (!monster.off && gameManager.game.state == GameState.next) {
        gameManager.toggleOff(monster);
        monster.active = false;
      } else {
        monster.off = true;
      }
      gameManager.sortFigures();
    }
  }

  getSameDeckMonster(monster: Monster): Monster | undefined {
    return this.game.figures.find((figure: Figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && !figure.drawExtra) as Monster | undefined;
  }

  applySameDeck(monster: Monster): boolean {
    const sameDeckMonster = this.getSameDeckMonster(monster);

    if (sameDeckMonster) {
      monster.abilities = sameDeckMonster.abilities;
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
        monster.ability = 0;
        return;
      }

      monster.ability = sameDeckMonster.ability + 1 + this.game.figures.filter((figure: Figure) => figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition && figure.drawExtra && figure.ability > sameDeckMonster.ability).length;
    } else {
      this.applySameDeck(monster);
    }
  }

  async draw() {
    this.game.figures.forEach((figure: Figure, index: number) => {
      if (figure instanceof Monster) {
        if (!this.applySameDeck(figure)) {
          const ability = this.getAbility(figure);
          if (ability) {
            if (ability.shuffle || figure.ability == figure.abilities.length - 1) {
              this.shuffleAbilities(figure);
            }
          }
        }

        if (settingsManager.settings.expireConditions) {
          figure.entities.forEach((monsterEntity: MonsterEntity) => {
            monsterEntity.expiredConditions = [];
          });
        }

        figure.off = figure.entities.length == 0;
      }
    })
  }

  async next() {
    this.game.figures.filter((figure: Figure) => figure instanceof Monster && !figure.drawExtra).forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        if (figure.entities.length > 0) {
          figure.ability = figure.ability + 1 + this.game.figures.filter((f: Figure) => f instanceof Monster && (f.name != figure.name || f.edition != figure.edition) && gameManager.deckData(f).name == gameManager.deckData(figure).name && gameManager.deckData(f).edition == gameManager.deckData(figure).edition && f.drawExtra).length;

          if (figure.ability == figure.abilities.length) {
            this.shuffleAbilities(figure);
          }
        }
      }
    });

    this.game.figures.filter((figure: Figure) => figure instanceof Monster && figure.drawExtra).forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        this.drawExtra(figure);
      }
    });
  }


  shuffleAbilities(monster: Monster) {
    if (gameManager.game.state == GameState.draw) {
      monster.ability = -1;
    } else {
      monster.ability = 0;
      if (monster.drawExtra) {
        monster.ability = 1;
      }
    }
    monster.abilities = monster.abilities
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Monster && (figure.name != monster.name || figure.edition != monster.edition) && gameManager.deckData(figure).name == gameManager.deckData(monster).name && gameManager.deckData(figure).edition == gameManager.deckData(monster).edition) {
        figure.abilities = monster.abilities;
        figure.ability = monster.drawExtra ? monster.ability - 1 : monster.ability;

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

    return gameManager.abilities(monster)[ monster.abilities[ monster.ability ] ]
  }

}
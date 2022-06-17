import { Game, GameState } from "../model/Game";
import { Monster } from '../model/Monster';
import { Figure } from "../model/Figure";
import { gameManager } from "./GameManager";
import { MonsterType } from "../model/MonsterType";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterData } from "../model/data/MonsterData";
import { Condition, RoundCondition } from "../model/Condition";
import { Ability } from "../model/Ability";
import { SummonState } from "../model/Summon";
import { settingsManager } from "./SettingsManager";

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
    if (this.game.figures.some((element: Figure) => {
      return element.name == monsterData.name;
    })) {
      return;
    }
    const monster: Monster = new Monster(monsterData);
    monster.level = gameManager.game.level;
    monster.off = true;
    this.game.figures.push(monster);
  }

  removeMonster(monster: Monster) {
    monster.entities = [];
    this.shuffleAbilities(monster);
    this.game.figures.splice(this.game.figures.indexOf(monster), 1);
  }


  addMonsterEntity(monster: Monster, number: number, type: MonsterType, summon: boolean = false) {
    if (!monster.stats.some((element: MonsterStat) => {
      return element.type == type;
    })) {
      throw Error("Missing type '" + type + "' for " + monster.name);
    }

    let monsterEntity: MonsterEntity = new MonsterEntity(number, type, monster);

    if (summon) {
      monsterEntity.summon = SummonState.new;
    }
    monster.entities.push(monsterEntity);

    if (this.game.state == GameState.next && monster.ability == -1) {
      monster.ability = 0;
    }

    if (monster.off) {
      monster.off = false;
      monster.active = false;
    }
  }


  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
    if (monster.entities.length == 0) {
      if (!monster.off && gameManager.game.state == GameState.next) {
        monster.active = true;
        gameManager.toggleOff(monster);
      } else {
        monster.off = true;
      }
    }
  }

  async draw() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        const ability = this.getAbility(figure);
        if (ability) {
          if (ability.shuffle || figure.ability == figure.abilities.length - 1) {
            this.shuffleAbilities(figure);
          }
        }
        figure.off = figure.entities.length == 0;

        figure.entities.forEach((monsterEntity: MonsterEntity) => {

          if (monsterEntity.summon == SummonState.new) {
            monsterEntity.summon = SummonState.true;
          }

          if (settingsManager.settings.expireConditions) {
            for (let roundCondition in RoundCondition) {
              if (monsterEntity.conditions.indexOf(roundCondition as Condition) != -1 && monsterEntity.turnConditions.indexOf(roundCondition as Condition) == -1) {
                monsterEntity.turnConditions.push(roundCondition as Condition);
              } else if (monsterEntity.turnConditions.indexOf(roundCondition as Condition) != -1) {
                monsterEntity.conditions.splice(monsterEntity.conditions.indexOf(roundCondition as Condition), 1);
                monsterEntity.turnConditions.splice(monsterEntity.turnConditions.indexOf(roundCondition as Condition), 1);
              }
            }
          }
        })
      }
    })
  }

  async next() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        if (figure.entities.length > 0) {
          figure.ability = figure.ability + 1;
          if (figure.ability == figure.abilities.length) {
            this.shuffleAbilities(figure);
          }
        }
      }
    });
  }


  shuffleAbilities(monster: Monster) {
    if (gameManager.game.state == GameState.draw) {
      monster.ability = -1;
    } else {
      monster.ability = 0;
    }
    monster.abilities = monster.abilities
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  getAbility(monster: Monster): Ability | undefined {
    if (monster.ability < 0 || monster.ability >= monster.abilities.length) {
      return undefined;
    }

    return gameManager.abilities(monster.deck, monster.edition)[ monster.abilities[ monster.ability ] ]
  }

}
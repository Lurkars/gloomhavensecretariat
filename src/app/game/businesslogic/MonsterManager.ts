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

export class MonsterManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
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
    if (!this.game.figures.some((element: Figure) => {
      return element.name == monster.name;
    })) {
      return;
    }

    monster.entities = [];
    this.shuffleAbilities(monster);
    this.game.figures.splice(this.game.figures.indexOf(monster), 1);
  }


  addMonsterEntity(monster: Monster, number: number, type: MonsterType) {
    if (!monster.stats.some((element: MonsterStat) => {
      return element.type == type;
    })) {
      return;
    }

    monster.entities.push(new MonsterEntity(number, type, monster));

    if (this.game.state == GameState.next && !monster.ability) {
      const randomAbilityIndex = Math.floor(Math.random() * monster.availableAbilities.length);
      const abilityIndex = monster.availableAbilities[ randomAbilityIndex ];
      monster.ability = gameManager.abilities(monster.deck, monster.edition)[ abilityIndex ];
      monster.availableAbilities.splice(randomAbilityIndex, 1);
      monster.discardedAbilities.push(abilityIndex);
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
        if (figure.ability) {
          if (figure.ability.shuffle || figure.availableAbilities.length == 0) {
            this.shuffleAbilities(figure);
          }
          figure.ability = undefined;
        }
        figure.off = figure.entities.length == 0;

        figure.entities.forEach((monsterEntity: MonsterEntity) => {
          for (let roundCondition in RoundCondition) {
            if (monsterEntity.conditions.indexOf(roundCondition as Condition) != -1 && monsterEntity.turnConditions.indexOf(roundCondition as Condition) == -1) {
              monsterEntity.turnConditions.push(roundCondition as Condition);
            } else if (monsterEntity.turnConditions.indexOf(roundCondition as Condition) != -1) {
              monsterEntity.conditions.splice(monsterEntity.conditions.indexOf(roundCondition as Condition), 1);
              monsterEntity.turnConditions.splice(monsterEntity.turnConditions.indexOf(roundCondition as Condition), 1);
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
          const randomAbilityIndex = Math.floor(Math.random() * figure.availableAbilities.length);
          const abilityIndex = figure.availableAbilities[ randomAbilityIndex ];
          figure.ability = gameManager.abilities(figure.deck, figure.edition)[ abilityIndex ];
          figure.availableAbilities.splice(randomAbilityIndex, 1);
          figure.discardedAbilities.push(abilityIndex);
        }
      }
    });
  }


  shuffleAbilities(monster: Monster) {
    monster.availableAbilities = gameManager.abilities(monster.deck, monster.edition).map((value: Ability, index: number) => index);
    monster.discardedAbilities = [];
  }

}
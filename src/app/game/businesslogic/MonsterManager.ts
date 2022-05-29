import { Game, GameState } from "../model/Game";

import { Monster } from '../model/Monster';
import { Figure } from "../model/Figure";
import { gameManager } from "./GameManager";
import { MonsterType } from "../model/MonsterType";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterData } from "../model/data/MonsterData";
import { Condition, RoundCondition } from "../model/Condition";
import { MonsterAbility } from "../model/MonsterAbility";

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
    this.game.figures.push(monster);
  }

  removeMonster(monster: Monster) {
    if (!this.game.figures.some((element: Figure) => {
      return element.name == monster.name;
    })) {
      return;
    }

    monster.entities = [];
    monster.off = true;
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
      monster.ability = monster.abilities[ abilityIndex ];
      monster.availableAbilities.splice(randomAbilityIndex, 1);
      monster.discardedAbilities.push(abilityIndex);
    }

    monster.off = false;
  }


  removeMonsterEntity(monster: Monster, monsterEntity: MonsterEntity) {
    monster.entities.splice(monster.entities.indexOf(monsterEntity), 1);
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
        figure.off = false;

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
          figure.ability = figure.abilities[ abilityIndex ];
          figure.availableAbilities.splice(randomAbilityIndex, 1);
          figure.discardedAbilities.push(abilityIndex);
        }
      }
    });
  }


  shuffleAbilities(monster: Monster) {
    monster.availableAbilities = monster.abilities.map((value: MonsterAbility, index: number) => index);
    monster.discardedAbilities = [];
  }

}
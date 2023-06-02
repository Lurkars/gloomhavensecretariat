import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Character } from 'src/app/game/model/Character';
import { Subscription } from 'rxjs';
import { EntityCondition, EntityConditionState } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { ghsValueSign } from 'src/app/ui/helper/Static';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/data/AttackModifier';

@Component({
  selector: 'ghs-event-effects',
  templateUrl: './event-effects.html',
  styleUrls: ['./event-effects.scss']
})
export class EventEffectsDialog implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;

  characters: Character[] = [];
  activeCharacters: Character[] = [];
  entityConditions: EntityCondition[] = [];
  health: number[] = [];
  experience: number[] = [];
  gold: number[] = [];
  battleGoals: number[] = [];
  bless: number = 0;
  curse: number = 0;

  constructor(@Inject(DIALOG_DATA) public menu: boolean = false, public dialogRef: DialogRef) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    this.close();
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
    this.activeCharacters = this.characters.filter((character) => !character.absent);

    this.activeCharacters.forEach((character, index, self) => {
      character.entityConditions.forEach((entityCondition) => {
        if (!this.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
          this.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
        }
      })
    })
  }

  toggleCharacter(character: Character) {
    if (this.activeCharacters.indexOf(character) == -1) {
      this.activeCharacters.push(character);
    } else {
      this.activeCharacters.splice(this.activeCharacters.indexOf(character), 1);
    }
  }

  changeHealth(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.health[i] = this.health[i] || 0;
      this.health[i] += value;

      if (character.health + this.health[i] > character.maxHealth) {
        this.health[i] = EntityValueFunction(character.maxHealth) - character.health;
      } else if (character.health + this.health[i] < 0) {
        this.health[i] = - character.health;
      }
    });
  }

  minHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.min(a, b));
  }

  maxHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.max(a, b));
  }

  changeExperience(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.experience[i] = this.experience[i] || 0;
      this.experience[i] += value;
      if (character.progress.experience + this.experience[i] < 0) {
        this.experience[i] = - character.progress.experience;
      }
    });
  }

  minExperience(): number {
    if (this.experience.length == 0) {
      this.experience[0] = 0;
    }
    return this.experience.reduce((a, b) => Math.min(a, b));
  }

  maxExperience(): number {
    if (this.experience.length == 0) {
      this.experience[0] = 0;
    }
    return this.experience.reduce((a, b) => Math.max(a, b));
  }

  changeGold(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.gold[i] = this.gold[i] || 0;
      this.gold[i] += value;
      if (character.progress.gold + this.gold[i] < 0) {
        this.gold[i] = - character.progress.gold;
      }
    });
  }

  minGold(): number {
    if (this.gold.length == 0) {
      this.gold[0] = 0;
    }
    return this.gold.reduce((a, b) => Math.min(a, b));
  }

  maxGold(): number {
    if (this.gold.length == 0) {
      this.gold[0] = 0;
    }
    return this.gold.reduce((a, b) => Math.max(a, b));
  }

  changeBattleGoals(value: number) {
    this.activeCharacters.forEach((character, i) => {
      this.battleGoals[i] = this.battleGoals[i] || 0;
      this.battleGoals[i] += value;
      if (character.progress.battleGoals + this.battleGoals[i] < 0) {
        this.battleGoals[i] = - character.progress.battleGoals;
      }

      if (this.battleGoals[i] < -(character.progress.battleGoals % 3)) {
        this.battleGoals[i] = -(character.progress.battleGoals % 3);
      }
    });
  }

  minBattleGoals(): number {
    if (this.battleGoals.length == 0) {
      this.battleGoals[0] = 0;
    }
    return this.battleGoals.reduce((a, b) => Math.min(a, b));
  }

  maxBattleGoals(): number {
    if (this.battleGoals.length == 0) {
      this.battleGoals[0] = 0;
    }
    return this.battleGoals.reduce((a, b) => Math.max(a, b));
  }

  changeBless(value: number) {
    this.bless += value;
    const count = gameManager.attackModifierManager.countUpcomingBlesses();
    if (count + this.bless < 0) {
      this.bless = -count;
    } else if (count + this.bless > 10) {
      this.bless = 10 - count;
    }
  }

  changeCurse(value: number) {
    this.curse += value;
    const count = gameManager.attackModifierManager.countUpcomingCurses(false);
    if (count + this.curse < 0) {
      this.curse = -count;
    } else if (count + this.curse > 10) {
      this.curse = 10 - count;
    }
  }

  changeConditions(entityConditions: EntityCondition[]) {
    this.entityConditions = entityConditions;
  }

  close() {
    this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach((entityCondition) => {
      gameManager.stateManager.before(entityCondition.state == EntityConditionState.removed ? "removeCondition" : "addCondition", "game.condition." + entityCondition.name, 'allCharacters');
      this.activeCharacters.find((character) => {
        if (entityCondition.state == EntityConditionState.removed) {
          gameManager.entityManager.removeCondition(character, entityCondition);
        } else {
          gameManager.entityManager.addCondition(character, entityCondition, character.active, character.off);
        }
      })
      gameManager.stateManager.after();
    })

    this.entityConditions.forEach((condition) => {
      if (this.activeCharacters.find((character) => character.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired && entityCondition.value != condition.value))) {
        gameManager.stateManager.before("setConditionValue", "game.condition." + condition.name, "" + condition.value, 'allCharacters');
        this.activeCharacters.find((character) => {
          const entityCondition = character.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
          if (entityCondition && entityCondition.value != condition.value) {
            entityCondition.value = condition.value;
          }
        })
        gameManager.stateManager.after();
      }
    })

    if (this.minHealth() != 0 || this.maxHealth() != 0) {
      gameManager.stateManager.before("changeCharacterHP", ghsValueSign(this.minHealth() != 0 ? this.minHealth() : this.maxHealth()));
      this.activeCharacters.forEach((character, i) => {
        if (this.health[i] && this.health[i] != 0) {
          gameManager.entityManager.changeHealth(character, this.health[i]);
          this.health[i] = 0;
        }

        if (character.maxHealth > 0 && character.health <= 0 || character.exhausted) {
          character.exhausted = true;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.minExperience() != 0 || this.maxExperience() != 0) {
      gameManager.stateManager.before("changeCharacterXP", ghsValueSign(this.minExperience() != 0 ? this.minExperience() : this.maxExperience()));
      this.activeCharacters.forEach((character, i) => {
        if (this.experience[i] && this.experience[i] != 0) {
          character.progress.experience += this.experience[i];
          this.experience[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.minGold() != 0 || this.maxGold() != 0) {
      gameManager.stateManager.before("changeCharacterGold", ghsValueSign(this.minGold() != 0 ? this.minGold() : this.maxGold()));
      this.activeCharacters.forEach((character, i) => {
        if (this.gold[i] && this.gold[i] != 0) {
          character.progress.gold += this.gold[i];
          this.gold[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.minBattleGoals() != 0 || this.maxBattleGoals() != 0) {
      gameManager.stateManager.before("changeCharacterBattleGoals", ghsValueSign(this.minBattleGoals() != 0 ? this.minBattleGoals() : this.maxBattleGoals()));
      this.activeCharacters.forEach((character, i) => {
        if (this.battleGoals[i] && this.battleGoals[i] != 0) {
          character.progress.battleGoals += this.battleGoals[i];
          this.battleGoals[i] = 0;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.bless != 0) {
      gameManager.stateManager.before("changeCharacterBless", ghsValueSign(this.bless));
      let count = Math.abs(this.bless);
      let index = 0;

      while (count > 0) {
        const chararacter = this.activeCharacters[index % this.activeCharacters.length];

        if (this.bless < 0) {
          let card = chararacter.attackModifierDeck.cards.find((attackModifier, index) => {
            return attackModifier.type == AttackModifierType.bless && index > chararacter.attackModifierDeck.current;
          });
          if (card) {
            chararacter.attackModifierDeck.cards.splice(chararacter.attackModifierDeck.cards.indexOf(card), 1);
            count--;
          }
        } else {
          gameManager.attackModifierManager.addModifier(chararacter.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
          count--;
        }
        index++;
      }
      gameManager.stateManager.after();
    }

    if (this.curse != 0) {
      gameManager.stateManager.before("changeCharacterCurse", ghsValueSign(this.curse));
      let count = Math.abs(this.curse);
      let index = 0;

      while (count > 0) {
        const chararacter = this.activeCharacters[index % this.activeCharacters.length];

        if (this.curse < 0) {
          let card = chararacter.attackModifierDeck.cards.find((attackModifier, index) => {
            return attackModifier.type == AttackModifierType.curse && index > chararacter.attackModifierDeck.current;
          });
          if (card) {
            chararacter.attackModifierDeck.cards.splice(chararacter.attackModifierDeck.cards.indexOf(card), 1);
            count--;
          }
        } else {
          gameManager.attackModifierManager.addModifier(chararacter.attackModifierDeck, new AttackModifier(AttackModifierType.curse));
          count--;
        }
        index++;
      }
      gameManager.stateManager.after();
    }
  }
}
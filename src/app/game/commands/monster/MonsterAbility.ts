import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { deckMoveCard, deckTargetValid, findMonster, validSeed } from 'src/app/game/commands/CommandHelper';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';

abstract class MonsterAbilityCommandImpl extends CommandImpl {
  monster(): Monster | undefined {
    return findMonster(this.parameters[0]);
  }

  abilityIndex(cardId: BASE_TYPE | undefined): number {
    const monster = this.monster();
    if (!monster || typeof cardId !== 'number') {
      return -1;
    }
    const abilityCards = gameManager.abilityCards(monster);
    return monster.abilities.findIndex((ability) => abilityCards[ability] && abilityCards[ability].cardId === cardId);
  }
}

export class MonsterAbilityShuffleCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.shuffle';
  requiredParameters: number = 2;

  validParameters(figureId: string, seed: number, upcoming: boolean = false): boolean {
    return !!this.monster() && typeof upcoming === 'boolean' && validSeed(seed);
  }

  executeWithParameters(figureId: string, seed: number, upcoming: boolean = false) {
    const monster = this.monster();
    if (monster) {
      gameManager.game.seed = seed;
      gameManager.monsterManager.shuffleAbilities(monster, upcoming);
      gameManager.sortFigures();
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityDrawCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.draw';
  requiredParameters: number = 2;

  validParameters(id: string | number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.monster();
  }

  executeWithParameters(id: string | number, seed: number) {
    gameManager.game.seed = seed;
    const monster = this.monster();
    if (monster) {
      gameManager.monsterManager.drawAbility(monster);
      gameManager.sortFigures();
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityDrawExtraCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.drawExtra';
  requiredParameters: number = 2;

  validParameters(figureId: string, drawExtra: boolean): boolean {
    return !!this.monster() && typeof drawExtra === 'boolean';
  }

  executeWithParameters(figureId: string, drawExtra: boolean) {
    const monster = this.monster();
    if (monster) {
      if (!drawExtra) {
        monster.drawExtra = false;
        gameManager.monsterManager.applySameDeck(monster);
      } else {
        monster.drawExtra = true;
        if (gameManager.game.state === GameState.next) {
          gameManager.monsterManager.drawExtra(monster);
        }
        gameManager.sortFigures();
      }
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityMoveCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.move';
  requiredParameters: number = 4;

  validParameters(figureId: string, cardId: number, toList: string, toIndex: number): boolean {
    return this.abilityIndex(cardId) !== -1 && deckTargetValid(toList, toIndex);
  }

  executeWithParameters(figureId: string, cardId: number, toList: string, toIndex: number) {
    const monster = this.monster();
    if (monster) {
      const result = deckMoveCard(
        monster.ability,
        this.abilityIndex(cardId),
        toList,
        toIndex,
        monster.abilities,
        monster.revealedAbilities
      );
      monster.ability = result.current;
      const sameDeckMonster = gameManager.monsterManager.getSameDeckMonster(monster);
      if (sameDeckMonster) {
        gameManager.monsterManager.applySameDeck(sameDeckMonster);
      }
      gameManager.sortFigures();
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityRestoreDefaultCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.restoreDefault';
  requiredParameters: number = 2;

  validParameters(id: string | number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.monster();
  }

  executeWithParameters(id: string | number, seed: number) {
    gameManager.game.seed = seed;
    const monster = this.monster();
    if (monster) {
      gameManager.monsterManager.restoreDefaultAbilities(monster);
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityRemoveCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.remove';
  requiredParameters: number = 2;

  validParameters(figureId: string, cardId: number): boolean {
    return this.abilityIndex(cardId) !== -1;
  }

  executeWithParameters(figureId: string, cardId: number) {
    const monster = this.monster();
    if (monster) {
      gameManager.monsterManager.removeAbility(monster, this.abilityIndex(cardId));
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAbilityRestoreCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.restore';
  requiredParameters: number = 2;

  abilityCard(monster: Monster, cardId: BASE_TYPE): AbilityCard | undefined {
    const deckData = gameManager.deckData(monster);
    return deckData.abilities.find((abilityCard, index) => abilityCard.cardId === cardId && !monster.abilities.includes(index));
  }

  validParameters(figureId: string, cardId: number): boolean {
    const monster = this.monster();
    return !!monster && !!this.abilityCard(monster, cardId);
  }

  executeWithParameters(figureId: string, cardId: number) {
    const monster = this.monster();
    const abilityCard = monster && this.abilityCard(monster, cardId);
    if (monster && abilityCard) {
      gameManager.monsterManager.restoreAbility(monster, abilityCard);
    } else {
      this.executionError('monster or ability card not found');
    }
  }
}

export class MonsterAbilityRevealedCommand extends MonsterAbilityCommandImpl {
  id: string = 'monster.ability.revealed';
  requiredParameters: number = 3;

  validParameters(figureId: string, cardId: number, revealed: boolean): boolean {
    const monster = this.monster();
    const index = this.abilityIndex(cardId);
    return !!monster && index !== -1 && typeof revealed === 'boolean' && !!monster.revealedAbilities[index] !== revealed;
  }

  executeWithParameters(figureId: string, cardId: number, revealed: boolean) {
    const monster = this.monster();
    if (monster) {
      const index = this.abilityIndex(cardId);
      const values = [...monster.revealedAbilities];
      values[index] = revealed;
      const abilityCard = gameManager.abilityCards(monster)[monster.abilities[index]];
      if (revealed && abilityCard) {
        abilityCard.revealed = true;
      }
      monster.revealedAbilities = values;
    } else {
      this.executionError('monster not found');
    }
  }
}

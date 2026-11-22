import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';

function keepAvailable(): number {
  const building = gameManager.game.party.buildings.find(
    (buildingModel) => buildingModel.name === 'town-hall' && buildingModel.level && buildingModel.state !== 'wrecked'
  );
  return building ? Math.ceil(building.level / 2) : 0;
}

function challengeCardIndex(cardId: BASE_TYPE | undefined): number {
  return typeof cardId === 'number' ? gameManager.game.challengeDeck.cards.findIndex((card) => card.cardId === cardId) : -1;
}

export class ChallengeDeckDrawCommand extends CommandImpl {
  id: string = 'challengeDeck.draw';
  requiredParameters: number = 0;

  validParameters(): boolean {
    const deck = gameManager.game.challengeDeck;
    return deck.cards.length > 0 && deck.current < deck.cards.length - 1;
  }

  executeWithParameters() {
    gameManager.challengesManager.drawCard(gameManager.game.challengeDeck);
  }
}

export class ChallengeDeckShuffleCommand extends CommandImpl {
  id: string = 'challengeDeck.shuffle';
  requiredParameters: number = 1;

  validParameters(seed: number, upcoming: boolean = false): boolean {
    return gameManager.game.challengeDeck.cards.length > 0 && typeof upcoming === 'boolean' && validSeed(seed);
  }

  executeWithParameters(seed: number, upcoming: boolean = false) {
    gameManager.game.seed = seed;
    gameManager.challengesManager.shuffleDeck(gameManager.game.challengeDeck, upcoming);
  }
}

export class ChallengeDeckClearCommand extends CommandImpl {
  id: string = 'challengeDeck.clear';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters(keep: boolean = true) {
    gameManager.challengesManager.clearDrawn(gameManager.game.challengeDeck, keep);
  }
}

export class ChallengeDeckKeepCommand extends CommandImpl {
  id: string = 'challengeDeck.keep';
  requiredParameters: number = 2;

  validParameters(cardId: number, keep: boolean): boolean {
    const index = challengeCardIndex(cardId);
    return (
      index !== -1 &&
      index <= gameManager.game.challengeDeck.current &&
      typeof keep === 'boolean' &&
      gameManager.game.challengeDeck.keep.includes(index) !== keep
    );
  }

  executeWithParameters(cardId: number) {
    gameManager.challengesManager.toggleKeep(gameManager.game.challengeDeck, challengeCardIndex(cardId), keepAvailable());
  }
}

export class ChallengeDeckRemoveCardCommand extends CommandImpl {
  id: string = 'challengeDeck.removeCard';
  requiredParameters: number = 1;

  validParameters(cardId: number): boolean {
    return challengeCardIndex(cardId) !== -1;
  }

  executeWithParameters(cardId: number) {
    const deck = gameManager.game.challengeDeck;
    const index = challengeCardIndex(cardId);
    if (index <= deck.finished) {
      deck.finished--;
    }
    if (index <= deck.current) {
      deck.current--;
    }
    deck.cards.splice(index, 1);
  }
}

export class ChallengeDeckRestoreCardCommand extends CommandImpl {
  id: string = 'challengeDeck.restoreCard';
  requiredParameters: number = 2;

  card(cardId: BASE_TYPE): ChallengeCard | undefined {
    return gameManager
      .challengesData(gameManager.game.edition)
      .find(
        (challengeCard) =>
          challengeCard.cardId === cardId && !gameManager.game.challengeDeck.cards.some((other) => other.cardId === challengeCard.cardId)
      );
  }

  validParameters(cardId: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.card(cardId);
  }

  executeWithParameters(cardId: number, seed: number) {
    gameManager.game.seed = seed;
    const card = this.card(cardId);
    if (card) {
      gameManager.challengesManager.restoreCard(gameManager.game.challengeDeck, card);
    } else {
      this.executionError('challenge card not found');
    }
  }
}

const CHALLENGE_LISTS = ['upcoming', 'discarded', 'finished'];

export class ChallengeDeckMoveCommand extends CommandImpl {
  id: string = 'challengeDeck.move';
  requiredParameters: number = 3;

  validParameters(cardId: number, toList: string, toIndex: number): boolean {
    return challengeCardIndex(cardId) !== -1 && CHALLENGE_LISTS.includes(toList) && typeof toIndex === 'number' && toIndex >= 0;
  }

  executeWithParameters(cardId: number, toList: string, toIndex: number) {
    const deck = gameManager.game.challengeDeck;
    const index = challengeCardIndex(cardId);
    if (index <= deck.finished) {
      this.move('finished', deck.finished - index, toList, toIndex);
    } else if (index <= deck.current) {
      this.move('discarded', deck.current - index, toList, toIndex);
    } else {
      this.move('upcoming', index - deck.current - 1, toList, toIndex);
    }
  }

  move(fromList: string, fromIndex: number, toList: string, toIndex: number) {
    gameManager.challengesManager.moveCard(gameManager.game.challengeDeck, fromList, fromIndex, toList, toIndex);
  }
}

export class ChallengeDeckActiveCommand extends CommandImpl {
  id: string = 'challengeDeck.active';
  requiredParameters: number = 1;

  validParameters(active: boolean): boolean {
    return typeof active === 'boolean';
  }

  executeWithParameters(active: boolean) {
    gameManager.game.challengeDeck.active = active;
  }
}

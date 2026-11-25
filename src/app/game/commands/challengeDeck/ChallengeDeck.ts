import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';

function challengeCardIndex(cardId: BASE_TYPE | undefined): number {
  return typeof cardId === 'number' ? gameManager.game.challengeDeck.cards.findIndex((card) => card.cardId === cardId) : -1;
}

export class ChallengeDeckDrawCommand extends CommandImpl {
  id: string = 'challengeDeck.draw';
  requiredParameters: number = 0;

  validParameters(force: boolean = false): boolean {
    return typeof force === 'boolean' && gameManager.challengesManager.canDrawCard(gameManager.game.challengeDeck, force);
  }

  executeWithParameters(force: boolean = false) {
    gameManager.challengesManager.drawCard(gameManager.game.challengeDeck, force);
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

  validParameters(cardId: number, keep: boolean, force: boolean = false): boolean {
    const deck = gameManager.game.challengeDeck;
    const index = challengeCardIndex(cardId);
    return (
      typeof keep === 'boolean' &&
      typeof force === 'boolean' &&
      deck.keep.includes(index) !== keep &&
      gameManager.challengesManager.canToggleKeep(deck, index, force)
    );
  }

  executeWithParameters(cardId: number, keep: boolean, force: boolean = false) {
    gameManager.challengesManager.toggleKeep(gameManager.game.challengeDeck, challengeCardIndex(cardId), force);
  }
}

export class ChallengeDeckRemoveCardCommand extends CommandImpl {
  id: string = 'challengeDeck.removeCard';
  requiredParameters: number = 1;

  validParameters(cardId: number): boolean {
    return gameManager.challengesManager.canRemoveCard(gameManager.game.challengeDeck, challengeCardIndex(cardId));
  }

  executeWithParameters(cardId: number) {
    gameManager.challengesManager.removeCard(gameManager.game.challengeDeck, challengeCardIndex(cardId));
  }
}

export class ChallengeDeckRestoreCardCommand extends CommandImpl {
  id: string = 'challengeDeck.restoreCard';
  requiredParameters: number = 2;

  card(cardId: BASE_TYPE): ChallengeCard | undefined {
    return gameManager.challengesManager
      .removedCards(gameManager.game.challengeDeck)
      .find((challengeCard) => challengeCard.cardId === cardId);
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

export class ChallengeDeckMoveCommand extends CommandImpl {
  id: string = 'challengeDeck.move';
  requiredParameters: number = 3;

  position(cardId: BASE_TYPE): { list: string; index: number } | undefined {
    const deck = gameManager.game.challengeDeck;
    const index = challengeCardIndex(cardId);
    if (index === -1) {
      return undefined;
    } else if (index <= deck.finished) {
      return { list: 'finished', index: deck.finished - index };
    } else if (index <= deck.current) {
      return { list: 'discarded', index: deck.current - index };
    }
    return { list: 'upcoming', index: index - deck.current - 1 };
  }

  validParameters(cardId: number, toList: string, toIndex: number): boolean {
    const position = this.position(cardId);
    return (
      !!position &&
      typeof toList === 'string' &&
      typeof toIndex === 'number' &&
      gameManager.challengesManager.canMoveCard(gameManager.game.challengeDeck, position.list, position.index, toList, toIndex)
    );
  }

  executeWithParameters(cardId: number, toList: string, toIndex: number) {
    const position = this.position(cardId);
    if (position) {
      gameManager.challengesManager.moveCard(gameManager.game.challengeDeck, position.list, position.index, toList, toIndex);
    }
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

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  ChallengeDeckActiveCommand,
  ChallengeDeckDrawCommand,
  ChallengeDeckKeepCommand,
  ChallengeDeckMoveCommand,
  ChallengeDeckRemoveCardCommand,
  ChallengeDeckShuffleCommand
} from 'src/app/game/commands/challengeDeck/ChallengeDeck';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';

function card(cardId: number): ChallengeCard {
  return new ChallengeCard(cardId, 'test', undefined);
}

describe('Challenge deck commands', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.challengeDeck.cards = [card(1), card(2), card(3), card(4), card(5)];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('draws a card through the challenges manager', () => {
    const drawCard = vi.spyOn(gameManager.challengesManager, 'drawCard').mockImplementation(() => {});
    new ChallengeDeckDrawCommand().execute();
    expect(drawCard).toHaveBeenCalledWith(gameManager.game.challengeDeck);
    gameManager.game.challengeDeck.current = 4;
    expect(new ChallengeDeckDrawCommand().validParameters()).toBe(false);
  });

  it('shuffles the deck', () => {
    const shuffleDeck = vi.spyOn(gameManager.challengesManager, 'shuffleDeck').mockImplementation(() => {});
    new ChallengeDeckShuffleCommand(5, true).execute();
    expect(shuffleDeck).toHaveBeenCalledWith(gameManager.game.challengeDeck, true);
    expect(gameManager.game.seed).toBe(5);
  });

  it('keeps a drawn card', () => {
    const toggleKeep = vi.spyOn(gameManager.challengesManager, 'toggleKeep').mockImplementation(() => {});
    expect(new ChallengeDeckKeepCommand(1, true).validParameters(1, true)).toBe(false);
    gameManager.game.challengeDeck.current = 1;
    new ChallengeDeckKeepCommand(1, true).execute();
    expect(toggleKeep).toHaveBeenCalledWith(gameManager.game.challengeDeck, 0, 0);
    expect(new ChallengeDeckKeepCommand(1, false).validParameters(1, false)).toBe(false);
    gameManager.game.challengeDeck.keep = [0];
    expect(new ChallengeDeckKeepCommand(1, true).validParameters(1, true)).toBe(false);
    expect(new ChallengeDeckKeepCommand(1, false).validParameters(1, false)).toBe(true);
  });

  it('removes a card', () => {
    gameManager.game.challengeDeck.current = 1;
    expect(new ChallengeDeckRemoveCardCommand(9).validParameters(9)).toBe(false);
    new ChallengeDeckRemoveCardCommand(1).execute();
    expect(gameManager.game.challengeDeck.cards.map((challengeCard) => challengeCard.cardId)).toEqual([2, 3, 4, 5]);
    expect(gameManager.game.challengeDeck.current).toBe(0);
  });

  it('moves an upcoming card to the finished cards', () => {
    const deck = gameManager.game.challengeDeck;
    deck.current = 1;
    deck.finished = -1;
    new ChallengeDeckMoveCommand(3, 'finished', 0).execute();
    expect(deck.finished).toBe(0);
    expect(deck.current).toBe(2);
    expect(deck.cards[0].cardId).toBe(3);
    new ChallengeDeckMoveCommand(3, 'upcoming', 0).execute();
    expect(deck.finished).toBe(-1);
    expect(deck.current).toBe(1);
    expect(deck.cards.map((challengeCard) => challengeCard.cardId)).toEqual([1, 2, 3, 4, 5]);
    expect(new ChallengeDeckMoveCommand(3, 'archive', 0).validParameters(3, 'archive', 0)).toBe(false);
    expect(new ChallengeDeckMoveCommand(9, 'upcoming', 0).validParameters(9, 'upcoming', 0)).toBe(false);
  });

  it('shows and hides the challenge deck', () => {
    new ChallengeDeckActiveCommand(true).execute();
    expect(gameManager.game.challengeDeck.active).toBe(true);
    new ChallengeDeckActiveCommand(false).execute();
    expect(gameManager.game.challengeDeck.active).toBe(false);
  });
});

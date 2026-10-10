import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { resolveAttackModifierDeck } from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckCommand';
import {
  AttackModifierDeckActiveCommand,
  AttackModifierDeckAddCardCommand,
  AttackModifierDeckChangeCommand,
  AttackModifierDeckDiscardCommand,
  AttackModifierDeckMoveCommand,
  AttackModifierDeckRemoveCardCommand,
  AttackModifierDeckRestoreCardCommand,
  AttackModifierDeckRevealCommand,
  AttackModifierDeckShuffleCommand
} from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckEdit';
import { CommandInvalidParametersError, CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';

describe('Attack modifier deck commands', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.monsterAttackModifierDeck = new AttackModifierDeck([
      new AttackModifier(AttackModifierType.plus0),
      new AttackModifier(AttackModifierType.plus1),
      new AttackModifier(AttackModifierType.minus1),
      new AttackModifier(AttackModifierType.double)
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves monster, ally and character decks', () => {
    const character = createTestCharacter(1);
    expect(resolveAttackModifierDeck('m')?.deck).toBe(gameManager.game.monsterAttackModifierDeck);
    expect(resolveAttackModifierDeck('a')?.deck).toBe(gameManager.game.allyAttackModifierDeck);
    expect(resolveAttackModifierDeck(1)?.deck).toBe(character.attackModifierDeck);
    expect(resolveAttackModifierDeck('t')).toBeUndefined();
    expect(resolveAttackModifierDeck(2)).toBeUndefined();
  });

  it('shuffles a deck with the same result for the same seed', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    const original = [...deck.cards];
    new AttackModifierDeckShuffleCommand('m', 7).execute();
    const shuffled = [...deck.cards];
    deck.cards = [...original];
    new AttackModifierDeckShuffleCommand('m', 7).execute();
    expect(deck.cards).toEqual(shuffled);
    expect(deck.current).toBe(-1);
  });

  it('shuffles only the upcoming cards', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    deck.current = 1;
    new AttackModifierDeckShuffleCommand('m', 1, true).execute();
    expect(deck.cards.slice(0, 2).map((am) => am.id)).toEqual(['plus0', 'plus1']);
    expect(deck.current).toBe(1);
  });

  it('rejects invalid seeds', () => {
    expect(() => new AttackModifierDeckShuffleCommand('m').checkParameters()).toThrow(CommandMissingParameterError);
    expect(() => new AttackModifierDeckShuffleCommand('m', '1').checkParameters()).toThrow(CommandInvalidParametersError);
    expect(() => new AttackModifierDeckShuffleCommand('m', 1.5).checkParameters()).toThrow(CommandInvalidParametersError);
  });

  it('moves an upcoming card to the discard pile', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    new AttackModifierDeckMoveCommand('m', 'upcoming', 'minus1', 'discarded', 0).execute();
    expect(deck.current).toBe(0);
    expect(deck.cards[0].type).toBe(AttackModifierType.minus1);
    expect(deck.cards[0].revealed).toBe(true);
  });

  it('removes a drawn card and updates the current index', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    deck.current = 1;
    expect(new AttackModifierDeckRemoveCardCommand('m', 'upcoming', 'plus0').validParameters('m', 'upcoming', 'plus0')).toBe(false);
    new AttackModifierDeckRemoveCardCommand('m', 'discarded', 'plus0').execute();
    expect(deck.cards.length).toBe(3);
    expect(deck.current).toBe(0);
    expect(deck.cards[0].type).toBe(AttackModifierType.plus1);
  });

  it('restores a removed default card by id', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    expect(new AttackModifierDeckRestoreCardCommand('m', 'double').validParameters('m', 'double')).toBe(false);
    new AttackModifierDeckRestoreCardCommand('m', 'plus2').execute();
    expect(deck.cards[0].id).toBe('plus2');
    expect(deck.cards.length).toBe(5);
  });

  it('adds a new card on top or shuffled', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    new AttackModifierDeckAddCardCommand('m', AttackModifierType.plus2, 1).execute();
    expect(deck.cards[0].type).toBe(AttackModifierType.plus2);
    expect(deck.cards[0].revealed).toBe(true);
    new AttackModifierDeckAddCardCommand('m', AttackModifierType.minus2, 1, true).execute();
    expect(deck.cards.filter((am) => am.type === AttackModifierType.minus2).length).toBe(1);
    expect(new AttackModifierDeckAddCardCommand('m', 'nope', 1).validParameters('m', 'nope', 1)).toBe(false);
  });

  it('adds and removes curses and blesses', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    new AttackModifierDeckChangeCommand('m', AttackModifierType.curse, 2, 1).execute();
    expect(deck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(2);
    new AttackModifierDeckChangeCommand('m', AttackModifierType.curse, -2, 1).execute();
    expect(deck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(0);
    expect(
      new AttackModifierDeckChangeCommand('m', AttackModifierType.plus1, 1, 1).validParameters('m', AttackModifierType.plus1, 1, 1)
    ).toBe(false);
  });

  it('reveals a card and discards an active card', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    new AttackModifierDeckRevealCommand('m', 'plus1', true).execute();
    expect(deck.cards[1].revealed).toBe(true);
    expect(new AttackModifierDeckRevealCommand('m', 'plus1', true).validParameters('m', 'plus1', true)).toBe(false);
    new AttackModifierDeckRevealCommand('m', 'plus1', false).execute();
    expect(deck.cards[1].revealed).toBe(false);

    expect(new AttackModifierDeckDiscardCommand('m', 'plus1', true).validParameters('m', 'plus1', true)).toBe(false);
    deck.cards[1].active = true;
    new AttackModifierDeckDiscardCommand('m', 'plus1', true).execute();
    expect(deck.discarded).toEqual([1]);
    expect(new AttackModifierDeckDiscardCommand('m', 'plus1', true).validParameters('m', 'plus1', true)).toBe(false);
    new AttackModifierDeckDiscardCommand('m', 'plus1', false).execute();
    expect(deck.discarded).toEqual([]);
  });

  it('shows and hides a deck', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    new AttackModifierDeckActiveCommand('m', true).execute();
    expect(deck.active).toBe(true);
    new AttackModifierDeckActiveCommand('m', false).execute();
    expect(deck.active).toBe(false);
  });
});

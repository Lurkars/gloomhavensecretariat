import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { ActiveAbilityCard } from 'src/app/game/model/CharacterAbilityCards';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { GameState } from 'src/app/game/model/Game';

function buildCharacter(name: string): Character {
  return new Character(Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
}

describe('CharacterAbilityManager', () => {
  const characterAbilityManager = gameManager.characterAbilityManager;

  function abilities(): AbilityCard[] {
    return [1, 1, 2, 2, 3].map((level, index) => Object.assign(new AbilityCard(), { cardId: index + 1, level: level }));
  }

  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.spyOn(gameManager.editionManager, 'deckData').mockReturnValue(Object.assign(new DeckData(), { abilities: abilities() }));
  });

  it('picks cards up to the character level', () => {
    const character = buildCharacter('test-char');
    character.level = 3;
    character.progress.deck = [];
    expect(characterAbilityManager.abilityCardsToPick(character)).toBe(2);
    expect(characterAbilityManager.abilityLevelToPick(character)).toBe(2);
    expect(characterAbilityManager.canToggleAbilityDeck(character, 0)).toBe(false);
    expect(characterAbilityManager.canToggleAbilityDeck(character, 4)).toBe(false);
    expect(characterAbilityManager.toggleAbilityDeck(character, 2)).toBe(true);
    expect(characterAbilityManager.abilityLevelToPick(character)).toBe(3);
    expect(characterAbilityManager.toggleAbilityDeck(character, 4)).toBe(true);
    expect(characterAbilityManager.abilityCardsToPick(character)).toBe(0);
    expect(characterAbilityManager.toggleAbilityDeck(character, 3)).toBe(false);
    expect(characterAbilityManager.toggleAbilityDeck(character, 3, true)).toBe(true);
    expect(character.progress.deck).toEqual([2, 4, 3]);
    expect(characterAbilityManager.toggleAbilityDeck(character, 2)).toBe(true);
    expect(character.progress.deck).toEqual([4, 3]);
  });

  it('undoes and resets the deck', () => {
    const character = buildCharacter('test-char');
    character.progress.deck = [];
    expect(characterAbilityManager.undoAbilityDeck(character)).toBe(false);
    character.progress.deck = [2, 4];
    expect(characterAbilityManager.undoAbilityDeck(character)).toBe(true);
    expect(character.progress.deck).toEqual([2]);
    characterAbilityManager.resetAbilityDeck(character);
    expect(character.progress.deck).toEqual([]);
  });

  describe('digital ability cards', () => {
    // 0: plain, 1: top lost, 2: bottom persistent lost, 3: top round, 4: X, 5: level 2, 6: bottom round lost
    function playCards(): AbilityCard[] {
      return [
        Object.assign(new AbilityCard(), { cardId: 1, level: 1, initiative: 10 }),
        Object.assign(new AbilityCard(), { cardId: 2, level: 1, initiative: 20, lost: true }),
        Object.assign(new AbilityCard(), { cardId: 3, level: 1, initiative: 30, bottomPersistent: true, bottomLost: true }),
        Object.assign(new AbilityCard(), { cardId: 4, level: 1, initiative: 40, round: true }),
        Object.assign(new AbilityCard(), { cardId: 5, level: 'X', initiative: 50 }),
        Object.assign(new AbilityCard(), { cardId: 6, level: 2, initiative: 60 }),
        Object.assign(new AbilityCard(), { cardId: 7, level: 1, initiative: 70, bottomRound: true, bottomLost: true })
      ];
    }

    function buildPlayer(): Character {
      const character = buildCharacter('test-char');
      character.handSize = 4;
      characterAbilityManager.enableAbilityCards(character, true);
      return character;
    }

    beforeEach(() => {
      vi.spyOn(gameManager.editionManager, 'deckData').mockReturnValue(Object.assign(new DeckData(), { abilities: playCards() }));
      gameManager.game.state = GameState.draw;
    });

    afterEach(() => (gameManager.game.state = GameState.draw));

    it('enables and disables', () => {
      const character = buildCharacter('test-char');
      expect(character.abilityCards).toBeUndefined();
      expect(characterAbilityManager.enableAbilityCards(character, true)).toBe(true);
      expect(character.abilityCards).toBeDefined();
      characterAbilityManager.enableAbilityCards(character, false);
      expect(character.abilityCards).toBeUndefined();
    });

    it('chooses the hand from available cards up to hand size', () => {
      const character = buildPlayer();
      expect(characterAbilityManager.availableAbilityCards(character)).toEqual([0, 1, 2, 3, 4, 6]);
      expect(characterAbilityManager.toggleHand(character, 5)).toBe(false);
      expect(characterAbilityManager.toggleHand(character, 5, true)).toBe(true);
      [0, 1, 2].forEach((index) => characterAbilityManager.toggleHand(character, index));
      expect(characterAbilityManager.handComplete(character)).toBe(true);
      expect(characterAbilityManager.toggleHand(character, 3)).toBe(false);
      expect(characterAbilityManager.toggleHand(character, 5)).toBe(true);
      expect(characterAbilityManager.toggleHand(character, 3)).toBe(true);
      expect(character.abilityCards?.hand).toEqual([0, 1, 2, 3]);
    });

    it('selects two cards and takes initiative from the leading card', () => {
      const character = buildPlayer();
      character.abilityCards!.hand = [0, 1, 2, 3];
      expect(characterAbilityManager.toggleSelectCard(character, 1)).toBe(true);
      expect(character.initiative).toBe(0);
      expect(characterAbilityManager.toggleSelectCard(character, 2)).toBe(true);
      expect(character.initiative).toBe(20);
      expect(characterAbilityManager.toggleSelectCard(character, 0)).toBe(false);
      expect(characterAbilityManager.setLeadingCard(character, 2)).toBe(true);
      expect(character.initiative).toBe(30);
      expect(character.abilityCards?.hand).toEqual([0, 3]);
      expect(characterAbilityManager.handEditable(character)).toBe(false);
      gameManager.roundManager.setLongRest(character, true);
      expect(character.abilityCards?.selected).toEqual([]);
      expect(character.abilityCards?.hand).toEqual([0, 3, 2, 1]);
    });

    it('plays card halves into discard, lost and active piles', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.selected = [0, 1];
      expect(characterAbilityManager.playCard(character, 0, 'top')).toBeUndefined();
      gameManager.game.state = GameState.next;
      expect(characterAbilityManager.playCard(character, 0, 'bottom')).toBe('discard');
      expect(characterAbilityManager.canPlayCard(character, 1, 'bottom')).toBe(false);
      expect(characterAbilityManager.canPlayCard(character, 1, 'defaultBottom')).toBe(false);
      expect(characterAbilityManager.canPlayCard(character, 1, 'bottom', true)).toBe(true);
      expect(characterAbilityManager.playCard(character, 1, 'top')).toBe('lost');
      characterAbilityManager.endRound(character);
      expect(cards.played).toBeUndefined();
      gameManager.game.state = GameState.next;
      cards.selected = [1, 2];
      expect(characterAbilityManager.playCard(character, 1, 'defaultTop')).toBe('discard');
      expect(characterAbilityManager.canPlayCard(character, 2, 'top')).toBe(false);
      expect(characterAbilityManager.playCard(character, 2, 'bottom')).toBe('active');
      expect(cards.active).toEqual([new ActiveAbilityCard(2, true)]);
      expect(characterAbilityManager.removeActiveCard(character, 2)).toBe('lost');
      expect(cards.discard).toEqual([0, 1]);
      expect(cards.lost).toEqual([1, 2]);
    });

    it('ends the round with unplayed and round bonus cards', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.hand = [4, 5];
      cards.selected = [0];
      cards.active = [new ActiveAbilityCard(3, false), new ActiveAbilityCard(2, true), new ActiveAbilityCard(6, true)];
      characterAbilityManager.endRound(character);
      expect(cards.selected).toEqual([]);
      expect(cards.discard).toEqual([0, 3]);
      expect(cards.lost).toEqual([6]);
      expect(cards.active).toEqual([new ActiveAbilityCard(2, true)]);
      expect(character.exhausted).toBe(false);
    });

    it('exhausts without cards to play or rest', () => {
      const character = buildPlayer();
      character.abilityCards!.hand = [0];
      character.abilityCards!.discard = [1];
      characterAbilityManager.endRound(character);
      expect(character.exhausted).toBe(true);
    });

    it('short rests and rerolls', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.discard = [0, 1, 2];
      cards.hand = [3];
      const health = character.health;
      const lost = characterAbilityManager.shortRest(character) as number;
      expect(cards.lost).toEqual([lost]);
      expect(cards.discard).toEqual([]);
      expect(cards.hand.length).toBe(3);
      expect(characterAbilityManager.canRerollShortRest(character)).toBe(true);
      const rerolled = characterAbilityManager.rerollShortRest(character) as number;
      expect(rerolled).not.toBe(lost);
      expect(cards.lost).toEqual([rerolled]);
      expect(cards.hand).toContain(lost);
      expect(character.health).toBe(health - 1);
      expect(characterAbilityManager.canRerollShortRest(character)).toBe(false);
    });

    it('long rests losing the chosen card', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.discard = [0, 1];
      character.longRest = true;
      expect(characterAbilityManager.longRest(character, 1)).toBe(false);
      gameManager.game.state = GameState.next;
      expect(characterAbilityManager.longRest(character, 2)).toBe(false);
      expect(characterAbilityManager.longRest(character, 1)).toBe(true);
      expect(cards.lost).toEqual([1]);
      expect(cards.hand).toEqual([0]);
    });

    it('loses one hand or two discarded cards for damage', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.hand = [0, 1];
      cards.discard = [2, 3];
      expect(characterAbilityManager.loseCardsForDamage(character, [0, 1])).toBe(false);
      expect(characterAbilityManager.loseCardsForDamage(character, [2])).toBe(false);
      expect(characterAbilityManager.loseCardsForDamage(character, [0])).toBe(true);
      expect(characterAbilityManager.loseCardsForDamage(character, [2, 3])).toBe(true);
      expect(cards.lost).toEqual([0, 2, 3]);
    });

    it('resets to the full hand and serializes', () => {
      const character = buildPlayer();
      const cards = character.abilityCards!;
      cards.hand = [0];
      cards.discard = [1];
      cards.lost = [2];
      cards.active = [new ActiveAbilityCard(3, false)];
      const copy = buildCharacter('test-char');
      copy.fromModel(character.toModel());
      expect(copy.abilityCards).toEqual(cards);
      characterAbilityManager.resetAbilityCards(character);
      expect(character.abilityCards?.hand).toEqual([0, 1, 2, 3]);
      expect(character.abilityCards?.discard).toEqual([]);
    });
  });
});

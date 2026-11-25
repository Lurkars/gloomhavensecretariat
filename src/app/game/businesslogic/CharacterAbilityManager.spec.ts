import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { DeckData } from 'src/app/game/model/data/DeckData';

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
});

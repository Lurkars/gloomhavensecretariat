import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterSpecialAction, CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { FigureErrorType } from 'src/app/game/model/data/FigureError';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Perk } from 'src/app/game/model/data/Perks';
import { PersonalQuest, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

// This spec covers the small, clearly-scoped helpers (icon/color/thumbnail lookups, xp -> level
// mapping, the "ignore negative X" perk checks and itemEffect()), plus the
// stateful flows addCharacter/setLevel/next()/draw() below. Those flows carry hardcoded per-
// character-name effects (gated behind `character.name === '<specific character>'`) that stay out
// of scope — fixtures use a generic name ('test-char') so none of those branches fire.

function buildCharacterData(overrides: Partial<CharacterData> = {}): CharacterData {
  return Object.assign(new CharacterData(), overrides);
}

function buildCharacter(name: string, edition: string = 'gh', overrides: Partial<CharacterData> = {}): Character {
  const data = buildCharacterData({ name, edition, stats: [new CharacterStat(1, 10)], ...overrides });
  return new Character(data, 1);
}

describe('CharacterManager', () => {
  const characterManager = gameManager.characterManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.playerCount = -1;
    gameManager.game.state = GameState.draw;
    gameManager.game.levelCalculation = false;
    gameManager.game.party.retirements = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.treasures = [];
    gameManager.editionManager.editionData = [];
    settingsManager.settings.editions = [];
    settingsManager.settings.characterAttackModifierDeckPermanent = false;
    gameManager.trialsManager.apply = false;
    gameManager.trialsManager.trialsEnabled = false;
    vi.spyOn(gameManager.trialsManager, 'applyTrialCards').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('characterIcon', () => {
    it('prefers iconUrl when set', () => {
      const data = buildCharacterData({ iconUrl: 'custom-icon.svg' });
      expect(characterManager.characterIcon(data)).toEqual('custom-icon.svg');
    });

    it('falls back to icon when iconUrl is not set', () => {
      const data = buildCharacterData({ icon: 'my-icon' });
      expect(characterManager.characterIcon(data)).toEqual('./assets/images/character/icons/my-icon.svg');
    });

    it('falls back to edition-name when neither iconUrl nor icon are set', () => {
      const data = buildCharacterData({ edition: 'gh', name: 'brute' });
      expect(characterManager.characterIcon(data)).toEqual('./assets/images/character/icons/gh-brute.svg');
    });

    it('resolves a character by name/edition when given a string', () => {
      gameManager.editionManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'brute', edition: 'gh', icon: 'gh-brute-icon' })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterIcon('brute', 'gh')).toEqual('./assets/images/character/icons/gh-brute-icon.svg');
    });
  });

  describe('characterIdentityIcon', () => {
    it('falls back to characterIcon when the character has no identities', () => {
      gameManager.editionManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'brute', edition: 'gh', icon: 'gh-brute' })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterIdentityIcon('brute', 0)).toEqual('./assets/images/character/icons/gh-brute.svg');
    });

    it('builds an identity-specific icon path when identities exist', () => {
      gameManager.editionManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'giver', edition: 'gh', identities: ['id-a', 'id-b'] })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterIdentityIcon('giver', 1)).toEqual('./assets/images/character/icons/gh-giver-id-b.svg');
    });
  });

  describe('characterColor', () => {
    it('returns the color from a CharacterData instance directly', () => {
      const data = buildCharacterData({ color: '#123456' });
      expect(characterManager.characterColor(data)).toEqual('#123456');
    });

    it('resolves the color by name via getCharacterData when given a string', () => {
      gameManager.editionManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'brute', edition: 'gh', color: '#abcdef' })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterColor('brute')).toEqual('#abcdef');
    });
  });

  describe('characterThumbnail', () => {
    it('prefers thumbnailUrl', () => {
      const data = buildCharacterData({ thumbnailUrl: 'thumb.png' });
      expect(characterManager.characterThumbnail(data)).toEqual('thumb.png');
    });

    it('falls back to thumbnail filename', () => {
      const data = buildCharacterData({ thumbnail: 'my-thumb' });
      expect(characterManager.characterThumbnail(data)).toEqual('./assets/images/character/thumbnail/my-thumb.png');
    });

    it('falls back to edition-name when neither is set', () => {
      const data = buildCharacterData({ edition: 'gh', name: 'brute' });
      expect(characterManager.characterThumbnail(data)).toEqual('./assets/images/character/thumbnail/gh-brute.png');
    });
  });

  describe('characterCount', () => {
    it('returns game.playerCount when set and figuresOnly is false', () => {
      gameManager.game.playerCount = 4;
      gameManager.game.figures = [buildCharacter('brute')];
      expect(characterManager.characterCount()).toEqual(4);
    });

    it('counts non-absent character figures when figuresOnly is true, ignoring playerCount', () => {
      gameManager.game.playerCount = 4;
      const present = buildCharacter('brute');
      const absent = buildCharacter('spellweaver');
      absent.absent = true;
      gameManager.game.figures = [present, absent];
      expect(characterManager.characterCount(true)).toEqual(1);
    });

    it('counts figures when playerCount is unset (-1)', () => {
      gameManager.game.playerCount = -1;
      gameManager.game.figures = [buildCharacter('brute'), buildCharacter('spellweaver')];
      expect(characterManager.characterCount()).toEqual(2);
    });
  });

  describe('levelForXp', () => {
    it('is level 0 below the first threshold', () => {
      expect(characterManager.levelForXp(0)).toEqual(1);
      expect(characterManager.levelForXp(-5)).toEqual(0);
    });

    it('matches the exact xpMap boundaries', () => {
      expect(characterManager.levelForXp(44)).toEqual(1);
      expect(characterManager.levelForXp(45)).toEqual(2);
      expect(characterManager.levelForXp(500)).toEqual(9);
      expect(characterManager.levelForXp(10000)).toEqual(9);
    });
  });

  describe('ignoreNegativeItemEffects', () => {
    it('is false when the character has no matching perk', () => {
      const character = buildCharacter('brute');
      expect(characterManager.ignoreNegativeItemEffects(character)).toBe(false);
    });

    it('is true once the (non-combined) perk has been taken', () => {
      const perk = Object.assign(new Perk(), { custom: '%game.custom.perks.ignoreNegativeItem%', combined: false });
      const character = buildCharacter('brute', 'gh', { perks: [perk] });
      character.progress.perks = [1];
      expect(characterManager.ignoreNegativeItemEffects(character)).toBe(true);
    });

    it('is false while the (non-combined) perk count is zero', () => {
      const perk = Object.assign(new Perk(), { custom: '%game.custom.perks.ignoreNegativeItem%', combined: false });
      const character = buildCharacter('brute', 'gh', { perks: [perk] });
      character.progress.perks = [0];
      expect(characterManager.ignoreNegativeItemEffects(character)).toBe(false);
    });

    it('for a combined perk, requires the taken count to equal perk.count exactly', () => {
      const perk = Object.assign(new Perk(), { custom: '%game.custom.perks.ignoreNegativeItemFh%', combined: true, count: 3 });
      const character = buildCharacter('brute', 'gh', { perks: [perk] });
      character.progress.perks = [2];
      expect(characterManager.ignoreNegativeItemEffects(character)).toBe(false);
      character.progress.perks = [3];
      expect(characterManager.ignoreNegativeItemEffects(character)).toBe(true);
    });
  });

  describe('ignoreNegativeScenarioffects', () => {
    it('is false when the character has no matching perk', () => {
      const character = buildCharacter('brute');
      expect(characterManager.ignoreNegativeScenarioffects(character)).toBe(false);
    });

    it('is true once the (non-combined) perk has been taken', () => {
      const perk = Object.assign(new Perk(), { custom: '%game.custom.perks.ignoreScenario%', combined: false });
      const character = buildCharacter('brute', 'gh', { perks: [perk] });
      character.progress.perks = [1];
      expect(characterManager.ignoreNegativeScenarioffects(character)).toBe(true);
    });
  });

  describe('itemEffect', () => {
    it('matches known gh item ids', () => {
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'gh', id: 38 }))).toBe(true);
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'gh', id: 1 }))).toBe(false);
    });

    it('matches known cs/toa/fh item ids', () => {
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'cs', id: 157 }))).toBe(true);
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'toa', id: 107 }))).toBe(true);
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'fh', id: 178 }))).toBe(true);
    });

    it('is false for an edition without special item effects', () => {
      expect(characterManager.itemEffect(Object.assign(new ItemData(), { edition: 'jotl', id: 3 }))).toBe(false);
    });
  });

  describe('getActiveCharacters', () => {
    it('excludes absent characters, dead characters and non-character figures', () => {
      const alive = buildCharacter('brute');
      const absent = buildCharacter('spellweaver');
      absent.absent = true;
      const dead = buildCharacter('cragheart');
      dead.health = 0;
      const monsterData = Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh' });
      const monster = new Monster(monsterData, 1);

      gameManager.game.figures = [alive, absent, dead, monster];

      expect(characterManager.getActiveCharacters()).toEqual([alive]);
    });
  });

  describe('addCharacter', () => {
    beforeEach(() => {
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
      vi.spyOn(gameManager, 'gh2eRules').mockReturnValue(false);
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(false);
    });

    it('adds a new character figure with number 1 for the first character', () => {
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      expect(gameManager.game.figures.length).toBe(1);
      const character = gameManager.game.figures[0] as Character;
      expect(character).toBeInstanceOf(Character);
      expect(character.number).toBe(1);
    });

    it('assigns the next free number when lower numbers are already taken', () => {
      const existing = buildCharacter('existing', 'gh');
      existing.number = 1;
      gameManager.game.figures = [existing];
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      const added = gameManager.game.figures.find((f) => f instanceof Character && f.name === 'test-char') as Character;
      expect(added.number).toBe(2);
    });

    it('does not add a duplicate for the same name+edition already present', () => {
      const existing = buildCharacter('test-char', 'gh');
      gameManager.game.figures = [existing];
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      expect(gameManager.game.figures.length).toBe(1);
    });

    it('tags the new character as "new-character"', () => {
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      const character = gameManager.game.figures[0] as Character;
      expect(character.tags).toContain('new-character');
    });

    it('grants starting gold using the fh formula under fh rules', () => {
      (gameManager.fhRules as any).mockReturnValue(true);
      vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(2);
      const data = buildCharacterData({ name: 'test-char', edition: 'fh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      const character = gameManager.game.figures[0] as Character;
      // 10 * prosperityLevel(2) + 20 = 40
      expect(character.progress.gold).toBe(40);
    });

    it('grants starting gold using the level-based formula outside of fh/gh2e/jotl rules', () => {
      const data = buildCharacterData({
        name: 'test-char',
        edition: 'gh',
        stats: [new CharacterStat(1, 10), new CharacterStat(3, 14)]
      });

      characterManager.addCharacter(data, 3);

      const character = gameManager.game.figures[0] as Character;
      // 15 * (level(3) + 1) = 60
      expect(character.progress.gold).toBe(60);
    });

    it('grants no starting gold under jotl rules (level-based formula suppressed)', () => {
      (gameManager.editionRules as any).mockReturnValue(true);
      const data = buildCharacterData({ name: 'test-char', edition: 'jotl', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      const character = gameManager.game.figures[0] as Character;
      expect(character.progress.gold).toBe(0);
    });

    it('carries over a retirement count for a matching figure number', () => {
      gameManager.game.party.retirements = [{ number: 1, progress: {} } as any];
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      const character = gameManager.game.figures[0] as Character;
      expect(character.progress.retirements).toBe(1);
    });

    it('shuffles the attack modifier deck when the game is already in the "next" state', () => {
      gameManager.game.state = GameState.next;
      const shuffleSpy = vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      expect(shuffleSpy).toHaveBeenCalled();
    });

    it('recalculates the scenario level when levelCalculation is enabled', () => {
      gameManager.game.levelCalculation = true;
      const calcSpy = vi.spyOn(gameManager.levelManager, 'calculateScenarioLevel').mockImplementation(() => {});
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      expect(calcSpy).toHaveBeenCalled();
    });

    it('always calls trialsManager.applyTrialCards, even for a duplicate that is not added', () => {
      const existing = buildCharacter('test-char', 'gh');
      gameManager.game.figures = [existing];
      const data = buildCharacterData({ name: 'test-char', edition: 'gh', stats: [new CharacterStat(1, 10)] });

      characterManager.addCharacter(data, 1);

      expect(gameManager.trialsManager.applyTrialCards).toHaveBeenCalled();
    });
  });

  describe('summons', () => {
    function summonData(overrides: Partial<SummonData> = {}): SummonData {
      return Object.assign(new SummonData(), { name: 'wolf', cardId: '1', count: 2 }, overrides);
    }

    it('adds a summon from summon data, special summons as custom with number 0', () => {
      const character = buildCharacter('test-char');
      const summon = gameManager.summonManager.addSummonFromData(character, summonData(), 2, SummonColor.blue)!;
      expect(summon.number).toBe(2);
      expect(summon.color).toBe(SummonColor.blue);
      expect(summon.state).toBe(SummonState.new);
      const special = gameManager.summonManager.addSummonFromData(
        character,
        summonData({ name: 'spirit', special: true }),
        3,
        SummonColor.blue
      )!;
      expect(special.number).toBe(0);
      expect(special.color).toBe(SummonColor.custom);
      expect(special.state).toBe(SummonState.true);
      expect(character.summons.length).toBe(2);
    });

    it('finds the next free summon number and respects the summon count', () => {
      const character = buildCharacter('test-char');
      const data = summonData();
      expect(gameManager.summonManager.nextSummonNumber(character, data, SummonColor.blue)).toBe(1);
      expect(gameManager.summonManager.summonAvailable(character, data, 1, SummonColor.blue)).toBe(true);
      gameManager.summonManager.addSummonFromData(character, data, 1, SummonColor.blue);
      expect(gameManager.summonManager.nextSummonNumber(character, data, SummonColor.blue)).toBe(2);
      expect(gameManager.summonManager.nextSummonNumber(character, data, SummonColor.green)).toBe(1);
      expect(gameManager.summonManager.summonAvailable(character, data, 1, SummonColor.blue)).toBe(false);
      gameManager.summonManager.addSummonFromData(character, data, 2, SummonColor.blue);
      expect(gameManager.summonManager.summonAvailable(character, data, 3, SummonColor.blue)).toBe(false);
    });

    it('adds a custom summon', () => {
      const character = buildCharacter('test-char');
      const summon = gameManager.summonManager.addCustomSummon(character, 'custom', 4, SummonColor.yellow)!;
      expect(summon.name).toBe('custom');
      expect(summon.number).toBe(4);
      expect(character.summons).toEqual([summon]);
      expect(gameManager.summonManager.canAddCustomSummon(character, 'custom', 4, SummonColor.yellow)).toBe(false);
      expect(gameManager.summonManager.addCustomSummon(character, 'custom', 4, SummonColor.yellow)).toBeUndefined();
      expect(gameManager.summonManager.canAddCustomSummon(character, 'custom', 0, SummonColor.yellow)).toBe(false);
      expect(character.summons.length).toBe(1);
    });

    it('refuses summons above the count limit, dead summons do not count', () => {
      const character = buildCharacter('test-char');
      const data = summonData({ count: 1 });
      const summon = gameManager.summonManager.addSummonFromData(character, data, 1, SummonColor.blue)!;
      expect(gameManager.summonManager.canAddSummon(character, data)).toBe(false);
      expect(gameManager.summonManager.addSummonFromData(character, data, 2, SummonColor.blue)).toBeUndefined();
      summon.dead = true;
      expect(gameManager.summonManager.canAddSummon(character, data)).toBe(true);
    });

    it('lists level summons and item summons without changing the item data', () => {
      const character = buildCharacter('test-char');
      character.level = 2;
      character.availableSummons = [summonData({ level: 1 }), summonData({ name: 'bear', level: 3 })];
      const item = Object.assign(new ItemData(), { id: 1, name: 'item-summon', edition: 'test' });
      item.summon = Object.assign(new SummonData(), { cardId: '' });
      vi.spyOn(gameManager.editionManager, 'relevantEditions').mockReturnValue(['test']);
      vi.spyOn(gameManager.itemManager, 'getItems').mockReturnValue([item]);
      settingsManager.settings.characterItems = false;
      const summons = gameManager.summonManager.availableSummons(character);
      expect(summons.map((value) => value.name)).toEqual(['wolf', 'item-summon']);
      expect(summons[1].count).toBe(1);
      expect(item.summon.name).toBe('');
      settingsManager.settings.characterItems = true;
      expect(gameManager.summonManager.availableSummons(character).map((value) => value.name)).toEqual(['wolf']);
    });
  });

  describe('absent', () => {
    it('keeps at least one character present', () => {
      const first = buildCharacter('test-char');
      const second = buildCharacter('other-char');
      gameManager.game.figures = [first, second];
      expect(characterManager.setAbsent(first, true)).toBe(true);
      expect(characterManager.canSetAbsent(second, true)).toBe(false);
      expect(characterManager.setAbsent(second, true)).toBe(false);
      expect(second.absent).toBe(false);
      expect(characterManager.setAbsent(first, false)).toBe(true);
      expect(first.absent).toBe(false);
    });
  });

  describe('resources', () => {
    it('sets valid resource values only', () => {
      const character = buildCharacter('test-char');
      expect(characterManager.setResource(character, LootType.hide, 3)).toBe(true);
      expect(character.progress.loot[LootType.hide]).toBe(3);
      expect(characterManager.setResource(character, LootType.hide, -1)).toBe(false);
      expect(characterManager.setResource(character, LootType.hide, 1.5)).toBe(false);
      expect(character.progress.loot[LootType.hide]).toBe(3);
    });
  });

  describe('tokens, identity and player number', () => {
    it('keeps tokens and token values in range', () => {
      const character = buildCharacter('test-char');
      character.tokens = ['time'];
      character.tokenValues = [1];
      expect(characterManager.changeToken(character, -3)).toBe(true);
      expect(character.token).toBe(0);
      expect(characterManager.changeToken(character, 0)).toBe(false);
      expect(characterManager.changeTokenValue(character, 0, -5)).toBe(true);
      expect(character.tokenValues[0]).toBe(0);
      vi.spyOn(gameManager.specialActionsManager, 'maxTokenValue').mockReturnValue(5);
      expect(characterManager.tokenValueAfter(character, 0, 9)).toBe(5);
      expect(characterManager.changeTokenValue(character, 1, 1)).toBe(false);
    });

    it('switches identities unless locked', () => {
      const character = buildCharacter('test-char');
      character.identities = ['a', 'b'];
      expect(characterManager.nextIdentity(character)).toBe(1);
      expect(characterManager.setIdentity(character, 1)).toBe(true);
      expect(characterManager.nextIdentity(character)).toBe(0);
      expect(characterManager.setIdentity(character, 2)).toBe(false);
      vi.spyOn(gameManager.specialActionsManager, 'isIdentityLocked').mockReturnValue(true);
      expect(characterManager.setIdentity(character, 0)).toBe(false);
      expect(character.identity).toBe(1);
    });

    it('swaps player numbers with the character using it', () => {
      const first = buildCharacter('test-char');
      const second = buildCharacter('other-char');
      first.number = 1;
      second.number = 2;
      gameManager.game.figures = [first, second];
      expect(characterManager.setPlayerNumber(first, 1)).toBe(false);
      expect(characterManager.setPlayerNumber(first, 2)).toBe(true);
      expect([first.number, second.number]).toEqual([2, 1]);
      expect(characterManager.setPlayerNumber(first, 0)).toBe(false);
    });
  });

  describe('removeAllCharacters', () => {
    it('removes characters including their markers on other figures', () => {
      const first = buildCharacter('test-char');
      first.marker = true;
      const second = buildCharacter('other-char');
      const marker = first.edition + '-' + first.name;
      const monster = new Monster(new MonsterData());
      const entity = new MonsterEntity(1, MonsterType.normal, monster);
      entity.markers = [marker];
      monster.entities = [entity];
      gameManager.game.figures = [first, monster, second];
      characterManager.removeAllCharacters();
      expect(gameManager.game.figures).toEqual([monster]);
      expect(entity.markers).toEqual([]);
    });
  });

  describe('visibility toggles', () => {
    beforeEach(() => {
      settingsManager.settings.characterAttackModifierDeckActiveBottom = false;
      settingsManager.settings.characterAttackModifierDeckPermanentActive = false;
    });

    it('shows the attack modifier deck hiding loot cards and hides it again', () => {
      const character = buildCharacter('test-char');
      character.lootCardsVisible = true;
      expect(characterManager.attackModifierDeckToggleHides(character)).toBe(false);
      characterManager.toggleAttackModifierDeckVisible(character);
      expect(character.attackModifierDeckVisible).toBe(true);
      expect(character.attackModifierDeck.active).toBe(true);
      expect(character.lootCardsVisible).toBe(false);
      expect(characterManager.attackModifierDeckToggleHides(character)).toBe(true);
      characterManager.toggleAttackModifierDeckVisible(character);
      expect(character.attackModifierDeckVisible).toBe(false);
      expect(character.attackModifierDeck.active).toBe(false);
    });

    it('keeps the deck of the active character open with permanent active decks', () => {
      settingsManager.settings.characterAttackModifierDeckPermanent = true;
      settingsManager.settings.characterAttackModifierDeckPermanentActive = true;
      const character = buildCharacter('test-char');
      character.active = true;
      character.attackModifierDeckVisible = true;
      expect(characterManager.attackModifierDeckToggleHides(character)).toBe(false);
      characterManager.toggleAttackModifierDeckVisible(character);
      expect(character.attackModifierDeckVisible).toBe(true);
    });

    it('docks only one deck at the bottom and falls back to the active character', () => {
      settingsManager.settings.characterAttackModifierDeckActiveBottom = true;
      settingsManager.settings.characterAttackModifierDeckPermanentActive = true;
      const character = buildCharacter('test-char');
      const active = buildCharacter('other-char');
      active.active = true;
      active.attackModifierDeckVisible = true;
      gameManager.game.figures = [character, active];
      characterManager.toggleAttackModifierDeckVisible(character);
      expect(character.attackModifierDeckVisible).toBe(true);
      expect(active.attackModifierDeckVisible).toBe(false);
      expect(characterManager.attackModifierDeckToggleHides(character)).toBe(true);
      characterManager.toggleAttackModifierDeckVisible(character);
      expect(character.attackModifierDeckVisible).toBe(false);
      expect(active.attackModifierDeckVisible).toBe(true);
    });

    it('shows loot cards hiding the attack modifier deck and toggles items', () => {
      const character = buildCharacter('test-char');
      character.attackModifierDeck.active = true;
      character.attackModifierDeckVisible = true;
      characterManager.toggleLootCardsVisible(character);
      expect(character.lootCardsVisible).toBe(true);
      expect(character.attackModifierDeckVisible).toBe(false);
      expect(character.attackModifierDeck.active).toBe(false);
      characterManager.toggleLootCardsVisible(character);
      expect(character.lootCardsVisible).toBe(false);
      characterManager.toggleItemsVisible(character);
      expect(character.itemsVisible).toBe(true);
    });

    it('syncs hidden flags through the model', () => {
      const character = buildCharacter('test-char');
      character.attackModifierDeckVisible = true;
      character.lootCardsVisible = true;
      character.itemsVisible = true;
      const model = character.toModel();
      model.attackModifierDeckVisible = false;
      model.lootCardsVisible = false;
      model.itemsVisible = false;
      character.fromModel(model);
      expect(character.attackModifierDeckVisible).toBe(false);
      expect(character.lootCardsVisible).toBe(false);
      expect(character.itemsVisible).toBe(false);
    });
  });

  describe('toggleActive', () => {
    beforeEach(() => {
      gameManager.game.state = GameState.next;
    });

    const initiativeRequired = settingsManager.settings.initiativeRequired;

    afterEach(() => {
      settingsManager.settings.activeSummons = false;
      settingsManager.settings.initiativeRequired = initiativeRequired;
      gameManager.game.state = GameState.draw;
    });

    it('refuses to start or end turns outside of the next phase', () => {
      const toggleFigure = vi.spyOn(gameManager.turnManager, 'toggleFigure').mockImplementation(() => {});
      const character = buildCharacter('test-char');
      character.initiative = 10;
      gameManager.game.state = GameState.draw;
      expect(characterManager.toggleActive(character)).toBe(false);
      character.active = true;
      expect(characterManager.toggleActive(character)).toBe(false);
      expect(toggleFigure).not.toHaveBeenCalled();
    });

    it('only starts turns of present characters, but always ends the active turn', () => {
      const toggleFigure = vi.spyOn(gameManager.turnManager, 'toggleFigure').mockImplementation(() => {});
      const character = buildCharacter('test-char');
      character.initiative = 10;
      character.exhausted = true;
      expect(characterManager.canActivate(character)).toBe(false);
      expect(characterManager.activate(character)).toBe(false);
      character.active = true;
      expect(characterManager.canActivate(character)).toBe(false);
      expect(characterManager.canDeactivate(character)).toBe(true);
      expect(characterManager.toggleActive(character)).toBe(true);
      expect(toggleFigure).toHaveBeenCalledTimes(1);
      character.active = false;
      expect(characterManager.deactivate(character)).toBe(false);
      character.exhausted = false;
      character.initiative = 0;
      settingsManager.settings.initiativeRequired = true;
      expect(characterManager.canActivate(character)).toBe(false);
    });

    it('skips characters which can not start their turn for the next figure', () => {
      const first = buildCharacter('test-char');
      const second = buildCharacter('other-char');
      first.initiative = 10;
      second.initiative = 20;
      first.exhausted = true;
      gameManager.game.figures = [first, second];
      expect(gameManager.turnManager.nextFigure()).toBe(second);
      first.exhausted = false;
      first.absent = true;
      expect(gameManager.turnManager.nextFigure()).toBe(second);
      first.absent = false;
      first.initiative = 0;
      settingsManager.settings.initiativeRequired = true;
      expect(gameManager.turnManager.nextFigure()).toBe(second);
      first.active = true;
      expect(gameManager.turnManager.nextFigure()).toBe(first);
    });

    it('activates summons acting after the turn before ending the turn', () => {
      settingsManager.settings.activeSummons = true;
      const toggleFigure = vi.spyOn(gameManager.turnManager, 'toggleFigure').mockImplementation(() => {});
      const character = buildCharacter('test-char');
      character.initiative = 10;
      character.active = true;
      const summon = new Summon('uuid', 'spirit', '1', 1, 1, SummonColor.blue);
      summon.afterTurn = true;
      character.summons = [summon];

      expect(characterManager.toggleActiveUndoInfos(character)[0]).toBe('summonInactive');
      expect(characterManager.toggleActiveUndoInfos(character)[2]).toBe('data.summon.spirit');
      characterManager.toggleActive(character);
      expect(summon.afterTurnActive).toBe(true);
      expect(toggleFigure).toHaveBeenCalledWith(character);
    });

    it('toggles the character without summon handling', () => {
      const toggleFigure = vi.spyOn(gameManager.turnManager, 'toggleFigure').mockImplementation(() => {});
      const character = buildCharacter('test-char');
      character.initiative = 10;
      expect(characterManager.toggleActiveUndoInfos(character)[0]).toBe('setActive');
      character.active = true;
      expect(characterManager.toggleActiveUndoInfos(character)[0]).toBe('unsetActive');
      characterManager.toggleActive(character);
      expect(toggleFigure).toHaveBeenCalledWith(character);
    });
  });

  describe('setPerk', () => {
    function shackles(): Character {
      const character = buildCharacter('shackles', 'fh');
      character.perks = Array.from({ length: 12 }, () => Object.assign(new Perk(), { count: 2 }));
      character.maxHealth = 10;
      return character;
    }

    beforeEach(() => {
      vi.spyOn(gameManager.attackModifierBuildManager, 'mergeAttackModifierDeck').mockReturnValue(true);
      vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      vi.spyOn(gameManager.characterManager, 'availablePerks').mockReturnValue(99);
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 0;
    });

    it('limits perks to available perk points and the setup phase unless forced', () => {
      const character = shackles();
      vi.mocked(gameManager.characterManager.availablePerks).mockReturnValue(1);
      expect(characterManager.canSetPerk(character, 0, 2)).toBe(false);
      expect(characterManager.canSetPerk(character, 0, 1)).toBe(true);
      expect(characterManager.canSetPerk(character, 0, 3, true)).toBe(false);
      expect(characterManager.canSetPerk(character, 20, 1, true)).toBe(false);
      gameManager.game.round = 1;
      expect(characterManager.setPerk(character, 0, 1)).toBe(false);
      expect(characterManager.canSetPerk(character, 0, 1, false, true)).toBe(true);
      expect(characterManager.setPerk(character, 0, 2, true)).toBe(true);
      gameManager.game.round = 0;
    });

    it('sets the perk value and rebuilds the character deck', () => {
      const character = buildCharacter('test-char');
      character.perks = [Object.assign(new Perk(), { count: 2 })];
      characterManager.setPerk(character, 0, 2);
      expect(character.progress.perks[0]).toBe(2);
      expect(gameManager.attackModifierBuildManager.mergeAttackModifierDeck).toHaveBeenCalled();
    });

    it('rebuilds the monster deck for monster deck perks', () => {
      const character = buildCharacter('test-char');
      character.perks = [Object.assign(new Perk(), { count: 1, monsterDeck: true })];
      const build = vi.spyOn(gameManager.attackModifierBuildManager, 'buildMonsterAttackModifierDeck');
      characterManager.setPerk(character, 0, 1);
      expect(build).toHaveBeenCalled();
      expect(gameManager.attackModifierBuildManager.mergeAttackModifierDeck).not.toHaveBeenCalled();
    });

    it('removes the special action of a perk once the perk is no longer complete', () => {
      const character = buildCharacter('test-char');
      character.perks = [Object.assign(new Perk(), { count: 2 })];
      character.specialActions = [{ name: 'perk-action', perk: 1 } as CharacterSpecialAction];
      characterManager.setPerk(character, 0, 2);
      character.tags = ['perk-action'];
      characterManager.setPerk(character, 0, 1);
      expect(character.tags).toEqual([]);
    });

    it('raises and lowers the Shackles max health exactly once for the full perk', () => {
      const character = shackles();
      characterManager.setPerk(character, 11, 2);
      expect(character.maxHealth).toBe(15);
      characterManager.setPerk(character, 11, 2);
      expect(character.maxHealth).toBe(15);
      characterManager.setPerk(character, 11, 1);
      expect(character.maxHealth).toBe(10);
      expect(character.health).toBe(10);
    });
  });

  describe('setLevel', () => {
    function buildLeveledCharacter(levels: [number, number][]): Character {
      const data = buildCharacterData({
        name: 'test-char',
        edition: 'gh',
        stats: levels.map(([level, health]) => new CharacterStat(level, health))
      });
      return new Character(data, levels[0][0]);
    }

    it('updates level/stat/maxHealth from the matching stat', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);

      characterManager.setLevel(character, 2);

      expect(character.level).toBe(2);
      expect(character.maxHealth).toBe(14);
      expect(character.stat.level).toBe(2);
    });

    it('records a stat error and zeroes maxHealth when no stat matches the requested level', () => {
      const character = buildLeveledCharacter([[1, 10]]);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      characterManager.setLevel(character, 5);

      expect(character.maxHealth).toBe(0);
      expect(character.errors?.some((e) => e.type === FigureErrorType.stat)).toBe(true);
    });

    it('sets health to the new maxHealth when the character was previously at full health', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);
      character.health = 10; // == old maxHealth

      characterManager.setLevel(character, 2);

      expect(character.health).toBe(14);
    });

    it('clamps health down when it would otherwise exceed the new (lower) maxHealth', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 6]
      ]);
      character.health = 8; // below old maxHealth 10, but above new maxHealth 6

      characterManager.setLevel(character, 2);

      expect(character.health).toBe(6);
    });

    it('leaves a non-full health value untouched when it still fits under the new maxHealth', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);
      character.health = 5; // damaged, still fits under 14

      characterManager.setLevel(character, 2);

      expect(character.health).toBe(5);
    });

    it('clamps out-of-range experience back to the xpMap floor for the new level', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);
      character.progress.experience = 999999; // absurdly above the level-2 xp ceiling

      characterManager.setLevel(character, 2);

      expect(character.progress.experience).toBe(characterManager.xpMap[1]);
    });

    it('rebuilds the attack modifier deck for a bb character', () => {
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);
      character.editionRules = 'bb';
      const buildSpy = vi
        .spyOn(gameManager.attackModifierBuildManager, 'buildCharacterAttackModifierDeck')
        .mockReturnValue('rebuilt-deck' as any);

      characterManager.setLevel(character, 2);

      expect(buildSpy).toHaveBeenCalledWith(character);
      expect(character.attackModifierDeck).toBe('rebuilt-deck');
    });

    it('recalculates the scenario level when levelCalculation is enabled', () => {
      gameManager.game.levelCalculation = true;
      const character = buildLeveledCharacter([
        [1, 10],
        [2, 14]
      ]);
      const calcSpy = vi.spyOn(gameManager.levelManager, 'calculateScenarioLevel').mockImplementation(() => {});

      characterManager.setLevel(character, 2);

      expect(calcSpy).toHaveBeenCalled();
    });
  });

  describe('next', () => {
    it('resets initiative/lootCardsVisible/longRest and turns the figure back on', () => {
      const character = buildCharacter('test-char');
      character.initiative = 30;
      character.initiativeVisible = true;
      character.off = true;
      character.lootCardsVisible = true;
      character.longRest = true;
      gameManager.game.figures = [character];

      characterManager.next();

      expect(character.initiative).toBe(0);
      expect(character.initiativeVisible).toBe(false);
      expect(character.off).toBe(false);
      expect(character.lootCardsVisible).toBe(false);
      expect(character.longRest).toBe(false);
    });

    it('hides the attack modifier deck unless characterAttackModifierDeckPermanent is set', () => {
      settingsManager.settings.characterAttackModifierDeckPermanent = false;
      const character = buildCharacter('test-char');
      character.attackModifierDeckVisible = true;
      gameManager.game.figures = [character];

      characterManager.next();

      expect(character.attackModifierDeckVisible).toBe(false);
    });

    it('keeps the attack modifier deck visible when characterAttackModifierDeckPermanent is set', () => {
      settingsManager.settings.characterAttackModifierDeckPermanent = true;
      const character = buildCharacter('test-char');
      character.attackModifierDeckVisible = true;
      gameManager.game.figures = [character];

      characterManager.next();

      expect(character.attackModifierDeckVisible).toBe(true);
    });

    it('removes summons that are no longer alive', () => {
      const character = buildCharacter('test-char');
      const deadSummon = new Summon('s1', 'imp', '1', 1, 1, SummonColor.blue);
      deadSummon.dead = true;
      character.summons = [deadSummon];
      gameManager.game.figures = [character];

      characterManager.next();

      expect(character.summons).not.toContain(deadSummon);
    });

    it('resets active summon flags and promotes a "new" summon to "true" state', () => {
      const character = buildCharacter('test-char');
      const summon = new Summon('s1', 'imp', '1', 1, 1, SummonColor.blue);
      summon.active = true;
      summon.afterTurnActive = true;
      summon.off = true;
      summon.state = SummonState.new;
      character.summons = [summon];
      gameManager.game.figures = [character];

      characterManager.next();

      expect(summon.active).toBe(false);
      expect(summon.afterTurnActive).toBe(false);
      expect(summon.off).toBe(false);
      expect(summon.state).toBe(SummonState.true);
    });

    it('clears round-scoped "roundAction-" tags', () => {
      const character = buildCharacter('test-char');
      character.tags = ['roundAction-something', 'keep-me'];
      gameManager.game.figures = [character];

      characterManager.next();

      expect(character.tags).toEqual(['keep-me']);
    });

    it('ignores non-character figures', () => {
      const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh' }), 1);
      gameManager.game.figures = [monster];

      expect(() => characterManager.next()).not.toThrow();
    });
  });

  describe('draw', () => {
    it('applies donations and reveals initiative only on round 1', () => {
      gameManager.game.round = 1;
      const character = buildCharacter('test-char');
      character.donations = 1;
      character.initiativeVisible = false;
      gameManager.game.figures = [character];
      const donationSpy = vi.spyOn(characterManager, 'applyDonations');

      characterManager.draw();

      expect(donationSpy).toHaveBeenCalledWith(character);
      expect(character.initiativeVisible).toBe(true);
    });

    it('does not apply donations or reveal initiative on later rounds', () => {
      gameManager.game.round = 2;
      const character = buildCharacter('test-char');
      character.initiativeVisible = false;
      gameManager.game.figures = [character];
      const donationSpy = vi.spyOn(characterManager, 'applyDonations');

      characterManager.draw();

      expect(donationSpy).not.toHaveBeenCalled();
      expect(character.initiativeVisible).toBe(false);
    });

    it('turns a living, non-absent figure back on', () => {
      gameManager.game.round = 2;
      const character = buildCharacter('test-char');
      character.off = true;
      character.health = 10;
      character.absent = false;
      gameManager.game.figures = [character];

      characterManager.draw();

      expect(character.off).toBe(false);
    });

    it('leaves an absent figure off untouched', () => {
      gameManager.game.round = 2;
      const character = buildCharacter('test-char');
      character.off = true;
      character.absent = true;
      gameManager.game.figures = [character];

      characterManager.draw();

      expect(character.off).toBe(true);
    });

    it('leaves a dead (0 health) figure off untouched', () => {
      gameManager.game.round = 2;
      const character = buildCharacter('test-char');
      character.off = true;
      character.health = 0;
      gameManager.game.figures = [character];

      characterManager.draw();

      expect(character.off).toBe(true);
    });
  });
});

describe('CharacterManager regressions', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.levelCalculation = false;
  });

  it('removeCharacter removes only the marker of the removed character', () => {
    const removed = buildCharacter('a', 'gh', { marker: true });
    const other = buildCharacter('b', 'gh', { marker: true });
    const marked = buildCharacter('c');
    marked.markers = ['gh-b'];
    gameManager.game.figures = [removed, other, marked];

    gameManager.characterManager.removeCharacter(removed);

    expect(marked.markers).toEqual(['gh-b']);
  });

  it('setLevel with FH item 3 equipped does not heal on every call', () => {
    const character = buildCharacter('c');
    character.progress.equippedItems = [new AdditionalIdentifier('3', 'fh')];
    gameManager.characterManager.setLevel(character, 1);
    character.health = 5;

    gameManager.characterManager.setLevel(character, 1);
    gameManager.characterManager.setLevel(character, 1);

    expect(character.maxHealth).toEqual(11);
    expect(character.health).toEqual(5);
  });
});

describe('CharacterManager XP regressions', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.levelCalculation = false;
  });

  it('addXP never drops the experience below zero or the level below 1', () => {
    const character = buildCharacter('brute');
    gameManager.game.figures = [character];

    gameManager.characterManager.addXP(character, -5);

    expect(character.progress.experience).toBe(0);
    expect(character.level).toBe(1);
    expect(character.maxHealth).toBe(10);
  });
});

describe('CharacterManager unlockCharacter', () => {
  const characterManager = gameManager.characterManager;

  beforeEach(() => {
    gameManager.game.unlockedCharacters = [];
    settingsManager.settings.events = true;
    vi.spyOn(gameManager.editionManager, 'charactersData').mockReturnValue([
      Object.assign(new CharacterData(), { name: 'squidface', edition: 'gh', unlockEvent: 'city:81' })
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    settingsManager.settings.events = false;
  });

  it('unlocks a character once with its unlock events', () => {
    const addEvents = vi.spyOn(gameManager.eventCardManager, 'addEvents').mockImplementation(() => {});
    expect(characterManager.unlockCharacter('gh', 'squidface')).toBe(true);
    expect(characterManager.unlockCharacter('gh', 'squidface')).toBe(false);
    expect(gameManager.game.unlockedCharacters).toEqual(['gh:squidface']);
    expect(addEvents).toHaveBeenCalledTimes(1);
    expect(addEvents).toHaveBeenCalledWith('city:81');

    characterManager.lockCharacter('gh', 'squidface');
    expect(characterManager.characterUnlocked('gh', 'squidface')).toBe(false);
  });

  it('skips unlock events without the events setting', () => {
    settingsManager.settings.events = false;
    const addEvents = vi.spyOn(gameManager.eventCardManager, 'addEvents').mockImplementation(() => {});
    characterManager.unlockCharacter('gh', 'squidface');
    expect(addEvents).not.toHaveBeenCalled();
  });
});

describe('SummonManager summon setup', () => {
  function summon(): Summon {
    const result = new Summon('uuid', 'spirit', '1', 1, 1, SummonColor.blue);
    result.maxHealth = 4;
    result.health = 4;
    result.attack = 2;
    result.movement = 1;
    result.range = 0;
    result.init = true;
    return result;
  }

  afterEach(() => vi.restoreAllMocks());

  it('initializes a summon with its changed stats', () => {
    const character = new Character(
      Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
      1
    );
    const value = summon();
    character.summons = [value];
    gameManager.summonManager.initSummon(character, value, { maxHp: 2, attack: 1, movement: 2, range: 1 });
    expect(value.init).toBe(false);
    expect([value.maxHealth, value.health, value.attack, value.movement, value.range]).toEqual([6, 6, 3, 3, 1]);
    expect(character.summons).toEqual([value]);
  });

  it('changes summon stats and ignores non numeric attacks', () => {
    const value = summon();
    gameManager.summonManager.changeSummonStat(value, 'attack', 2);
    gameManager.summonManager.changeSummonStat(value, 'trapDamage', 1);
    gameManager.summonManager.changeSummonStat(value, 'maxHp', -1);
    expect([value.attack, value.movement, value.maxHealth]).toEqual([4, 2, 3]);
    value.attack = 'X';
    gameManager.summonManager.changeSummonStat(value, 'attack', 1);
    expect(value.attack).toBe('X');
  });
});

describe('CharacterManager party characters and donations', () => {
  const characterManager = gameManager.characterManager;

  function build(name: string, number: number): Character {
    const character = new Character(Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
    character.number = number;
    return character;
  }

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.availableCharacters = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.donations = 0;
    gameManager.game.round = 0;
  });

  afterEach(() => vi.restoreAllMocks());

  it('sets characters aside and replays them by player number', () => {
    const brute = build('brute', 1);
    const tinkerer = build('tinkerer', 1);
    gameManager.game.figures = [brute];
    characterManager.setAsideCharacter(brute);
    expect(gameManager.game.figures).toEqual([]);
    expect(gameManager.game.party.availableCharacters.map((model) => model.name)).toEqual(['brute']);

    gameManager.game.figures = [tinkerer];
    characterManager.replayCharacter(build('brute', 1));
    expect(gameManager.game.figures.map((figure) => (figure as Character).name)).toEqual(['brute']);
    expect(gameManager.game.party.availableCharacters.map((model) => model.name)).toEqual(['tinkerer']);
  });

  it('donates with edition costs and tracks personal quest progress', () => {
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
    vi.spyOn(gameManager, 'editionRules').mockReturnValue(false);
    const track = vi.spyOn(gameManager.personalQuestManager, 'trackPersonalQuestProgress').mockImplementation(() => {});
    const brute = build('brute', 1);
    brute.progress.gold = 15;
    expect(characterManager.donationCosts()).toBe(10);
    expect(characterManager.canDonate(brute)).toBe(true);
    expect(characterManager.donate(brute)).toBe(true);
    expect(brute.progress.gold).toBe(5);
    expect(brute.progress.donations).toBe(1);
    expect(gameManager.game.party.donations).toBe(1);
    expect(track).toHaveBeenCalledTimes(2);
    expect(characterManager.canDonate(brute)).toBe(false);
    expect(characterManager.donate(brute)).toBe(false);
    expect(brute.progress.gold).toBe(5);
    gameManager.game.round = 1;
    brute.progress.gold = 50;
    expect(characterManager.canDonate(brute)).toBe(false);
  });
});

describe('CharacterManager progress checks', () => {
  const characterManager = gameManager.characterManager;

  function character(): Character {
    return new Character(Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
  }

  afterEach(() => vi.restoreAllMocks());

  it('limits levels, masteries and progress values', () => {
    const brute = character();
    expect(characterManager.canSetLevel(brute, 0)).toBe(false);
    expect(characterManager.canSetLevel(brute, 10)).toBe(false);
    expect(characterManager.canSetLevel(brute, 9)).toBe(true);
    expect(characterManager.setLevel(brute, 1.5)).toBe(false);

    brute.masteries = ['a', 'b'];
    expect(characterManager.setMastery(brute, 2, true)).toBe(false);
    expect(characterManager.setMastery(brute, 1, true)).toBe(true);
    expect(characterManager.setMastery(brute, 1, true)).toBe(false);
    expect(brute.progress.masteries).toEqual([1]);

    expect(characterManager.setProgressValue(brute, 'battleGoals', 19)).toBe(false);
    expect(characterManager.setProgressValue(brute, 'battleGoals', 18)).toBe(true);
    expect(characterManager.setProgressValue(brute, 'gold', -1)).toBe(false);
    expect(characterManager.setProgressValue(brute, 'notes', 5)).toBe(false);
    expect(characterManager.setProgressValue(brute, 'notes', 'text')).toBe(true);
    expect(brute.progress.battleGoals).toBe(18);
    expect(brute.progress.notes).toBe('text');
    expect(characterManager.canChangeExperience(brute, 0)).toBe(false);
    expect(characterManager.canAddXP(brute, 0.5)).toBe(false);
  });

  it('selects, deselects and keeps battle goals by index', () => {
    const brute = character();
    brute.battleGoals = [new Identifier('1', 'gh'), new Identifier('2', 'gh')];
    expect(gameManager.battleGoalManager.selectBattleGoal(brute, 2)).toBe(false);
    expect(gameManager.battleGoalManager.selectBattleGoal(brute, 1)).toBe(true);
    expect(brute.battleGoal).toBe(true);
    expect(brute.battleGoals.map((identifier) => identifier.name)).toEqual(['2', '1']);
    expect(gameManager.battleGoalManager.selectBattleGoal(brute, -1)).toBe(true);
    expect(brute.battleGoal).toBe(false);
    vi.spyOn(gameManager.trialsManager, 'characterTrial').mockReturnValue(true);
    expect(gameManager.battleGoalManager.selectBattleGoal(brute, -1)).toBe(true);
    expect(brute.battleGoal).toBe(true);
  });

  it('limits personal quest progress to the requirements of the quest', () => {
    const brute = character();
    expect(gameManager.personalQuestManager.canSetProgress(brute, 3, 1)).toBe(true);
    brute.progress.personalQuest = '1';
    vi.spyOn(gameManager.personalQuestManager, 'personalQuestByCard').mockReturnValue(
      Object.assign(new PersonalQuest(), { requirements: [new PersonalQuestRequirement()] })
    );
    expect(gameManager.personalQuestManager.setProgress(brute, 1, 1)).toBe(false);
    expect(gameManager.personalQuestManager.setProgress(brute, 0, -1)).toBe(false);
    expect(gameManager.personalQuestManager.setProgress(brute, 0, 2)).toBe(true);
    expect(brute.progress.personalQuestProgress).toEqual([2]);
  });

  it('assigns only existing, unassigned trials', () => {
    const brute = character();
    vi.spyOn(gameManager.trialsManager, 'trialsEditionData').mockReturnValue({ trials: [] } as never);
    vi.spyOn(gameManager.trialsManager, 'trialCardExists').mockImplementation((cardId) => cardId === 351);
    vi.spyOn(gameManager.trialsManager, 'trialAssigned').mockReturnValue(false);
    expect(gameManager.trialsManager.canSetTrial(brute, 352)).toBe(false);
    expect(gameManager.trialsManager.canSetTrial(brute, 351)).toBe(true);
    vi.mocked(gameManager.trialsManager.trialAssigned).mockReturnValue(true);
    expect(gameManager.trialsManager.setTrial(brute, 351)).toBe(false);
  });
});

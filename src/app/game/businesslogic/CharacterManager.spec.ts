import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { FigureErrorType } from 'src/app/game/model/data/FigureError';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { Perk } from 'src/app/game/model/data/Perks';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

// This spec covers the small, clearly-scoped helpers (icon/color/thumbnail lookups, xp -> level
// mapping, the "ignore negative X" perk checks, itemEffect() and enhancementMapping()), plus the
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
    gameManager.editionData = [];
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
      gameManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'brute', edition: 'gh', icon: 'gh-brute-icon' })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterIcon('brute', 'gh')).toEqual('./assets/images/character/icons/gh-brute-icon.svg');
    });
  });

  describe('characterIdentityIcon', () => {
    it('falls back to characterIcon when the character has no identities', () => {
      gameManager.editionData = [
        new EditionData('gh', [buildCharacterData({ name: 'brute', edition: 'gh', icon: 'gh-brute' })], [], [], [], [], [])
      ];
      settingsManager.settings.editions = ['gh'];
      expect(characterManager.characterIdentityIcon('brute', 0)).toEqual('./assets/images/character/icons/gh-brute.svg');
    });

    it('builds an identity-specific icon path when identities exist', () => {
      gameManager.editionData = [
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
      gameManager.editionData = [
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

  describe('enhancementMapping', () => {
    it('collects an actionId per enhancementType-carrying action, recursing into subActions', () => {
      const nested = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });
      const withEnhancement = Object.assign(new Action(ActionType.attack, 2), { enhancementTypes: ['attack'] });
      const withSubActions = Object.assign(new Action(ActionType.move, 2), { subActions: [nested] });

      const mapping = characterManager.enhancementMapping([withEnhancement, withSubActions], '');

      expect(mapping).toEqual(['0', '1-0']);
    });

    it('skips the wip placeholder action entirely', () => {
      const wip = new Action(ActionType.custom, '%character.abilities.wip%');
      const real = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });

      const mapping = characterManager.enhancementMapping([wip, real], '');

      expect(mapping).toEqual(['1']);
    });

    it('prefixes actionIds with the parentIndex (e.g. for bottom actions)', () => {
      const action = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });
      expect(characterManager.enhancementMapping([action], 'bottom')).toEqual(['bottom-0']);
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

  describe('personalQuestByCard', () => {
    it('finds a personal quest by cardId within the resolved edition', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '101', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [pq] })];
      settingsManager.settings.editions = ['gh'];

      expect(characterManager.personalQuestByCard('gh', '101')).toBe(pq);
    });

    it('also matches by altId', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '101', altId: '201', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [pq] })];
      settingsManager.settings.editions = ['gh'];

      expect(characterManager.personalQuestByCard('gh', '201')).toBe(pq);
    });

    it('returns undefined when no personal quest matches', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [] })];
      settingsManager.settings.editions = ['gh'];

      expect(characterManager.personalQuestByCard('gh', '999')).toBeUndefined();
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
      vi.spyOn(gameManager, 'prosperityLevel').mockReturnValue(2);
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
      character.bb = true;
      const buildSpy = vi
        .spyOn(gameManager.attackModifierManager, 'buildCharacterAttackModifierDeck')
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

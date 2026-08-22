import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ElementModel, ElementState, Element as GhsElement } from 'src/app/game/model/data/Element';
import { FigureErrorType } from 'src/app/game/model/data/FigureError';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameClockTimestamp } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

// GameManager owns the central Game object plus a large collection of mostly-pure lookup
// helpers over `editionData`. These tests exercise those helpers directly; they populate
// `gameManager.editionData` / `settingsManager.settings.editions` with small fixtures
// instead of loading real game data.

function buildEdition(edition: string, overrides: Partial<EditionData> = {}): EditionData {
  const data = new EditionData(edition, [], [], [], [], [], []);
  return Object.assign(data, overrides);
}

function buildCharacter(name: string, edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), {
    name,
    edition,
    stats: [new CharacterStat(1, 10)]
  });
  return new Character(data, 1);
}

function buildMonster(name: string, edition: string = 'gh'): Monster {
  const data = Object.assign(new MonsterData(), { name, edition });
  return new Monster(data, 1);
}

describe('GameManager', () => {
  beforeEach(() => {
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
    gameManager.game.figures = [];
    gameManager.game.edition = undefined;
    gameManager.game.scenario = undefined;
    gameManager.game.party.prosperity = 0;
    gameManager.game.party.donations = 0;
    gameManager.game.party.envelopeB = false;
    gameManager.game.party.imbuement = 0;
  });

  describe('editions / editionsData / editionLogo', () => {
    it('only returns editions enabled in settings by default', () => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('fh')];
      settingsManager.settings.editions = ['gh'];
      expect(gameManager.editions()).toEqual(['gh']);
    });

    it('excludes content-type editions unless extraContent is requested', () => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('extra', { type: 'content' })];
      settingsManager.settings.editions = ['gh', 'extra'];
      expect(gameManager.editions()).toEqual(['gh']);
      expect(gameManager.editions(false, true)).toEqual(['gh', 'extra']);
    });

    it('all=true ignores the settings.editions allow-list but still filters content type', () => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('extra', { type: 'content' })];
      settingsManager.settings.editions = [];
      expect(gameManager.editions(true)).toEqual(['gh']);
      expect(gameManager.editions(true, true)).toEqual(['gh', 'extra']);
    });

    it('editionsData returns the full EditionData objects for the resolved editions', () => {
      const gh = buildEdition('gh');
      gameManager.editionData = [gh, buildEdition('fh')];
      settingsManager.settings.editions = ['gh'];
      expect(gameManager.editionsData()).toEqual([gh]);
    });

    it('editionLogo returns the logoUrl when present', () => {
      gameManager.editionData = [buildEdition('gh', { logoUrl: 'logo.png' })];
      expect(gameManager.editionLogo('gh')).toEqual('logo.png');
    });

    it('editionLogo returns an empty string for an unknown edition', () => {
      gameManager.editionData = [];
      expect(gameManager.editionLogo('unknown')).toEqual('');
    });
  });

  describe('currentEdition', () => {
    it('prefers game.edition when set', () => {
      gameManager.game.edition = 'fh';
      expect(gameManager.currentEdition()).toEqual('fh');
    });

    it('falls back to the active scenario edition', () => {
      gameManager.game.edition = undefined;
      gameManager.game.scenario = { edition: 'jotl' } as any;
      expect(gameManager.currentEdition()).toEqual('jotl');
    });

    it('falls back to the shared edition of all character figures', () => {
      gameManager.game.edition = undefined;
      gameManager.game.scenario = undefined;
      gameManager.game.figures = [buildCharacter('brute', 'gh'), buildCharacter('spellweaver', 'gh')];
      expect(gameManager.currentEdition()).toEqual('gh');
    });

    it('does not use character edition when characters are mixed', () => {
      gameManager.game.edition = undefined;
      gameManager.game.scenario = undefined;
      gameManager.game.figures = [buildCharacter('brute', 'gh'), buildCharacter('pyroclast', 'fh')];
      gameManager.editionData = [buildEdition('gh')];
      settingsManager.settings.editions = ['gh'];
      expect(gameManager.currentEdition()).toEqual('gh'); // falls back to editions()[0]
    });

    it('uses the provided fallback when nothing else resolves', () => {
      gameManager.game.edition = undefined;
      gameManager.game.scenario = undefined;
      gameManager.game.figures = [];
      gameManager.editionData = [];
      expect(gameManager.currentEdition('customFallback')).toEqual('customFallback');
    });
  });

  describe('isEditionRelevant / relevantEditions', () => {
    beforeEach(() => {
      gameManager.editionData = [
        buildEdition('gh'),
        buildEdition('fh-crossover', { type: 'extension', extends: ['gh'] }),
        buildEdition('content-a', { type: 'content', extends: ['gh'] })
      ];
      settingsManager.settings.editions = ['gh', 'fh-crossover', 'content-a'];
    });

    it('relevantEditions includes the edition itself, its dependencies and matching content', () => {
      expect(gameManager.relevantEditions('gh')).toEqual(['gh', 'content-a']);
    });

    it('relevantEditions for an extension includes the base edition it extends', () => {
      expect(gameManager.relevantEditions('fh-crossover')).toEqual(['fh-crossover', 'gh']);
    });

    it('isEditionRelevant is true when the other edition is a dependency of the given edition', () => {
      expect(gameManager.isEditionRelevant('gh', 'fh-crossover')).toBe(true);
    });

    it('isEditionRelevant is true for content attached to the given edition', () => {
      expect(gameManager.isEditionRelevant('content-a', 'gh')).toBe(true);
    });

    it('isEditionRelevant is false for content attached to a different edition', () => {
      expect(gameManager.isEditionRelevant('content-a', 'fh-crossover')).toBe(false);
    });

    it('isEditionRelevant is false when the other edition is unknown', () => {
      expect(gameManager.isEditionRelevant('does-not-exist', 'gh')).toBe(false);
    });

    it('isEditionRelevant is false when the other edition is not enabled in settings', () => {
      settingsManager.settings.editions = ['gh'];
      expect(gameManager.isEditionRelevant('fh-crossover', 'gh')).toBe(false);
    });

    it('isEditionRelevant is true regardless of context when no edition is given (and other is enabled)', () => {
      expect(gameManager.isEditionRelevant('fh-crossover', undefined)).toBe(true);
    });
  });

  describe('newItemStyle / newAmStyle', () => {
    it('returns false for an unknown edition', () => {
      expect(gameManager.newItemStyle('unknown')).toBe(false);
    });

    it('returns true when the edition itself declares the new style', () => {
      gameManager.editionData = [buildEdition('gh2e', { newItemStyle: true })];
      expect(gameManager.newItemStyle('gh2e')).toBe(true);
    });

    it('inherits the new style from an extended edition', () => {
      gameManager.editionData = [
        buildEdition('gh2e', { newItemStyle: true }),
        buildEdition('gh2e-ext', { type: 'extension', extends: ['gh2e'] })
      ];
      expect(gameManager.newItemStyle('gh2e-ext')).toBe(true);
    });

    it('newAmStyle mirrors the same inheritance logic independently of newItemStyle', () => {
      gameManager.editionData = [buildEdition('gh2e', { newAmStyle: true })];
      expect(gameManager.newAmStyle('gh2e')).toBe(true);
      expect(gameManager.newItemStyle('gh2e')).toBe(false);
    });
  });

  describe('fhRules / bbRules / gh2eRules / editionRules', () => {
    beforeEach(() => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('fh'), buildEdition('bb'), buildEdition('gh2e')];
      settingsManager.settings.editions = ['gh', 'fh', 'bb', 'gh2e'];
    });

    it('fhRules is true when the current edition is fh', () => {
      gameManager.game.edition = 'fh';
      expect(gameManager.fhRules()).toBe(true);
      expect(gameManager.bbRules()).toBe(false);
    });

    it('bbRules is true when the current edition is bb', () => {
      gameManager.game.edition = 'bb';
      expect(gameManager.bbRules()).toBe(true);
    });

    it('gh2eRules is true when the current edition is gh2e', () => {
      gameManager.game.edition = 'gh2e';
      expect(gameManager.gh2eRules()).toBe(true);
    });

    it('fhRules(true) additionally matches gh2e when requested', () => {
      gameManager.game.edition = 'gh2e';
      expect(gameManager.fhRules(false)).toBe(false);
      expect(gameManager.fhRules(true)).toBe(true);
    });

    it('editionRules(edition, false) reads the raw game.edition, bypassing scenario/character fallback', () => {
      // No game.edition is set; currentEdition() falls back to the active scenario's
      // edition ('fh'), against which 'gh' is not relevant -> editionRules(..., true) is false.
      // editionRules(..., false) instead checks isEditionRelevant('gh', this.game.edition)
      // directly with the raw (undefined) game.edition. isEditionRelevant treats "no edition
      // context" as "no restriction" (see the `!edition ||` short-circuit), so this resolves
      // to true purely because 'gh' is an enabled+known edition, regardless of the scenario.
      // This asymmetry is a quirk worth knowing about when calling editionRules(x, false)
      // before game.edition has been assigned.
      gameManager.game.edition = undefined;
      gameManager.game.scenario = { edition: 'fh' } as any;
      expect(gameManager.editionRules('gh', true)).toBe(false);
      expect(gameManager.editionRules('gh', false)).toBe(true);
    });
  });

  describe('prosperityLevel / prosperityTicks', () => {
    beforeEach(() => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('cs'), buildEdition('gh2e')];
    });

    it('prosperityTicks equals raw prosperity outside of gh/cs/gh2e envelope rules', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 5;
      gameManager.game.party.envelopeB = false;
      expect(gameManager.prosperityTicks()).toEqual(5);
    });

    it('adds an envelope-B tick plus donation ticks under gh rules', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 2;
      gameManager.game.party.envelopeB = true;
      gameManager.game.party.donations = 15;
      // 2 (base) + 1 (envelopeB) + floor(min(15-10,30)/5)=1 => 4
      expect(gameManager.prosperityTicks()).toEqual(4);
    });

    it('starts gh2e prosperity at 1', () => {
      settingsManager.settings.editions = ['gh2e'];
      gameManager.game.edition = 'gh2e';
      expect(gameManager.prosperityTicks()).toEqual(1);
    });

    it('applies gh2e donation and imbuement based ticks without an envelope bonus', () => {
      settingsManager.settings.editions = ['gh2e'];
      gameManager.game.edition = 'gh2e';
      gameManager.game.party.prosperity = 1;
      gameManager.game.party.donations = 12;
      gameManager.game.party.imbuement = 15;
      // 1 (initial) + 1 + floor(min(12,100)/5)=2 + floor(min(15+5,80)/10)=2 => 6
      expect(gameManager.prosperityTicks()).toEqual(6);
    });

    it('prosperityLevel increases once ticks pass a GH prosperity step', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 4; // > step 3, <= step 8
      expect(gameManager.prosperityLevel()).toEqual(2);
    });

    it('prosperityLevel starts at 1 when no steps are passed', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 1;
      expect(gameManager.prosperityLevel()).toEqual(1);
    });
  });

  describe('figure type guards', () => {
    it('isCharacter / isMonster / isObjectiveContainer distinguish figure types', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      const objective = new ObjectiveContainer('uuid-1');

      expect(gameManager.isCharacter(character)).toBe(true);
      expect(gameManager.isCharacter(monster)).toBe(false);
      expect(gameManager.isMonster(monster)).toBe(true);
      expect(gameManager.isMonster(character)).toBe(false);
      expect(gameManager.isObjectiveContainer(objective)).toBe(true);
      expect(gameManager.isObjectiveContainer(character)).toBe(false);
    });

    it('toCharacter / toMonster perform an identity cast', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      expect(gameManager.toCharacter(character)).toBe(character);
      expect(gameManager.toMonster(monster)).toBe(monster);
    });
  });

  describe('hasBottomAbility', () => {
    it('is false for undefined ability', () => {
      expect(gameManager.hasBottomAbility(undefined)).toBe(false);
    });

    it('is false when bottomActions is empty', () => {
      expect(gameManager.hasBottomAbility({ bottomActions: [] } as any)).toBe(false);
    });

    it('is true when bottomActions has entries', () => {
      expect(gameManager.hasBottomAbility({ bottomActions: [{}] } as any)).toBe(true);
    });
  });

  describe('sortFiguresByTypeAndName', () => {
    it('sorts characters before monsters', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      expect(gameManager.sortFiguresByTypeAndName(character, monster)).toEqual(-1);
      expect(gameManager.sortFiguresByTypeAndName(monster, character)).toEqual(1);
    });

    it('reverses character/monster order when reverse is true', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      expect(gameManager.sortFiguresByTypeAndName(character, monster, true)).toEqual(1);
    });

    it('sorts figures with off=true after figures with off=false', () => {
      const a = buildCharacter('brute');
      const b = buildCharacter('spellweaver');
      a.off = true;
      expect(gameManager.sortFiguresByTypeAndName(a, b)).toEqual(1);
      expect(gameManager.sortFiguresByTypeAndName(b, a)).toEqual(-1);
    });

    it('falls back to alphabetic name comparison for two monsters', () => {
      const a = buildMonster('bandit-archer');
      const b = buildMonster('bandit-guard');
      // settingsManager.getLabel falls back to the raw key when no label data is loaded,
      // so 'data.monster.bandit-archer' < 'data.monster.bandit-guard' alphabetically.
      expect(gameManager.sortFiguresByTypeAndName(a, b)).toEqual(-1);
      expect(gameManager.sortFiguresByTypeAndName(b, a)).toEqual(1);
    });
  });

  describe('markers', () => {
    it('lists edition-name identifiers of characters carrying a marker', () => {
      const a = buildCharacter('brute', 'gh');
      const b = buildCharacter('spellweaver', 'gh');
      a.marker = true;
      gameManager.game.figures = [a, b];
      expect(gameManager.markers()).toEqual(['gh-brute']);
    });

    it('excludes absent characters', () => {
      const a = buildCharacter('brute', 'gh');
      a.marker = true;
      a.absent = true;
      gameManager.game.figures = [a];
      expect(gameManager.markers()).toEqual([]);
    });
  });

  describe('additionalIdentifier', () => {
    it('builds a character identifier', () => {
      const character = buildCharacter('brute', 'gh');
      character.tags = ['tag1'];
      const identifier = gameManager.additionalIdentifier(character);
      expect(identifier.name).toEqual('brute');
      expect(identifier.edition).toEqual('gh');
      expect(identifier.type).toEqual('character');
      expect(identifier.tags).toEqual(['tag1']);
    });

    it('builds a monster identifier, including entity marker/tags when given an entity', () => {
      const monster = buildMonster('bandit-guard', 'gh');
      const entity = new MonsterEntity(1, MonsterType.normal, monster);
      entity.marker = 'm1';
      entity.tags = ['t1'];
      const identifier = gameManager.additionalIdentifier(monster, entity);
      expect(identifier.name).toEqual('bandit-guard');
      expect(identifier.type).toEqual('monster');
      expect(identifier.marker).toEqual('m1');
      expect(identifier.tags).toEqual(['t1']);
    });

    it('builds an objective identifier using "objective" or "escort" as the edition slot', () => {
      const objective = new ObjectiveContainer('uuid-1');
      objective.name = 'chest';
      const identifier = gameManager.additionalIdentifier(objective);
      expect(identifier.edition).toEqual('objective');
      expect(identifier.type).toEqual('objective');
    });
  });

  describe('getCharacterData / getMonsterData (unknown fallback)', () => {
    it('returns a placeholder CharacterData with an unknown-figure error for an unmatched name', () => {
      gameManager.editionData = [];
      const data = gameManager.getCharacterData('does-not-exist', 'gh');
      expect(data.name).toEqual('does-not-exist');
      expect(data.errors && data.errors.some((e) => e.type === FigureErrorType.unknown)).toBe(true);
    });

    it('returns a placeholder MonsterData with an unknown-figure error for an unmatched name', () => {
      gameManager.editionData = [];
      const data = gameManager.getMonsterData('does-not-exist', 'gh');
      expect(data.name).toEqual('does-not-exist');
      expect(data.errors && data.errors.some((e) => e.type === FigureErrorType.unknown)).toBe(true);
    });

    it('finds an existing character by name and edition', () => {
      gameManager.editionData = [
        buildEdition('gh', { characters: [Object.assign(new CharacterData(), { name: 'brute', edition: 'gh' })] })
      ];
      settingsManager.settings.editions = ['gh'];
      const data = gameManager.getCharacterData('brute', 'gh');
      expect(data.name).toEqual('brute');
      expect(data.errors).toEqual([]);
    });
  });

  describe('mergeGameClocks', () => {
    it('keeps the entry with the later clockOut when ranges overlap', () => {
      const a = [new GameClockTimestamp(100, 200)];
      const b = [new GameClockTimestamp(100, 300)];
      const merged = gameManager.mergeGameClocks(a, b);
      expect(merged).toEqual([new GameClockTimestamp(100, 300)]);
    });

    it('keeps open (still running) entries', () => {
      const a = [new GameClockTimestamp(100, undefined)];
      const b: GameClockTimestamp[] = [];
      const merged = gameManager.mergeGameClocks(a, b);
      expect(merged).toEqual([new GameClockTimestamp(100, undefined)]);
    });

    it('includes entries unique to either side, sorted by clockIn descending', () => {
      const a = [new GameClockTimestamp(100, 200)];
      const b = [new GameClockTimestamp(300, 400)];
      const merged = gameManager.mergeGameClocks(a, b);
      expect(merged.map((c) => c.clockIn)).toEqual([300, 100]);
    });
  });

  describe('nextElementState', () => {
    it('bb rules toggle only between strong and inert', () => {
      gameManager.editionData = [buildEdition('bb')];
      settingsManager.settings.editions = ['bb'];
      gameManager.game.edition = 'bb';
      const element = new ElementModel(GhsElement.fire);
      element.state = ElementState.inert;
      expect(gameManager.nextElementState(element)).toEqual(ElementState.strong);
      element.state = ElementState.strong;
      expect(gameManager.nextElementState(element)).toEqual(ElementState.inert);
    });

    it('draw state progresses new -> strong (single) and inert -> new', () => {
      gameManager.editionData = [buildEdition('gh')];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      const element = new ElementModel(GhsElement.fire);
      element.state = ElementState.new;
      expect(gameManager.nextElementState(element, false, true)).toEqual(ElementState.strong);

      element.state = ElementState.inert;
      expect(gameManager.nextElementState(element, false, true)).toEqual(ElementState.new);
    });

    it('waning progresses to inert while drawing', () => {
      gameManager.editionData = [buildEdition('gh')];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      const element = new ElementModel(GhsElement.fire);
      element.state = ElementState.waning;
      expect(gameManager.nextElementState(element, false, true)).toEqual(ElementState.inert);
    });
  });
});

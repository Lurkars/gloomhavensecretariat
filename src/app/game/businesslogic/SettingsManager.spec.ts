import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Settings } from 'src/app/game/model/Settings';

// SettingsManager also covers init()/loadSettings()/apply() (DOM/fetch/IndexedDB-backed I/O)
// and the label-loading pipeline. This spec sticks to the small, clearly-scoped pure/near-pure
// helpers: setSettings' migration logic, the spoiler/edition list helpers, isObject/merge,
// getEditionByUrl, and the label lookup helpers.

describe('SettingsManager', () => {
  beforeEach(() => {
    settingsManager.settings = new Settings();
    gameManager.editionData = [];
  });

  describe('setSettings', () => {
    it('fills in default editions when none are set', () => {
      const settings = new Settings();
      settings.editions = [];
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.editions).toEqual(settingsManager.defaultEditions);
    });

    it('derives theme from fhStyle when no theme is set', () => {
      const settings = new Settings();
      settings.theme = '';
      settings.fhStyle = true;
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.theme).toEqual('fh');
    });

    it('defaults theme to "default" when fhStyle is false and no theme is set', () => {
      const settings = new Settings();
      settings.theme = '';
      settings.fhStyle = false;
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.theme).toEqual('default');
    });

    it('migrates disableAnimations/disableArtwork into animations/artwork', () => {
      const settings = new Settings();
      settings.disableAnimations = true;
      settings.disableArtwork = true;
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.animations).toBe(false);
      expect(settingsManager.settings.disableAnimations).toBe(false);
      expect(settingsManager.settings.artwork).toBe(false);
      expect(settingsManager.settings.disableArtwork).toBe(false);
    });

    it('migrates serverPassword into serverCode', () => {
      const settings = new Settings();
      settings.serverPassword = 'secret';
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.serverCode).toEqual('secret');
      expect(settingsManager.settings.serverPassword).toBeUndefined();
    });

    it('sorts spoilers case-insensitively', () => {
      const settings = new Settings();
      settings.spoilers = ['banana', 'Apple', 'cherry'];
      settingsManager.setSettings(settings);
      expect(settingsManager.settings.spoilers).toEqual(['Apple', 'banana', 'cherry']);
    });
  });

  describe('addSpoiler / removeSpoiler / removeAllSpoilers', () => {
    it('adds a spoiler once and keeps the list sorted', () => {
      settingsManager.addSpoiler('zebra');
      settingsManager.addSpoiler('apple');
      expect(settingsManager.settings.spoilers).toEqual(['apple', 'zebra']);
    });

    it('does not add a duplicate spoiler', () => {
      settingsManager.addSpoiler('zebra');
      settingsManager.addSpoiler('zebra');
      expect(settingsManager.settings.spoilers).toEqual(['zebra']);
    });

    it('removeSpoiler drops an existing entry', () => {
      settingsManager.settings.spoilers = ['a', 'b'];
      settingsManager.removeSpoiler('a');
      expect(settingsManager.settings.spoilers).toEqual(['b']);
    });

    it('removeAllSpoilers clears the list', () => {
      settingsManager.settings.spoilers = ['a', 'b'];
      settingsManager.removeAllSpoilers();
      expect(settingsManager.settings.spoilers).toEqual([]);
    });
  });

  describe('addEdition / removeEdition', () => {
    it('adds an edition once', () => {
      settingsManager.settings.editions = [];
      settingsManager.addEdition('gh');
      settingsManager.addEdition('gh');
      expect(settingsManager.settings.editions).toEqual(['gh']);
    });

    it('removes an edition', () => {
      settingsManager.settings.editions = ['gh', 'fh'];
      settingsManager.removeEdition('gh');
      expect(settingsManager.settings.editions).toEqual(['fh']);
    });
  });

  describe('isObject', () => {
    it('is true for plain objects, false for arrays/null/primitives', () => {
      expect(settingsManager.isObject({})).toBe(true);
      expect(settingsManager.isObject([])).toBe(false);
      expect(settingsManager.isObject(null)).toBeFalsy();
      expect(settingsManager.isObject('x')).toBe(false);
    });
  });

  describe('merge', () => {
    it('merges nested objects and concatenates duplicate array values into a set', () => {
      const target = { a: 1, list: [1, 2], nested: { x: 1 } };
      const result = settingsManager.merge(target, false, { a: 2, list: [2, 3], nested: { y: 2 } });
      expect(result.a).toEqual(1); // overwrite=false keeps existing scalar
      expect(result.list).toEqual([1, 2, 3]);
      expect(result.nested).toEqual({ x: 1, y: 2 });
    });

    it('overwrites scalars when overwrite is true', () => {
      const target = { a: 1 };
      const result = settingsManager.merge(target, true, { a: 2 });
      expect(result.a).toEqual(2);
    });

    it('returns target unchanged when there are no sources', () => {
      const target = { a: 1 };
      expect(settingsManager.merge(target, true)).toBe(target);
    });
  });

  describe('getEditionByUrl', () => {
    it('returns the matching edition data url', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { url: 'gh.json' })];
      expect(settingsManager.getEditionByUrl('gh.json')).toEqual('gh.json');
    });

    it('is an empty string when no edition matches the url', () => {
      expect(settingsManager.getEditionByUrl('missing.json')).toEqual('');
    });
  });

  describe('emptyLabel', () => {
    it('renders the key alone when there are no args', () => {
      expect(settingsManager.emptyLabel('some.key', [])).toEqual('some.key');
    });

    it('appends bracketed args when present', () => {
      expect(settingsManager.emptyLabel('some.key', ['a', 'b'])).toEqual('some.key &#91;a,b&#93;');
    });
  });

  describe('labelExists', () => {
    it('is true for a string leaf value found via dotted path', () => {
      const from = { game: { title: 'Gloomhaven' } };
      expect(settingsManager.labelExists('game.title', false, from)).toBe(true);
    });

    it('is false for a missing path', () => {
      const from = { game: { title: 'Gloomhaven' } };
      expect(settingsManager.labelExists('game.missing', false, from)).toBe(false);
    });

    it('requires includeObject to accept a plain nested object without a "" entry', () => {
      const from = { game: { nested: { deeper: 'x' } } };
      expect(settingsManager.labelExists('game.nested', false, from)).toBeFalsy();
      expect(settingsManager.labelExists('game.nested', true, from)).toBe(true);
    });
  });

  describe('insertLabelArguments', () => {
    it('substitutes {index} placeholders with the given args', () => {
      expect(settingsManager.insertLabelArguments('Hello {0}, you have {1} items', ['world', '5'], false)).toEqual(
        'Hello world, you have 5 items'
      );
    });

    it('leaves the label unchanged when there are no matching placeholders', () => {
      expect(settingsManager.insertLabelArguments('Hello world', ['unused'], false)).toEqual('Hello world');
    });
  });
});

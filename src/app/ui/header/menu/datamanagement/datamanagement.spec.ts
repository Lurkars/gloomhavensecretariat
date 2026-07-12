import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { GameModel } from 'src/app/game/model/Game';
import { DatamanagementMenuComponent } from 'src/app/ui/header/menu/datamanagement/datamanagement';

// DatamanagementMenuComponent's ngOnInit()/export*()/toggleEdition()'s load-editionData branch and
// the "confirmed" completion branches of resetGame/resetSettings/clearAllData all hit IndexedDB
// (storageManager) or window.location.reload() — out of scope here. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges()/ngOnInit().
// This spec covers the confirm-then-act double-click pattern (only the first "arm" click, never the
// destructive second click), hasDefaultEditionData, drop's array reordering, removeEditionDataUrl,
// addSpoiler/removeSpoiler, addUnlock/removeUnlock/removeAllUnlocks, and importGame.

function createComponent(): DatamanagementMenuComponent {
  const fixture = TestBed.createComponent(DatamanagementMenuComponent);
  return fixture.componentInstance;
}

describe('DatamanagementMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatamanagementMenuComponent] }).compileComponents();

    gameManager.game.edition = 'gh';
    gameManager.game.unlockedCharacters = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
    settingsManager.settings.editionDataUrls = [];
    settingsManager.settings.spoilers = [];
    settingsManager.settings.events = false;
    settingsManager.label = { data: { partyAchievements: {}, globalAchievements: {} } };
  });

  afterEach(() => {
    settingsManager.label = {};
  });

  it('renders the template (running ngOnInit) without throwing', async () => {
    const fixture = TestBed.createComponent(DatamanagementMenuComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('confirm-then-act (arming click only)', () => {
    it('deleteBackups arms the confirmation without deleting on the first call', () => {
      const component = createComponent();
      component.backups = 3;
      component.deleteBackups();
      expect(component.confirm).toEqual('deleteBackups');
      expect(component.backups).toEqual(3);
    });

    it('resetGame arms the confirmation without resetting on the first call', () => {
      const component = createComponent();
      component.resetGame();
      expect(component.confirm).toEqual('resetGame');
    });

    it('resetSettings arms the confirmation on the first call', () => {
      const component = createComponent();
      component.resetSettings();
      expect(component.confirm).toEqual('resetSettings');
    });

    it('clearAllData arms the confirmation on the first call', () => {
      const component = createComponent();
      component.clearAllData();
      expect(component.confirm).toEqual('clearAllData');
    });

    it('cancelConfirm resets the confirmation state', () => {
      const component = createComponent();
      component.confirm = 'resetGame';
      component.cancelConfirm();
      expect(component.confirm).toEqual('');
    });
  });

  describe('hasDefaultEditionData', () => {
    it('is false when default edition data urls are missing', () => {
      const component = createComponent();
      settingsManager.settings.editionDataUrls = [];
      expect(component.hasDefaultEditionData()).toBe(false);
    });

    it('is true once every default url is present', () => {
      const component = createComponent();
      settingsManager.settings.editionDataUrls = [...settingsManager.defaultEditionDataUrls];
      expect(component.hasDefaultEditionData()).toBe(true);
    });
  });

  describe('drop', () => {
    it('reorders both editionDataUrls and editionData in lockstep', () => {
      const component = createComponent();
      settingsManager.settings.editionDataUrls = ['a', 'b', 'c'];
      gameManager.editionData = [
        Object.assign(new EditionData('a', [], [], [], [], [], [])),
        Object.assign(new EditionData('b', [], [], [], [], [], [])),
        Object.assign(new EditionData('c', [], [], [], [], [], []))
      ];
      component.drop({ previousIndex: 0, currentIndex: 2 } as any);
      expect(settingsManager.settings.editionDataUrls).toEqual(['b', 'c', 'a']);
      expect(gameManager.editionData.map((e) => e.edition)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('removeEditionDataUrl', () => {
    it('removes the given edition data url', () => {
      const component = createComponent();
      settingsManager.settings.editionDataUrls = ['a', 'b'];
      component.removeEditionDataUrl('a');
      expect(settingsManager.settings.editionDataUrls).toEqual(['b']);
    });

    it('is a no-op for an empty url', () => {
      const component = createComponent();
      settingsManager.settings.editionDataUrls = ['a'];
      component.removeEditionDataUrl('');
      expect(settingsManager.settings.editionDataUrls).toEqual(['a']);
    });
  });

  describe('addSpoiler / removeSpoiler', () => {
    it('addSpoiler adds and clears the input field', () => {
      const component = createComponent();
      const target = { value: 'my-spoiler' };
      component.addSpoiler(target);
      expect(settingsManager.settings.spoilers).toContain('my-spoiler');
      expect(target.value).toEqual('');
    });

    it('removeSpoiler removes an existing spoiler', () => {
      const component = createComponent();
      settingsManager.settings.spoilers = ['my-spoiler'];
      component.removeSpoiler('my-spoiler');
      expect(settingsManager.settings.spoilers).toEqual([]);
    });
  });

  describe('addUnlock / removeUnlock / removeAllUnlocks', () => {
    it('unlocks a character resolved from the current edition', () => {
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [Object.assign(new CharacterData(), { name: 'brute', edition: 'gh' })], [], [], [], [], []))
      ];
      const component = createComponent();
      const target = { value: 'brute', classList: { remove: () => {}, add: () => {} }, disabled: false };
      component.addUnlock(target);
      expect(gameManager.game.unlockedCharacters).toContain('gh:brute');
      expect(target.value).toEqual('');
    });

    it('removeUnlock removes an unlocked character by edition:name', () => {
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [Object.assign(new CharacterData(), { name: 'brute', edition: 'gh' })], [], [], [], [], []))
      ];
      gameManager.game.unlockedCharacters = ['gh:brute'];
      const component = createComponent();
      component.removeUnlock('gh:brute');
      expect(gameManager.game.unlockedCharacters).toEqual([]);
    });

    it('removeAllUnlocks clears the whole list', () => {
      gameManager.game.unlockedCharacters = ['gh:brute', 'gh:scoundrel'];
      const component = createComponent();
      component.removeAllUnlocks();
      expect(gameManager.game.unlockedCharacters).toEqual([]);
    });
  });

  describe('importGame', () => {
    it('replaces the current game state from the imported model', () => {
      gameManager.game.revision = 10;
      const component = createComponent();
      const gameModel = Object.assign(new GameModel(), { revision: 20, edition: 'gh' });
      component.importGame(gameModel);
      expect(gameManager.game.edition).toEqual('gh');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { SettingsMenuComponent } from 'src/app/ui/header/menu/settings/settings';

// SettingsMenuComponent's constructor classifies every ConditionName into applyConditionsExcludes/
// activeApplyConditionsAuto/activeApplyConditionsExcludes based on Condition's computed types — with
// gameManager.game.edition unset, its edition-relevance filter always passes, so this is safe to
// exercise without any editionData setup. updateFilter() reads viewChildren(SettingMenuComponent),
// which resolves to an empty array without fixture.detectChanges() (never called here, per the
// AppComponent.spec.ts pattern), making it a harmless no-op. This spec covers the constructor's
// condition classification, setTab, the toggle* methods, zoom, and the bulk-defaults methods
// (spot-checking representative fields rather than every one of the ~80 settings they touch).

function createComponent(): SettingsMenuComponent {
  const fixture = TestBed.createComponent(SettingsMenuComponent);
  return fixture.componentInstance;
}

describe('SettingsMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SettingsMenuComponent] }).compileComponents();
    gameManager.game.edition = undefined;
    settingsManager.settings.applyConditionsExcludes = [];
    settingsManager.settings.activeApplyConditionsAuto = [];
    settingsManager.settings.activeApplyConditionsExcludes = [];
  });

  describe('constructor condition classification', () => {
    it('classifies turn-based conditions like wound into applyConditionsExcludes', () => {
      const component = createComponent();
      expect(component.applyConditionsExcludes.some((c) => c.name === ConditionName.wound)).toBe(true);
    });

    it('classifies auto-applying conditions like ward into activeApplyConditionsAuto', () => {
      const component = createComponent();
      expect(component.activeApplyConditionsAuto.some((c) => c.name === ConditionName.ward)).toBe(true);
    });

    it('classifies conditions like poison into activeApplyConditionsExcludes', () => {
      const component = createComponent();
      expect(component.activeApplyConditionsExcludes.some((c) => c.name === ConditionName.poison)).toBe(true);
    });
  });

  describe('setTab', () => {
    it('switches the active tab and clears the filter', () => {
      const component = createComponent();
      component.filter = 'search text';
      component.setTab('display');
      expect(component.activeTab).toEqual('display');
      expect(component.filter).toEqual('');
    });
  });

  describe('toggle* condition list methods', () => {
    it('toggleApplyConditionsExclude adds then removes a condition', () => {
      const component = createComponent();
      component.toggleApplyConditionsExclude(ConditionName.wound);
      expect(settingsManager.settings.applyConditionsExcludes).toEqual([ConditionName.wound]);
      component.toggleApplyConditionsExclude(ConditionName.wound);
      expect(settingsManager.settings.applyConditionsExcludes).toEqual([]);
    });

    it('toggleActiveApplyConditionsAuto adds then removes a condition', () => {
      const component = createComponent();
      component.toggleActiveApplyConditionsAuto(ConditionName.ward);
      expect(settingsManager.settings.activeApplyConditionsAuto).toEqual([ConditionName.ward]);
      component.toggleActiveApplyConditionsAuto(ConditionName.ward);
      expect(settingsManager.settings.activeApplyConditionsAuto).toEqual([]);
    });

    it('toggleActiveApplyConditionsExclude adds then removes a condition', () => {
      const component = createComponent();
      component.toggleActiveApplyConditionsExclude(ConditionName.poison);
      expect(settingsManager.settings.activeApplyConditionsExcludes).toEqual([ConditionName.poison]);
      component.toggleActiveApplyConditionsExclude(ConditionName.poison);
      expect(settingsManager.settings.activeApplyConditionsExcludes).toEqual([]);
    });
  });

  describe('zoom', () => {
    it('resetZoom forces the zoom factor back to 100', () => {
      const component = createComponent();
      component.resetZoom();
      expect(settingsManager.settings.zoom).toEqual(100);
    });

    it('zoomOut/zoomIn adjust the zoom factor relative to the current body style', () => {
      const component = createComponent();
      document.body.style.setProperty('--ghs-factor', '100');
      component.zoomOut(true);
      expect(settingsManager.settings.zoom).toEqual(105);
      component.zoomIn(true);
      expect(settingsManager.settings.zoom).toEqual(100);
    });
  });

  describe('updateFilter', () => {
    it('is a no-op with no rendered setting menus', () => {
      const component = createComponent();
      expect(() => component.updateFilter()).not.toThrow();
    });
  });

  describe('bulk defaults', () => {
    it('helperDefaults resets to the minimal helper preset', () => {
      const component = createComponent();
      settingsManager.settings.battleGoals = true;
      settingsManager.settings.theme = 'fh';
      component.helperDefaults();
      expect(settingsManager.settings.battleGoals).toBe(false);
      expect(settingsManager.settings.theme).toEqual('default');
      expect(settingsManager.settings.calculate).toBe(true);
    });

    it('xhaDefaults applies the fh-styled preset', () => {
      const component = createComponent();
      settingsManager.settings.fhStyle = false;
      component.xhaDefaults();
      expect(settingsManager.settings.fhStyle).toBe(true);
      expect(settingsManager.settings.theme).toEqual('fh');
      expect(settingsManager.settings.scenarioRooms).toBe(true);
    });

    it('lurkarsDefaults applies the full-feature preset', () => {
      const component = createComponent();
      settingsManager.settings.partySheet = false;
      component.lurkarsDefaults();
      expect(settingsManager.settings.partySheet).toBe(true);
      expect(settingsManager.settings.activeApplyConditionsExcludes).toEqual([
        ConditionName.shield,
        ConditionName.poison,
        ConditionName.poison_x
      ]);
    });
  });
});

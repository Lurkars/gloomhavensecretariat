import { TestBed } from '@angular/core/testing';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { BuildingsListComponent } from 'src/app/ui/figures/party/buildings/list/buildings-list';

// Building rules are covered by BuildingsManager.spec.ts; this spec covers the component wiring of
// toggleState()/downgrade()/hasConclusions(). The dialog-opening methods
// (upgrade/rebuild/repair/openInteraction/openStables/openGarden) are out of scope. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges(), set the
// required `buildings` input via setInput(), and call methods directly.

function buildBuilding(overrides: Partial<BuildingData> = {}, modelOverrides: Partial<BuildingModel> = {}): Building {
  const data = Object.assign(
    new BuildingData(),
    { name: 'sanctuary', costs: { prosperity: 0, lumber: 2, metal: 0, hide: 0, gold: 5, manual: 0 } },
    overrides
  );
  const model = Object.assign(new BuildingModel('sanctuary', 0, 'normal'), modelOverrides);
  return { model, data };
}

function createComponent(buildings: Building[] = []): BuildingsListComponent {
  const fixture = TestBed.createComponent(BuildingsListComponent);
  fixture.componentRef.setInput('buildings', buildings);
  return fixture.componentInstance;
}

describe('BuildingsListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BuildingsListComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.party.loot = {};
    gameManager.game.party.buildings = [];
    gameManager.game.party.inspiration = 0;
    gameManager.game.party.morale = 0;
    gameManager.game.party.prosperity = 0;
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.conclusions = [];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(BuildingsListComponent);
    fixture.componentRef.setInput('buildings', [buildBuilding()]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('toggleState', () => {
    it('cycles normal -> damaged -> wrecked for a repairable, built building', () => {
      const building = buildBuilding({ repair: [1] }, { level: 1, state: 'normal' });
      const component = createComponent([building]);
      component.toggleState(building);
      expect(building.model.state).toEqual('damaged');
      component.toggleState(building);
      expect(building.model.state).toEqual('wrecked');
    });

    it('does not cycle past wrecked without force', () => {
      const building = buildBuilding({ repair: [1] }, { level: 1, state: 'wrecked' });
      const component = createComponent([building]);
      component.toggleState(building);
      expect(building.model.state).toEqual('wrecked');
    });

    it('resets wrecked -> normal with force', () => {
      const building = buildBuilding({ repair: [1] }, { level: 1, state: 'wrecked' });
      const component = createComponent([building]);
      component.toggleState(building, true);
      expect(building.model.state).toEqual('normal');
    });

    it('is a no-op for a building with no repair table', () => {
      const building = buildBuilding({ repair: undefined }, { level: 1, state: 'normal' });
      const component = createComponent([building]);
      component.toggleState(building);
      expect(building.model.state).toEqual('normal');
    });
  });

  describe('downgrade', () => {
    it('removes an unbuilt, non-initial/available building from the party', () => {
      const building = buildBuilding({ costs: { prosperity: 0, lumber: 2, metal: 0, hide: 0, gold: 5, manual: 0 } }, { level: 0 });
      gameManager.game.party.buildings = [building.model];
      const component = createComponent([building]);
      component.downgrade(building);
      expect(gameManager.game.party.buildings).toEqual([]);
    });

    it('decrements the level for a built building instead of removing it', () => {
      const building = buildBuilding({ costs: { prosperity: 0, lumber: 2, metal: 0, hide: 0, gold: 5, manual: 0 } }, { level: 2 });
      gameManager.game.party.buildings = [building.model];
      const component = createComponent([building]);
      component.downgrade(building);
      expect(building.model.level).toEqual(1);
      expect(gameManager.game.party.buildings).toEqual([building.model]);
    });

    it('emits the changed output', () => {
      const building = buildBuilding({ costs: { prosperity: 0, lumber: 2, metal: 0, hide: 0, gold: 5, manual: 0 } }, { level: 2 });
      gameManager.game.party.buildings = [building.model];
      const component = createComponent([building]);
      let emitted = false;
      component.changed.subscribe(() => (emitted = true));
      component.downgrade(building);
      expect(emitted).toBe(true);
    });

    it('is a no-op when the building is not part of the party', () => {
      const building = buildBuilding({}, { level: 2 });
      gameManager.game.party.buildings = [];
      const component = createComponent([building]);
      component.downgrade(building);
      expect(building.model.level).toEqual(2);
    });
  });

  describe('hasConclusions', () => {
    it('is true when an un-completed child conclusion section exists', () => {
      const conclusion = Object.assign(new ScenarioData(), {
        edition: 'gh',
        index: 'c1',
        conclusion: true,
        parentSections: [['s1']]
      });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [conclusion], []))];
      const component = createComponent();
      expect(component.hasConclusions('s1')).toBe(true);
    });

    it('is false once that conclusion has already been recorded', () => {
      const conclusion = Object.assign(new ScenarioData(), {
        edition: 'gh',
        index: 'c1',
        conclusion: true,
        parentSections: [['s1']]
      });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [conclusion], []))];
      gameManager.game.party.conclusions = [{ edition: 'gh', index: 'c1', group: undefined } as any];
      const component = createComponent();
      expect(component.hasConclusions('s1')).toBe(false);
    });

    it('is false when there is no matching conclusion section', () => {
      const component = createComponent();
      expect(component.hasConclusions('unknown')).toBe(false);
    });
  });
});

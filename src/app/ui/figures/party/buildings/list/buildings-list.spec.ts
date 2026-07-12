import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { BuildingsListComponent } from 'src/app/ui/figures/party/buildings/list/buildings-list';

// BuildingsListComponent's upgradeable()/partyResource()/toggleState()/downgrade()/hasConclusions()
// are pure computations over party resources and building cost tables; the dialog-opening methods
// (upgrade/rebuild/repair/openInteraction/openStables/openGarden) are out of scope. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges(), set the
// required `buildings` input via setInput(), and call methods directly.

function buildCharacter(gold: number = 0): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  const character = new Character(data, 1);
  character.progress.gold = gold;
  return character;
}

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

  describe('partyResource', () => {
    it('sums party loot and character progress loot for the given type', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 3 };
      gameManager.game.figures = [character];
      const component = createComponent();
      expect(component.partyResource(LootType.lumber)).toEqual(5);
    });

    it('is just the party loot when there are no characters', () => {
      gameManager.game.party.loot = { [LootType.metal]: 4 };
      const component = createComponent();
      expect(component.partyResource(LootType.metal)).toEqual(4);
    });
  });

  describe('upgradeable (build, level 0)', () => {
    it('is true when the party can afford the build costs', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      const character = buildCharacter(5);
      gameManager.game.figures = [character];
      const building = buildBuilding();
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(true);
    });

    it('is false when lumber is short and there is no inspiration to cover it', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 0 };
      const character = buildCharacter(5);
      gameManager.game.figures = [character];
      const building = buildBuilding();
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(false);
    });

    it('is true when inspiration covers the missing lumber', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 0 };
      gameManager.game.party.inspiration = 2;
      const character = buildCharacter(5);
      gameManager.game.figures = [character];
      const building = buildBuilding();
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(true);
    });

    it('is false when no character has enough combined gold', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      const character = buildCharacter(1);
      gameManager.game.figures = [character];
      const building = buildBuilding();
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(false);
    });

    it('is false once the required prosperity level exceeds the current one', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      const character = buildCharacter(5);
      gameManager.game.figures = [character];
      const building = buildBuilding({ costs: { prosperity: 5, lumber: 2, metal: 0, hide: 0, gold: 5, manual: 0 } });
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(false);
    });
  });

  describe('upgradeable (repair, wrecked/damaged)', () => {
    it('is true once party resources plus inspiration exceed the repair cost', () => {
      const building = buildBuilding({ repair: [10] }, { level: 1, state: 'damaged' });
      gameManager.game.party.loot = { [LootType.lumber]: 5, [LootType.metal]: 5, [LootType.hide]: 5 };
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(true);
    });

    it('is true regardless of resources once morale is above 0', () => {
      const building = buildBuilding({ repair: [100] }, { level: 1, state: 'damaged' });
      gameManager.game.party.morale = 1;
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(true);
    });

    it('is false when resources and morale are both insufficient', () => {
      const building = buildBuilding({ repair: [100] }, { level: 1, state: 'damaged' });
      gameManager.game.party.morale = 0;
      const component = createComponent([building]);
      expect(component.upgradeable(building)).toBe(false);
    });
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

import { TestBed } from '@angular/core/testing';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { MonsterStandeeData } from 'src/app/game/model/data/RoomData';
import { MonsterSpawnData } from 'src/app/game/model/data/ScenarioRule';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { SummonColor } from 'src/app/game/model/Summon';
import { ActionSummonComponent } from 'src/app/ui/figures/actions/summon/action-summon';

// ActionSummonComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not to
// run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (ngOnChanges never runs — we call
// update() directly where needed), set the required `action` input via setInput(), and call methods
// directly. This spec covers getSummonLabel's player-count label-bucketing, getSummon,
// highlightAction, and toggleHighlight; update()'s monster/objective entity-spawner resolution
// (which needs live Monster/ObjectiveContainer fixtures) is out of scope.

function createComponent(action: Action, inputs: Record<string, any> = {}): ActionSummonComponent {
  const fixture = TestBed.createComponent(ActionSummonComponent);
  fixture.componentRef.setInput('action', action);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

function buildSpawnData(overrides: Partial<MonsterStandeeData> = {}): MonsterSpawnData {
  const monster = Object.assign(new MonsterStandeeData('bandit-guard'), overrides);
  return new MonsterSpawnData({ monster, count: 1, marker: '', summon: false, manual: false, manualMin: 0, manualMax: 0 } as any);
}

describe('ActionSummonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActionSummonComponent] }).compileComponents();
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(ActionSummonComponent);
    fixture.componentRef.setInput('action', new Action(ActionType.summon, 1));
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('getSummonLabel', () => {
    it('uses the "all players" label when player2/3/4 all match', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      const spawn = buildSpawnData({ player2: MonsterType.normal, player3: MonsterType.normal, player4: MonsterType.normal, health: 5 });
      const label = component.getSummonLabel(spawn);
      expect(label).toContain('5');
    });

    it('uses the "2-3 vs 4" label when only player2 and player3 match', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      const spawn = buildSpawnData({ player2: MonsterType.normal, player3: MonsterType.normal, player4: MonsterType.elite });
      expect(component.getSummonLabel(spawn)).not.toEqual('');
    });

    it('uses the "3-4 vs 2" label when only player3 and player4 match', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      const spawn = buildSpawnData({ player2: MonsterType.elite, player3: MonsterType.normal, player4: MonsterType.normal });
      expect(component.getSummonLabel(spawn)).not.toEqual('');
    });

    it('is empty (with a console warning) when all three player counts differ', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      const spawn = buildSpawnData({ player2: MonsterType.normal, player3: MonsterType.elite, player4: undefined });
      expect(component.getSummonLabel(spawn)).toEqual('');
    });
  });

  describe('getSummon', () => {
    it('builds a Summon from the resolved summonData', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      component.summonData = Object.assign(new SummonData(), { name: 'bear', cardId: 'c1', level: 2, count: 1 });
      const summon = component.getSummon();
      expect(summon.name).toEqual('bear');
      expect(summon.color).toEqual(SummonColor.custom);
    });

    it('builds an empty Summon without summonData', () => {
      const component = createComponent(new Action(ActionType.summon, 1));
      component.summonData = undefined;
      const summon = component.getSummon();
      expect(summon.name).toEqual('');
    });
  });

  describe('highlightAction / toggleHighlight', () => {
    it('highlightAction reflects membership in interactiveActions by index', () => {
      const action = new Action(ActionType.summon, 1);
      const component = createComponent(action, { index: '0' });
      expect(component.highlightAction()).toBe(false);
      component.interactiveActions.set([{ action, index: '0' } as InteractiveAction]);
      expect(component.highlightAction()).toBe(true);
    });

    it('toggleHighlight is a no-op when the action is not interactively applicable', () => {
      const action = new Action(ActionType.summon, 1);
      const component = createComponent(action, { index: '0', interactiveAbilities: false });
      const event = new PointerEvent('pointerdown');
      const spy = vi.spyOn(event, 'preventDefault');
      component.toggleHighlight(event);
      expect(spy).not.toHaveBeenCalled();
      expect(component.interactiveActions()).toEqual([]);
    });
  });
});

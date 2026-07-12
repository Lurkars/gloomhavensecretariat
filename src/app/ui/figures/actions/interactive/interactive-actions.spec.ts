import { TestBed } from '@angular/core/testing';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { InteractiveActionsComponent } from 'src/app/ui/figures/actions/interactive/interactive-actions';

// InteractiveActionsComponent's applyInteractiveActions() is deeply coupled to ActionsManager's
// apply/state-mutation pipeline and out of scope here. This spec focuses on wildToConsume()/
// wildToCreate() (pure filters over gameManager.game.elementBoard), update()'s interactiveAbilities/
// figure-active gating, and onInteractiveActionsChange(). Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit never runs — we call
// update() directly instead), set the required `figure` input via setInput().

function buildMonster(active: boolean = true): Monster {
  const stat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [stat] }), 1);
  const entity = new MonsterEntity(1, MonsterType.normal, monster);
  entity.active = active;
  monster.entities = [entity];
  monster.active = active;
  return monster;
}

function createComponent(figure: Monster): InteractiveActionsComponent {
  const fixture = TestBed.createComponent(InteractiveActionsComponent);
  fixture.componentRef.setInput('figure', figure);
  return fixture.componentInstance;
}

describe('InteractiveActionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InteractiveActionsComponent] }).compileComponents();

    gameManager.game.elementBoard = [];
    settingsManager.settings.interactiveAbilities = true;
    settingsManager.settings.combineInteractiveAbilities = true;
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(InteractiveActionsComponent);
    fixture.componentRef.setInput('figure', buildMonster(true));
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('clears interactive actions when interactiveAbilities is disabled', () => {
      settingsManager.settings.interactiveAbilities = false;
      const monster = buildMonster(true);
      const component = createComponent(monster);
      component.update();
      expect(component.interactiveActionEntities).toEqual([]);
      expect(component.interactiveActions()).toEqual([]);
    });

    it('clears interactive actions when the figure is not active', () => {
      const monster = buildMonster(false);
      const component = createComponent(monster);
      component.update();
      expect(component.interactiveActionEntities).toEqual([]);
    });
  });

  describe('wildToConsume', () => {
    it('includes elements that are strong/waning/partlyConsumed and not already chosen', () => {
      gameManager.game.elementBoard = [
        Object.assign(new ElementModel(Element.fire), { state: ElementState.strong }),
        Object.assign(new ElementModel(Element.ice), { state: ElementState.inert })
      ];
      const monster = buildMonster();
      const component = createComponent(monster);
      expect(component.wildToConsume()).toEqual([Element.fire]);
    });

    it('excludes an element already chosen', () => {
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.fire), { state: ElementState.strong })];
      const monster = buildMonster();
      const component = createComponent(monster);
      component.chooseElementValues = [Element.fire];
      expect(component.wildToConsume()).toEqual([]);
    });

    it('excludes an element already targeted by a minus-type element interactive action', () => {
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.fire), { state: ElementState.strong })];
      const monster = buildMonster();
      const component = createComponent(monster);
      const action = Object.assign(new Action(ActionType.element, Element.fire, ActionValueType.minus), {});
      component.interactiveActions.set([{ action, index: '0' } as InteractiveAction]);
      expect(component.wildToConsume()).toEqual([]);
    });
  });

  describe('wildToCreate', () => {
    it('includes non-new/strong/always elements not already chosen', () => {
      gameManager.game.elementBoard = [
        Object.assign(new ElementModel(Element.fire), { state: ElementState.inert }),
        Object.assign(new ElementModel(Element.ice), { state: ElementState.new })
      ];
      const monster = buildMonster();
      const component = createComponent(monster);
      expect(component.wildToCreate()).toEqual([Element.fire]);
    });

    it('excludes an element already chosen', () => {
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.fire), { state: ElementState.inert })];
      const monster = buildMonster();
      const component = createComponent(monster);
      component.chooseElementValues = [Element.fire];
      expect(component.wildToCreate()).toEqual([]);
    });
  });

  describe('onInteractiveActionsChange', () => {
    it('stores the given change', () => {
      const monster = buildMonster();
      const component = createComponent(monster);
      const change = [{ action: new Action(ActionType.attack, 1), index: '0' }] as InteractiveAction[];
      component.onInteractiveActionsChange(change);
      expect(component.interactiveActions()).toEqual(change);
    });
  });
});

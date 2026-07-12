import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { ObjectiveContainerComponent } from 'src/app/ui/figures/objective-container/objective-container';

// ObjectiveContainerComponent mirrors CharacterComponent/StandeeComponent's drag-clamping and
// condition/marker/extra-action mutation patterns for objective figures. Its openEntityMenu() reads
// `this.elementRef.nativeElement.querySelector(...)`, so we avoid calling it (and its dialog-opening
// siblings). Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges() (ngOnInit never runs — we call update() directly instead), set the
// required `objective` input via setInput(), and call methods directly.

function buildObjective(): ObjectiveContainer {
  const objective = new ObjectiveContainer('uuid-1');
  objective.health = 5;
  return objective;
}

function addEntity(objective: ObjectiveContainer, number: number = 1): ObjectiveEntity {
  const entity = new ObjectiveEntity('entity-' + number, number, objective, undefined);
  objective.entities.push(entity);
  return entity;
}

function createComponent(objective: ObjectiveContainer): ObjectiveContainerComponent {
  const fixture = TestBed.createComponent(ObjectiveContainerComponent);
  fixture.componentRef.setInput('objective', objective);
  return fixture.componentInstance;
}

describe('ObjectiveContainerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ObjectiveContainerComponent] }).compileComponents();

    gameManager.game.state = GameState.draw;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.characterCompact = false;
  });

  describe('update', () => {
    it('resolves the single living entity and its active conditions', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.immunities = [ConditionName.poison];
      const component = createComponent(objective);
      component.update();
      expect(component.entity).toBe(entity);
      expect(component.activeConditions.some((c) => c.name === ConditionName.poison)).toBe(true);
    });

    it('leaves entity unset with more than one living entity, deriving a shared marker instead', () => {
      const objective = buildObjective();
      addEntity(objective, 1).marker = 'gh-fire';
      addEntity(objective, 2).marker = 'gh-fire';
      const component = createComponent(objective);
      component.update();
      expect(component.entity).toBeUndefined();
      expect(component.marker).toEqual('gh-fire');
    });

    it('counts only living entities as nonDead', () => {
      const objective = buildObjective();
      addEntity(objective, 1);
      const deadEntity = addEntity(objective, 2);
      deadEntity.dead = true;
      const component = createComponent(objective);
      component.update();
      expect(component.nonDead).toEqual(1);
    });
  });

  describe('dragInitiativeMove / dragInitiativeEnd', () => {
    it('clamps the dragged value to [0, 99]', () => {
      const objective = buildObjective();
      const component = createComponent(objective);
      component.dragInitiativeMove(150);
      expect(component.initiative).toEqual(99);
      component.dragInitiativeMove(-5);
      expect(component.initiative).toEqual(0);
    });

    it('forces a minimum of 1 when initiative is required mid-round', () => {
      const objective = buildObjective();
      gameManager.game.state = GameState.next;
      const component = createComponent(objective);
      component.dragInitiativeMove(0);
      expect(component.initiative).toEqual(1);
    });

    it('dragInitiativeEnd commits the value onto the objective', () => {
      const objective = buildObjective();
      const component = createComponent(objective);
      component.dragInitiativeEnd(42);
      expect(objective.initiative).toEqual(42);
    });
  });

  describe('dragHpMove / dragHpEnd / dragHpCancel', () => {
    it('caps healing at the entity maxHealth', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.health = entity.maxHealth - 1;
      const component = createComponent(objective);
      component.update();
      component.dragHpMove(5);
      expect(component.health).toEqual(1);
    });

    it('dragHpEnd applies the pending delta and resets it', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.health = 3;
      const component = createComponent(objective);
      component.update();
      component.dragHpMove(-2);
      component.dragHpEnd();
      expect(entity.health).toEqual(1);
      expect(component.health).toEqual(0);
    });

    it('dragHpCancel resets the pending delta without applying it', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.health = 3;
      const component = createComponent(objective);
      component.update();
      component.dragHpMove(-2);
      component.dragHpCancel();
      expect(component.health).toEqual(0);
      expect(entity.health).toEqual(3);
    });
  });

  describe('actionLabel', () => {
    it('builds a placeholder label without range for range<=1', () => {
      const objective = buildObjective();
      const component = createComponent(objective);
      expect(component.actionLabel(new Action(ActionType.heal, 3))).toEqual('%game.action.heal% 3');
    });

    it('appends the range label once range>1', () => {
      const objective = buildObjective();
      const component = createComponent(objective);
      const action = new Action(ActionType.attack, 2, undefined, [new Action(ActionType.range, 3)]);
      expect(component.actionLabel(action)).toEqual('%game.action.attack% 2 %game.action.range% 3');
    });
  });

  describe('removeCondition', () => {
    it('is a no-op without a single resolved entity', () => {
      const objective = buildObjective();
      addEntity(objective, 1);
      addEntity(objective, 2);
      const component = createComponent(objective);
      component.update();
      expect(() => component.removeCondition(new EntityCondition(ConditionName.poison))).not.toThrow();
    });

    it('decrements value for a stackable condition instead of removing it', () => {
      const objective = buildObjective();
      addEntity(objective);
      const component = createComponent(objective);
      component.update();
      const condition = new EntityCondition(ConditionName.bless, 3);
      component.removeCondition(condition);
      expect(condition.value).toEqual(2);
    });
  });

  describe('removeMarker', () => {
    it('removes the marker from the resolved entity', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.markers = ['gh-fire', 'gh-ice'];
      const component = createComponent(objective);
      component.update();
      component.removeMarker('gh-fire');
      expect(entity.markers).toEqual(['gh-ice']);
    });
  });

  describe('removeExtraAction', () => {
    it('removes the action at the given index from the non-persistent list', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.extraActions = [new Action(ActionType.heal, 1), new Action(ActionType.heal, 2)];
      const component = createComponent(objective);
      component.update();
      component.removeExtraAction(0);
      expect(entity.extraActions.length).toEqual(1);
      expect(entity.extraActions[0].value).toEqual(2);
    });

    it('removes from the persistent list when requested', () => {
      const objective = buildObjective();
      const entity = addEntity(objective);
      entity.extraActionsPersistent = [new Action(ActionType.heal, 1)];
      const component = createComponent(objective);
      component.update();
      component.removeExtraAction(0, true);
      expect(entity.extraActionsPersistent.length).toEqual(0);
    });
  });

  describe('onInteractiveActionsChange', () => {
    it('stores the given change', () => {
      const objective = buildObjective();
      const component = createComponent(objective);
      const change = [{ action: new Action(ActionType.attack, 1), index: '0' }];
      component.onInteractiveActionsChange(change as any);
      expect(component.interactiveActions).toBe(change as any);
    });
  });
});

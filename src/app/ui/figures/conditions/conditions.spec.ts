import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Condition, ConditionName, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { ConditionsComponent } from 'src/app/ui/figures/conditions/conditions';

// ConditionsComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not to
// run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit never runs — we call
// initializeConditions()/set the entityConditions input directly instead), and call methods
// directly. This spec covers the condition-state lookups (hasCondition/isImmune/isPermanent/
// isRoundExpire/isExpire), value inc/dec/getValue/checkUpdate, toggleCondition's four branches, and
// the toggle*Enabled flag flips.

function createComponent(inputs: Record<string, any> = {}): ConditionsComponent {
  const fixture = TestBed.createComponent(ConditionsComponent);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('ConditionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConditionsComponent] }).compileComponents();

    gameManager.game.edition = 'gh';
    gameManager.game.conditions = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(ConditionsComponent);
    fixture.componentRef.setInput('entityConditions', [new EntityCondition(ConditionName.poison)]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('hasCondition', () => {
    it('is true for a matching, non-removed, non-expired entity condition', () => {
      const entityConditions = [new EntityCondition(ConditionName.poison)];
      const component = createComponent({ entityConditions });
      expect(component.hasCondition(new Condition(ConditionName.poison))).toBe(true);
    });

    it('is false once the condition has been marked removed', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.state = EntityConditionState.removed;
      const component = createComponent({ entityConditions: [entityCondition] });
      expect(component.hasCondition(new Condition(ConditionName.poison))).toBe(false);
    });

    it('is false once the condition has expired', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.expired = true;
      const component = createComponent({ entityConditions: [entityCondition] });
      expect(component.hasCondition(new Condition(ConditionName.poison))).toBe(false);
    });

    it('with permanentEnabled set, only matches permanent entries', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.permanent = false;
      const component = createComponent({ entityConditions: [entityCondition] });
      component.permanentEnabled = true;
      expect(component.hasCondition(new Condition(ConditionName.poison))).toBe(false);
    });
  });

  describe('isImmune', () => {
    it('reflects the manual immunities list', () => {
      const component = createComponent({ immunities: [ConditionName.poison] });
      expect(component.isImmune(ConditionName.poison)).toBe(true);
      expect(component.isImmune(ConditionName.wound)).toBe(false);
    });

    it('ignoreManual bypasses the manual immunities list', () => {
      const component = createComponent({ immunities: [ConditionName.poison] });
      expect(component.isImmune(ConditionName.poison, true)).toBe(false);
    });
  });

  describe('isPermanent / isRoundExpire / isExpire', () => {
    it('isPermanent is true for a non-expired permanent entry', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.permanent = true;
      const component = createComponent({ entityConditions: [entityCondition] });
      expect(component.isPermanent(ConditionName.poison)).toBe(true);
    });

    it('isRoundExpire is true for a roundExpire-state entry', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.state = EntityConditionState.roundExpire;
      const component = createComponent({ entityConditions: [entityCondition] });
      expect(component.isRoundExpire(ConditionName.poison)).toBe(true);
    });

    it('isExpire is true for an expire-state entry', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      entityCondition.state = EntityConditionState.expire;
      const component = createComponent({ entityConditions: [entityCondition] });
      expect(component.isExpire(ConditionName.poison)).toBe(true);
    });
  });

  describe('inc / dec / getValue / checkUpdate', () => {
    it('inc increments the value and mirrors it onto the matching entity condition', () => {
      const entityCondition = new EntityCondition(ConditionName.poison, 2);
      const component = createComponent({ entityConditions: [entityCondition] });
      const condition = new Condition(ConditionName.poison, 2);
      component.inc(condition);
      expect(condition.value).toEqual(3);
      expect(entityCondition.value).toEqual(3);
    });

    it('dec decrements the value', () => {
      const entityCondition = new EntityCondition(ConditionName.poison, 2);
      const component = createComponent({ entityConditions: [entityCondition] });
      const condition = new Condition(ConditionName.poison, 2);
      component.dec(condition);
      expect(condition.value).toEqual(1);
      expect(entityCondition.value).toEqual(1);
    });

    it('dec floors non-stacking/non-upgrade conditions at 1', () => {
      const entityCondition = new EntityCondition(ConditionName.poison, 1);
      const component = createComponent({ entityConditions: [entityCondition] });
      const condition = new Condition(ConditionName.poison, 1);
      component.dec(condition);
      expect(condition.value).toEqual(1);
    });

    it('getValue prefers the live entity-condition value over the static condition value', () => {
      const entityCondition = new EntityCondition(ConditionName.poison, 5);
      const component = createComponent({ entityConditions: [entityCondition] });
      const condition = new Condition(ConditionName.poison, 2);
      expect(component.getValue(condition)).toEqual(5);
    });

    it('getValue falls back to the static condition value with no matching entity condition', () => {
      const component = createComponent({ entityConditions: [] });
      const condition = new Condition(ConditionName.poison, 2);
      expect(component.getValue(condition)).toEqual(2);
    });
  });

  describe('toggleCondition', () => {
    it('adds a new entity condition when none is active', () => {
      const entityConditions: EntityCondition[] = [];
      const component = createComponent({ entityConditions });
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(entityConditions.some((c) => c.name === ConditionName.poison && c.state === EntityConditionState.new)).toBe(true);
    });

    it('marks an active condition as removed on a second toggle', () => {
      const entityCondition = new EntityCondition(ConditionName.poison);
      const entityConditions = [entityCondition];
      const component = createComponent({ entityConditions });
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(entityCondition.state).toEqual(EntityConditionState.removed);
      expect(entityCondition.expired).toBe(true);
    });

    it('toggles manual immunity instead of applying the condition when immunityEnabled', () => {
      const immunities: ConditionName[] = [];
      const component = createComponent({ entityConditions: [], immunities });
      component.immunityEnabled = true;
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(immunities).toEqual([ConditionName.poison]);
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(immunities).toEqual([]);
    });

    it('sets roundExpire state instead of applying the condition when roundExpireEnabled', () => {
      const entityConditions: EntityCondition[] = [];
      const component = createComponent({ entityConditions });
      component.roundExpireEnabled = true;
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(entityConditions[0].state).toEqual(EntityConditionState.roundExpire);
    });

    it('sets expire state instead of applying the condition when expireEnabled', () => {
      const entityConditions: EntityCondition[] = [];
      const component = createComponent({ entityConditions });
      component.expireEnabled = true;
      component.toggleCondition(new Condition(ConditionName.poison));
      expect(entityConditions[0].state).toEqual(EntityConditionState.expire);
    });
  });

  describe('toggle*Enabled', () => {
    it('togglePermanentEnabled flips permanentEnabled and clears the other flags', () => {
      const component = createComponent({ entityConditions: [] });
      component.roundExpireEnabled = true;
      component.togglePermanentEnabled();
      expect(component.permanentEnabled).toBe(true);
      expect(component.roundExpireEnabled).toBe(false);
    });

    it('toggleRoundExpireEnabled flips roundExpireEnabled and clears the other flags', () => {
      const component = createComponent({ entityConditions: [] });
      component.permanentEnabled = true;
      component.toggleRoundExpireEnabled();
      expect(component.roundExpireEnabled).toBe(true);
      expect(component.permanentEnabled).toBe(false);
    });

    it('toggleExpireEnabled flips expireEnabled and clears the other flags', () => {
      const component = createComponent({ entityConditions: [] });
      component.immunityEnabled = true;
      component.toggleExpireEnabled();
      expect(component.expireEnabled).toBe(true);
      expect(component.immunityEnabled).toBe(false);
    });

    it('toggleImmunityEnabled flips immunityEnabled and clears the other flags', () => {
      const component = createComponent({ entityConditions: [] });
      component.expireEnabled = true;
      component.toggleImmunityEnabled();
      expect(component.immunityEnabled).toBe(true);
      expect(component.expireEnabled).toBe(false);
    });
  });
});

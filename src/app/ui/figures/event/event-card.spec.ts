import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { EventCard, EventCardIdentifier, EventCardOption, EventCardOutcome } from 'src/app/game/model/data/EventCard';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';

// EventCardComponent has no injected dependencies, so it's cheaply constructible. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit
// never runs — we call it directly instead), set inputs via setInput(), and call methods directly.
// Outcomes are built without a `condition` so resolvableCondition() (a deeper EventCardManager call)
// never needs to run — `!outcome.condition` alone makes them resolvable. This spec covers ngOnInit's
// resolvable-matrix/attack-detection/checks population and the select/check/toggle methods.

function buildOutcome(overrides: Partial<EventCardOutcome> = {}): EventCardOutcome {
  return Object.assign(new EventCardOutcome(), overrides);
}

function buildCard(options: EventCardOption[]): EventCard {
  return new EventCard('1', 'gh', 'city', 'narrative', 'footer', options);
}

function createComponent(event: EventCard, inputs: Record<string, any> = {}): EventCardComponent {
  const fixture = TestBed.createComponent(EventCardComponent);
  fixture.componentRef.setInput('event', event);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('EventCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventCardComponent] }).compileComponents();
    gameManager.game.party.eventCards = [];
  });

  it('renders the template without throwing', () => {
    const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
    const fixture = TestBed.createComponent(EventCardComponent);
    fixture.componentRef.setInput('event', card);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('ngOnInit', () => {
    it('marks condition-free outcomes as resolvable', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      expect(component.resolvable[0][0]).toBe(true);
    });

    it('detects an attack outcome and records its option index', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome({ attack: { rounds: 1 } as any })])]);
      const component = createComponent(card);
      component.ngOnInit();
      expect(component.attack).toBe(true);
      expect(component.attackIndex).toEqual(0);
    });

    it('sets noLabel true when every option lacks a label', () => {
      const card = buildCard([new EventCardOption('', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      expect(component.noLabel).toBe(true);
    });

    it('sets noLabel false once any option has a label', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      expect(component.noLabel).toBe(false);
    });

    it('reads checks from a matching party.eventCards entry', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      gameManager.game.party.eventCards = [{ cardId: '1', type: 'city', edition: 'gh', checks: [2, 3] } as any];
      const component = createComponent(card);
      component.ngOnInit();
      expect(component.checks).toEqual([2, 3]);
    });

    it('prefers checks from an explicit identifier input over party.eventCards', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      gameManager.game.party.eventCards = [{ cardId: '1', type: 'city', edition: 'gh', checks: [1] } as any];
      const identifier = new EventCardIdentifier('1', 'gh', 'city', -1, [], [9], false, false);
      const component = createComponent(card, { identifier });
      component.ngOnInit();
      expect(component.checks).toEqual([9]);
    });
  });

  describe('selectOption', () => {
    it('selects the option and marks its resolvable outcomes as sub-selected', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome(), buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      let emitted: EventCardIdentifier | undefined;
      component.selectCard.subscribe((value) => (emitted = value));
      component.selectOption(0, false);
      expect(component.selected).toEqual(0);
      expect(component.subSelections).toEqual([0, 1]);
      expect(emitted).toBeTruthy();
    });

    it('is a no-op for the disabled attack option', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome({ attack: { rounds: 1 } as any })])]);
      const component = createComponent(card);
      component.ngOnInit();
      component.selectOption(0, false);
      expect(component.selected).toEqual(-1);
    });

    it('is a no-op while disabled', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card, { disabled: true });
      component.ngOnInit();
      component.selectOption(0, false);
      expect(component.selected).toEqual(-1);
    });

    it('flips the card and resets selection for an option without a label', () => {
      const card = buildCard([new EventCardOption('', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      component.selectOption(0, true);
      expect(component.flipped).toBe(true);
      expect(component.selected).toEqual(-1);
    });
  });

  describe('selectSub', () => {
    it('toggles a sub-selection off when already selected', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome(), buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      component.selected = 0;
      component.subSelections = [1];
      component.selectSub(0, 1);
      expect(component.subSelections).toEqual([]);
    });

    it('adds a resolvable sub-selection when not yet selected', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome(), buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      component.selected = 0;
      component.subSelections = [];
      component.selectSub(0, 1);
      expect(component.subSelections).toEqual([1]);
    });
  });

  describe('onCheck / toggleAttack / setSpoilerFree / toggleShowDebug', () => {
    it('onCheck records the check count for the given index and emits', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      let emitted: EventCardIdentifier | undefined;
      component.selectCard.subscribe((value) => (emitted = value));
      component.onCheck(0, 3);
      expect(component.checks[0]).toEqual(3);
      expect(emitted).toBeTruthy();
    });

    it('toggleAttack sets the attack flag and emits', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.ngOnInit();
      component.toggleAttack(true);
      expect(component.attack).toBe(true);
    });

    it('setSpoilerFree sets the flag', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.setSpoilerFree(true);
      expect(component.spoilerFree).toBe(true);
    });

    it('toggleShowDebug flips showDebug', () => {
      const card = buildCard([new EventCardOption('label', 'narrative', [buildOutcome()])]);
      const component = createComponent(card);
      component.toggleShowDebug();
      expect(component.showDebug).toBe(true);
      component.toggleShowDebug();
      expect(component.showDebug).toBe(false);
    });
  });
});

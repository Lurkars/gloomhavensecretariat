import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { AttackModiferDeckChange } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierDeckDialogComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-dialog';

// AttackModifierDeckDialogComponent's constructor only unpacks DIALOG_DATA and registers a
// uiChangeEffect() (confirmed elsewhere not to run synchronously in tests), so it's cheaply
// constructible without a character or town guard context (update()'s originalDeck falls back to a
// plain `new AttackModifierDeck()` in that case). Following the AppComponent.spec.ts pattern: create
// via TestBed, never call fixture.detectChanges() (ngOnInit never runs), and call methods directly.
// This spec covers the deck bookkeeping (counts, remove/restore/newFirst, keepRevealed, changeType
// cycling, faction modifiers) rather than the CDK drag-drop handlers or the character/town-guard
// update() branches (covered indirectly via AttackModifierManager.spec.ts).

function createComponent(deck: AttackModifierDeck, overrides: Record<string, any> = {}): AttackModifierDeckDialogComponent {
  TestBed.configureTestingModule({
    imports: [AttackModifierDeckDialogComponent],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: {
          deck,
          character: undefined,
          ally: false,
          numeration: '1',
          newStyle: false,
          townGuard: false,
          before: new EventEmitter<AttackModiferDeckChange>(),
          after: new EventEmitter<AttackModiferDeckChange>(),
          ...overrides
        }
      },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } }
    ]
  });
  const fixture = TestBed.createComponent(AttackModifierDeckDialogComponent);
  return fixture.componentInstance;
}

function buildDeck(types: AttackModifierType[]): AttackModifierDeck {
  const deck = new AttackModifierDeck(types.map((type) => new AttackModifier(type)));
  deck.current = -1;
  return deck;
}

describe('AttackModifierDeckDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
  });

  it('constructs successfully from a plain deck payload', () => {
    const component = createComponent(buildDeck([AttackModifierType.plus1, AttackModifierType.minus1]));
    expect(component).toBeTruthy();
    expect(component.deck.cards.length).toEqual(2);
  });

  it('renders the template without throwing', () => {
    createComponent(buildDeck([AttackModifierType.plus1, AttackModifierType.minus1]));
    const fixture = TestBed.createComponent(AttackModifierDeckDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('hasDrawnDiscards', () => {
    it('is false when nothing has been drawn yet', () => {
      const deck = buildDeck([AttackModifierType.bless, AttackModifierType.curse]);
      const component = createComponent(deck);
      expect(component.hasDrawnDiscards()).toBe(false);
    });

    it('is true once a bless/curse/empower/enfeeble card has been drawn', () => {
      const deck = buildDeck([AttackModifierType.bless, AttackModifierType.minus1]);
      deck.current = 0;
      const component = createComponent(deck);
      expect(component.hasDrawnDiscards()).toBe(true);
    });
  });

  describe('countAttackModifier / countDrawnAttackModifier / countUpcomingAttackModifier', () => {
    it('counts non-character cards of a given type', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.minus1]);
      const component = createComponent(deck);
      expect(component.countAttackModifier(AttackModifierType.plus1)).toEqual(2);
      expect(component.countAttackModifier(AttackModifierType.minus1)).toEqual(1);
    });

    it('excludes cards flagged as character-only from the count', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.cards[0].character = true;
      const component = createComponent(deck);
      expect(component.countAttackModifier(AttackModifierType.plus1)).toEqual(0);
    });

    it('countDrawnAttackModifier only counts cards at or before current', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1]);
      deck.current = 1;
      const component = createComponent(deck);
      expect(component.countDrawnAttackModifier(AttackModifierType.plus1)).toEqual(2);
    });

    it('countUpcomingAttackModifier only counts cards after current', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1]);
      deck.current = 1;
      const component = createComponent(deck);
      expect(component.countUpcomingAttackModifier(AttackModifierType.plus1)).toEqual(1);
    });

    it('countUpcomingAttackModifier filters by an id prefix when given', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.plus1]);
      deck.current = -1;
      deck.cards[0].id = 'additional-brute-1';
      deck.cards[1].id = 'other-1';
      const component = createComponent(deck);
      expect(component.countUpcomingAttackModifier(AttackModifierType.plus1, 'additional-brute')).toEqual(1);
    });
  });

  describe('remove', () => {
    it('removes the card and shifts current back when removing a drawn card', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.minus1, AttackModifierType.plus2]);
      deck.current = 1;
      const component = createComponent(deck);
      component.remove(0);
      expect(component.deck.cards.length).toEqual(2);
      expect(component.deck.current).toEqual(0);
    });

    it('leaves current unchanged when removing an upcoming card', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.minus1, AttackModifierType.plus2]);
      deck.current = 0;
      const component = createComponent(deck);
      component.remove(2);
      expect(component.deck.cards.length).toEqual(2);
      expect(component.deck.current).toEqual(0);
    });
  });

  describe('restore', () => {
    it('reinserts a deleted card right after current', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.current = 0;
      const component = createComponent(deck);
      component.deletedCards = [new AttackModifier(AttackModifierType.minus1)];
      component.restore(0);
      expect(component.deck.cards[1].type).toEqual(AttackModifierType.minus1);
    });
  });

  describe('newFirst', () => {
    it('inserts a revealed card right after current', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.current = 0;
      const component = createComponent(deck);
      component.newFirst(AttackModifierType.plus2);
      expect(component.deck.cards[1].type).toEqual(AttackModifierType.plus2);
      expect(component.deck.cards[1].revealed).toBe(true);
    });
  });

  describe('toggleKeepRevealed', () => {
    it('flips the flag and reveals the card when turned on', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      component.keepRevealed = [false];
      component.toggleKeepRevealed(0);
      expect(component.keepRevealed[0]).toBe(true);
      expect(component.deck.cards[0].revealed).toBe(true);
    });

    it('flips the flag off without forcing revealed', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      component.keepRevealed = [true];
      component.toggleKeepRevealed(0);
      expect(component.keepRevealed[0]).toBe(false);
    });
  });

  describe('onRevealedChange', () => {
    it('un-reveals a card and clears its keepRevealed flag', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      deck.cards[0].revealed = true;
      component.keepRevealed = [true];
      component.onRevealedChange(deck.cards[0], false);
      expect(deck.cards[0].revealed).toBe(false);
      expect(component.keepRevealed[0]).toBe(false);
    });
  });

  describe('changeType', () => {
    it('cycles forward, skipping non-selectable types', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      component.type = AttackModifierType.minus2;
      component.changeType();
      expect(Object.values(AttackModifierType).indexOf(component.type)).toEqual(
        Object.values(AttackModifierType).indexOf(AttackModifierType.minus2) + 1
      );
    });

    it('cycles the town guard modifier list instead when townGuard is set', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck, { townGuard: true });
      const first = component.tgAM;
      component.changeType();
      expect(component.tgAM).not.toBe(first);
    });
  });

  describe('faction modifiers', () => {
    it('toggleFaction activates a faction and populates its modifier list', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      component.toggleFaction('jekserah');
      expect(component.activeFaction).toEqual('jekserah');
    });

    it('toggleFaction deactivates the same faction on a second call', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck);
      component.toggleFaction('jekserah');
      component.toggleFaction('jekserah');
      expect(component.activeFaction).toBeUndefined();
      expect(component.factionAttackModifier).toEqual([]);
    });

    it('hasFactionModifier checks card-id membership in the deck', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.cards[0].id = 'gh2e-jekserah-1';
      const component = createComponent(deck);
      expect(component.hasFactionModifier(deck.cards[0])).toBe(true);
      expect(component.hasFactionModifier(new AttackModifier(AttackModifierType.minus1, 0, undefined, 'other'))).toBe(false);
    });

    it('toggleFactionAm removes a present card', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.cards[0].id = 'gh2e-jekserah-1';
      const component = createComponent(deck);
      component.toggleFactionAm(deck.cards[0]);
      expect(component.deck.cards.length).toEqual(0);
    });

    it('toggleFactionAm adds a not-yet-present card', () => {
      const deck = buildDeck([]);
      const component = createComponent(deck);
      const am = Object.assign(new AttackModifier(AttackModifierType.plus1), { id: 'gh2e-jekserah-1' });
      component.toggleFactionAm(am);
      expect(component.deck.cards.some((c) => c.id === 'gh2e-jekserah-1')).toBe(true);
    });
  });
});

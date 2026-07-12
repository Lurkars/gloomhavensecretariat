import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { GameState } from 'src/app/game/model/Game';
import { AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';

// AttackModifierDeckComponent's update() branches on `this.init` (only ever flipped true inside a
// setTimeout scheduled by ngOnInit) — since this spec never calls ngOnInit/detectChanges, `init`
// stays false, so update() always takes its safe "just resync current/lastVisible" branch and never
// schedules drawQueue()'s DOM-touching timeout. That lets us call update() directly and safely.
// clickCard() is exercised only via its discard/restore branches (am.active=true), which never route
// through open()/the dialog. Following the AppComponent.spec.ts pattern throughout: create via
// TestBed, never call fixture.detectChanges(), set the required `deck` input via setInput().

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  const character = new Character(data, 1);
  character.number = 1;
  return character;
}

function buildDeck(types: AttackModifierType[]): AttackModifierDeck {
  const deck = new AttackModifierDeck(types.map((type) => new AttackModifier(type)));
  deck.current = -1;
  return deck;
}

function createComponent(deck: AttackModifierDeck, inputs: Record<string, any> = {}): AttackModifierDeckComponent {
  const fixture = TestBed.createComponent(AttackModifierDeckComponent);
  fixture.componentRef.setInput('deck', deck);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('AttackModifierDeckComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AttackModifierDeckComponent] }).compileComponents();

    gameManager.game.state = GameState.draw;
    gameManager.game.scenario = undefined;
    settingsManager.settings.automaticAttackModifierFullscreen = false;
    settingsManager.settings.portraitMode = false;
    settingsManager.settings.fhStyle = false;
    settingsManager.settings.animations = false;
  });

  it('renders the template without throwing', () => {
    const deck = buildDeck([AttackModifierType.plus1]);
    const fixture = TestBed.createComponent(AttackModifierDeckComponent);
    fixture.componentRef.setInput('deck', deck);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('derives edition/numeration/icon from the character input when set', () => {
      const character = buildCharacter();
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck, { character, edition: 'ignored', numeration: 'ignored' });
      component.update();
      expect(component.edition).toEqual('gh');
      expect(component.numeration).toEqual('1');
      expect(component.characterIcon).toEqual(character.iconUrl);
    });

    it('falls back to the raw edition/numeration inputs without a character', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      const component = createComponent(deck, { edition: 'fh', numeration: 'ally-1' });
      component.update();
      expect(component.edition).toEqual('fh');
      expect(component.numeration).toEqual('ally-1');
      expect(component.battleGoals).toBe(false);
    });

    it('is disabled during the draw state for a non-town-guard deck', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      gameManager.game.state = GameState.draw;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(true);
    });

    it('is enabled once the round has started', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      gameManager.game.state = GameState.next;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(false);
    });

    it('standalone decks are never disabled', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      gameManager.game.state = GameState.draw;
      const component = createComponent(deck, { standalone: true });
      component.update();
      expect(component.disabled).toBe(false);
    });

    it('resyncs current/lastVisible/deckLength from the deck', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.minus1]);
      deck.current = 1;
      deck.lastVisible = 1;
      const component = createComponent(deck);
      component.update();
      expect(component.current).toEqual(1);
      expect(component.lastVisible).toEqual(1);
      expect(component.deckLength).toEqual(2);
    });

    it('computes activeAMs as active, visible, not-discarded cards', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.minus1, AttackModifierType.plus2]);
      deck.cards[0].active = true;
      deck.cards[1].active = true;
      deck.cards[2].active = true;
      deck.lastVisible = 2;
      deck.discarded = [1];
      const component = createComponent(deck);
      component.update();
      expect(component.activeAMs).toEqual([deck.cards[0]]);
    });

    it('resets queue/drawing state once the deck is inactive', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.active = false;
      const component = createComponent(deck);
      component.queue = 3;
      component.drawing = true;
      component.update();
      expect(component.queue).toEqual(0);
      expect(component.drawing).toBe(false);
    });
  });

  describe('initCharacter', () => {
    it('resets draw/queue state and syncs from the character/deck', () => {
      const character = buildCharacter();
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.current = 2;
      const component = createComponent(deck, { character });
      component.queue = 5;
      component.drawing = true;
      component.initCharacter();
      expect(component.edition).toEqual('gh');
      expect(component.numeration).toEqual('1');
      expect(component.queue).toEqual(0);
      expect(component.drawing).toBe(false);
      expect(component.current).toEqual(2);
    });
  });

  describe('clickCard', () => {
    it('discards an active, non-discarded card', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.cards[0].active = true;
      const component = createComponent(deck);
      component.clickCard(0, {});
      expect(deck.discarded).toEqual([0]);
    });

    it('restores an active, discarded card when forced', () => {
      const deck = buildDeck([AttackModifierType.plus1]);
      deck.cards[0].active = true;
      deck.discarded = [0];
      const component = createComponent(deck);
      component.clickCard(0, {}, true);
      expect(deck.discarded).toEqual([]);
    });

    it('is a no-op while drawing is in progress for an already-drawn index', () => {
      const deck = buildDeck([AttackModifierType.plus1, AttackModifierType.minus1]);
      deck.cards[1].active = true;
      const component = createComponent(deck);
      component.drawing = true;
      component.current = 2;
      component.clickCard(1, {});
      expect(deck.discarded).toEqual([]);
    });
  });
});

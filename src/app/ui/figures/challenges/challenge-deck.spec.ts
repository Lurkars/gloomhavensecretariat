import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeCard, ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameState } from 'src/app/game/model/Game';
import { Scenario } from 'src/app/game/model/Scenario';
import { ChallengeDeckComponent } from 'src/app/ui/figures/challenges/challenge-deck';

// ChallengeDeckComponent's update() branches on `this.init` (only ever flipped true inside a
// setTimeout scheduled by ngOnInit) — since this spec never calls ngOnInit/detectChanges, `init`
// stays false, so update() always takes its safe "just resync current" branch and never schedules
// drawQueue()'s DOM-touching timeout. Following the AppComponent.spec.ts pattern: create via
// TestBed, never call fixture.detectChanges(), set the required `deck` input via setInput().

function buildDeck(cardCount: number): ChallengeDeck {
  const deck = new ChallengeDeck();
  deck.cards = Array.from({ length: cardCount }, (_, i) => new ChallengeCard(i, 'gh', undefined));
  deck.current = -1;
  deck.finished = -1;
  return deck;
}

function createComponent(deck: ChallengeDeck): ChallengeDeckComponent {
  const fixture = TestBed.createComponent(ChallengeDeckComponent);
  fixture.componentRef.setInput('deck', deck);
  return fixture.componentInstance;
}

describe('ChallengeDeckComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChallengeDeckComponent] }).compileComponents();

    gameManager.game.party.buildings = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
    gameManager.roundManager.firstRound = true;
    settingsManager.settings.automaticAttackModifierFullscreen = false;
    settingsManager.settings.portraitMode = false;
    settingsManager.settings.animations = false;
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(ChallengeDeckComponent);
    fixture.componentRef.setInput('deck', buildDeck(3));
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('reads drawAvailable/keepAvailable from a built, non-wrecked town hall', () => {
      const deck = buildDeck(3);
      gameManager.game.party.buildings = [{ name: 'town-hall', level: 4, state: 'normal' } as any];
      const component = createComponent(deck);
      component.update();
      expect(component.drawAvailable).toEqual(4);
      expect(component.keepAvailable).toEqual(2);
    });

    it('leaves drawAvailable/keepAvailable at 0 for a wrecked town hall', () => {
      const deck = buildDeck(3);
      gameManager.game.party.buildings = [{ name: 'town-hall', level: 4, state: 'wrecked' } as any];
      const component = createComponent(deck);
      component.update();
      expect(component.drawAvailable).toEqual(0);
    });

    it('is disabled outside the first round or without an active scenario', () => {
      const deck = buildDeck(3);
      gameManager.roundManager.firstRound = false;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(true);
    });

    it('is enabled during the first round, in draw state, with an active scenario', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(false);
    });

    it('drawDisabled once the drawn-minus-finished count reaches drawAvailable', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      deck.finished = -1;
      gameManager.game.party.buildings = [{ name: 'town-hall', level: 2, state: 'normal' } as any];
      const component = createComponent(deck);
      component.update();
      expect(component.drawDisabled).toBe(true);
    });

    it('resyncs current from the deck', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      const component = createComponent(deck);
      component.update();
      expect(component.current).toEqual(1);
    });

    it('resets queue/drawing once the deck is inactive', () => {
      const deck = buildDeck(3);
      deck.active = false;
      const component = createComponent(deck);
      component.queue = 2;
      component.drawing = true;
      component.update();
      expect(component.queue).toEqual(0);
      expect(component.drawing).toBe(false);
    });
  });

  describe('clickCard', () => {
    it('toggles keep for a drawn card when not disabled', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      const component = createComponent(deck);
      component.disabled = false;
      component.current = 1;
      component.keepAvailable = 2;
      component.clickCard(0, {});
      expect(deck.keep).toEqual([0]);
      component.clickCard(0, {});
      expect(deck.keep).toEqual([]);
    });

    it('opens instead of toggling when disabled', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      component.disabled = true;
      const opened = vi.spyOn(component, 'open').mockImplementation(() => {});
      component.clickCard(0, {});
      expect(opened).toHaveBeenCalled();
      expect(deck.keep).toEqual([]);
    });

    it('is a no-op for an undrawn card index while not disabled', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      component.disabled = false;
      component.current = 0;
      component.clickCard(2, {});
      expect(deck.keep).toEqual([]);
    });
  });

  describe('doubleClickCard', () => {
    it('opens when not drawing', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      const opened = vi.spyOn(component, 'open').mockImplementation(() => {});
      component.doubleClickCard(0, {});
      expect(opened).toHaveBeenCalled();
    });

    it('is a no-op while drawing for an already-drawn index', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      component.drawing = true;
      component.current = 2;
      const opened = vi.spyOn(component, 'open').mockImplementation(() => {});
      component.doubleClickCard(1, {});
      expect(opened).not.toHaveBeenCalled();
    });
  });
});

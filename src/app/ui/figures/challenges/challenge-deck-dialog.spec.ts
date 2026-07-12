import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeCard, ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameState } from 'src/app/game/model/Game';
import { Scenario } from 'src/app/game/model/Scenario';
import { ChallengeDeckChange } from 'src/app/ui/figures/challenges/challenge-deck';
import { ChallengeDeckDialogComponent } from 'src/app/ui/figures/challenges/challenge-deck-dialog';

// ChallengeDeckDialogComponent's constructor only unpacks DIALOG_DATA and registers a
// uiChangeEffect() (confirmed elsewhere not to run synchronously in tests), so it's cheaply
// constructible. Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges() (ngOnInit never runs — we call update() directly instead), and call
// methods directly. This spec covers update()'s card-bucketing/disabled logic and the simple
// mutation methods (toggleEdit/toggleKeep/remove/restoreCard); the CDK drag-drop handlers
// (dropUpcoming/dropDiscarded/dropFinished) are out of scope.

function buildDeck(cardCount: number): ChallengeDeck {
  const deck = new ChallengeDeck();
  deck.cards = Array.from({ length: cardCount }, (_, i) => new ChallengeCard(i, 'gh', undefined));
  deck.current = -1;
  deck.finished = -1;
  return deck;
}

function createComponent(deck: ChallengeDeck): ChallengeDeckDialogComponent {
  TestBed.configureTestingModule({
    imports: [ChallengeDeckDialogComponent],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: { deck, before: new EventEmitter<ChallengeDeckChange>(), after: new EventEmitter<ChallengeDeckChange>() }
      },
      { provide: DialogRef, useValue: { close: () => {} } }
    ]
  });
  const fixture = TestBed.createComponent(ChallengeDeckDialogComponent);
  return fixture.componentInstance;
}

describe('ChallengeDeckDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.edition = 'gh';
    gameManager.game.party.buildings = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
    gameManager.roundManager.firstRound = true;
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
  });

  describe('update', () => {
    it('buckets cards into upcoming/discarded/finished', () => {
      const deck = buildDeck(5);
      deck.current = 2;
      deck.finished = 0;
      const component = createComponent(deck);
      component.update();
      expect(component.upcomingCards.length).toEqual(2);
      expect(component.discardedCards.length).toEqual(2);
      expect(component.finishedCards.length).toEqual(1);
    });

    it('reads drawAvailable/keepAvailable from a built town hall', () => {
      const deck = buildDeck(3);
      gameManager.game.party.buildings = [{ name: 'town-hall', level: 4, state: 'normal' } as any];
      const component = createComponent(deck);
      component.update();
      expect(component.drawAvailable).toEqual(4);
      expect(component.keepAvailable).toEqual(2);
    });

    it('is disabled outside the first round or without an active scenario', () => {
      const deck = buildDeck(3);
      gameManager.game.scenario = undefined;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(true);
    });
  });

  describe('toggleEdit', () => {
    it('flips the edit flag', () => {
      const deck = buildDeck(3);
      const component = createComponent(deck);
      component.edit = false;
      component.toggleEdit();
      expect(component.edit).toBe(true);
    });
  });

  describe('toggleKeep', () => {
    it('toggles keep during the first round in draw state', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      const component = createComponent(deck);
      component.update();
      component.edit = false;
      component.toggleKeep(0);
      expect(deck.keep).toEqual([0]);
    });

    it('is a no-op for an undrawn index', () => {
      const deck = buildDeck(3);
      deck.current = 0;
      const component = createComponent(deck);
      component.update();
      component.edit = false;
      component.toggleKeep(2);
      expect(deck.keep).toEqual([]);
    });

    it('always toggles when forced, regardless of edit mode', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      const component = createComponent(deck);
      component.edit = true;
      component.toggleKeep(0, true);
      expect(deck.keep).toEqual([0]);
    });
  });

  describe('remove', () => {
    it('removes the card and shifts current back for a drawn card', () => {
      const deck = buildDeck(3);
      deck.current = 1;
      const component = createComponent(deck);
      component.remove(0);
      expect(deck.cards.length).toEqual(2);
      expect(deck.current).toEqual(0);
    });

    it('leaves current unchanged for an upcoming card', () => {
      const deck = buildDeck(3);
      deck.current = 0;
      const component = createComponent(deck);
      component.remove(2);
      expect(deck.cards.length).toEqual(2);
      expect(deck.current).toEqual(0);
    });
  });

  describe('restoreCard', () => {
    it('reinserts a removed card back into the deck', () => {
      const deck = buildDeck(2);
      deck.current = 1;
      const component = createComponent(deck);
      component.update();
      const removedCard = new ChallengeCard(99, 'gh', undefined);
      component.removedCards = [removedCard];
      component.restoreCard(0);
      expect(deck.cards).toContain(removedCard);
    });

    it('is a no-op for an out-of-range index', () => {
      const deck = buildDeck(2);
      const component = createComponent(deck);
      component.removedCards = [];
      component.restoreCard(0);
      expect(deck.cards.length).toEqual(2);
    });
  });
});

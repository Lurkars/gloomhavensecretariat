import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { DeckDrawDirective } from 'src/app/ui/helper/deck-draw';

@Component({
  selector: 'ghs-test-deck',
  template: '<div class="deck"></div>'
})
class TestDeckComponent extends DeckDrawDirective {
  protected drawingClass: string = 'deck';
  deck = { current: -1, active: true };
  all: boolean = false;
  delay: number = 0;
  drawnIndices: number[] = [];
  finished: number = 0;

  protected deckCurrent(): number {
    return this.deck.current;
  }

  protected override drawAll(): boolean {
    return this.all;
  }

  protected override drawn(index: number): number {
    this.drawnIndices.push(index);
    return this.delay;
  }

  protected override queueFinished() {
    this.finished++;
  }

  sync(fromServer: boolean = false) {
    this.updateQueue(this.deck.active, fromServer);
  }
}

describe('DeckDrawDirective', () => {
  let component: TestDeckComponent;
  let animations: boolean;
  let animationSpeed: number;

  beforeEach(() => {
    vi.useFakeTimers();
    animations = settingsManager.settings.animations;
    animationSpeed = settingsManager.settings.animationSpeed;
    settingsManager.settings.animations = true;
    settingsManager.settings.animationSpeed = 1;
    const fixture = TestBed.createComponent(TestDeckComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    component.init = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    settingsManager.settings.animations = animations;
    settingsManager.settings.animationSpeed = animationSpeed;
  });

  it('animates queued draws one card after another', () => {
    component.deck.current = 0;
    component.sync();
    expect(component.current).toBe(0);
    expect(component.drawing).toBe(true);

    component.deck.current = 2;
    component.sync();
    expect(component.current).toBe(0);
    expect(component.queue).toBe(2);

    vi.advanceTimersByTime(1050);
    expect(component.current).toBe(1);
    vi.advanceTimersByTime(1050);
    expect(component.current).toBe(2);
    vi.advanceTimersByTime(1050);
    expect(component.drawing).toBe(false);
    expect(component.queue).toBe(0);
    expect(component.drawnIndices).toEqual([0, 1, 2]);
    expect(component.finished).toBe(1);
  });

  it('jumps to the deck on a bulk change from the initial state', () => {
    component.deck.current = 3;
    component.sync();
    expect(component.current).toBe(3);
    expect(component.drawing).toBe(false);
  });

  it('draws all cards at once when requested', () => {
    component.current = 0;
    component.all = true;
    component.deck.current = 3;
    component.sync();
    expect(component.current).toBe(3);
    expect(component.queue).toBe(0);
    expect(component.drawing).toBe(true);
  });

  it('holds the queue for the extra delay of a drawn card', () => {
    component.delay = 500;
    component.deck.current = 0;
    component.sync();
    component.deck.current = 1;
    component.sync();
    vi.advanceTimersByTime(1050);
    expect(component.current).toBe(0);
    vi.advanceTimersByTime(500);
    expect(component.current).toBe(1);
  });

  it('resets the queue for an inactive deck and when the deck goes back', () => {
    component.deck.current = 0;
    component.sync();
    component.deck.active = false;
    component.deck.current = 2;
    component.sync();
    expect(component.current).toBe(2);
    expect(component.drawing).toBe(false);
    expect(component.queueTimeout).toBeNull();
  });

  it('ignores server updates until the server state is initialized', () => {
    vi.spyOn(gameManager.stateManager, 'wsState').mockReturnValue(WebSocket.OPEN);
    component.deck.current = 0;
    component.sync(true);
    expect(component.current).toBe(0);
    expect(component.drawing).toBe(false);
    expect(component.initServer).toBe(true);

    component.deck.current = 1;
    component.sync(true);
    expect(component.drawing).toBe(true);
    vi.restoreAllMocks();
  });

  it('delays the actual draw', () => {
    const draw = vi.fn();
    component['delayedDraw'](draw);
    expect(component.drawTimeout).not.toBeNull();
    vi.advanceTimersByTime(150);
    expect(draw).toHaveBeenCalled();
    expect(component.drawTimeout).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Loot, LootDeck, LootType } from 'src/app/game/model/data/Loot';
import { GameState } from 'src/app/game/model/Game';
import { LootDeckComponent } from 'src/app/ui/figures/loot/loot-deck';

// LootDeckComponent's update() branches on `this.init` (only ever flipped true inside a setTimeout
// scheduled by ngOnInit) — since this spec never calls ngOnInit/detectChanges, `init` stays false,
// so update() always takes its safe "just resync current" branch and never schedules drawQueue()'s
// DOM-touching timeout. applyLoot() is exercised with LootType.money, whose lootManager.applyLoot()
// return value is always undefined, so the LootRandomItemDialogComponent branch never opens.
// Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges(), set the required `deck` input via setInput().

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildDeck(types: LootType[]): LootDeck {
  const deck = new LootDeck();
  deck.cards = types.map((type, i) => new Loot(type, i, 2, 2, 2));
  deck.current = -1;
  return deck;
}

function createComponent(deck: LootDeck, inputs: Record<string, any> = {}): LootDeckComponent {
  const fixture = TestBed.createComponent(LootDeckComponent);
  fixture.componentRef.setInput('deck', deck);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('LootDeckComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LootDeckComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    settingsManager.settings.automaticAttackModifierFullscreen = false;
    settingsManager.settings.portraitMode = false;
    settingsManager.settings.animations = false;
  });

  it('renders the template without throwing', () => {
    const deck = buildDeck([LootType.money]);
    const fixture = TestBed.createComponent(LootDeckComponent);
    fixture.componentRef.setInput('deck', deck);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('is disabled during the draw state', () => {
      const deck = buildDeck([LootType.money]);
      gameManager.game.state = GameState.draw;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(true);
    });

    it('is enabled once the round has started', () => {
      const deck = buildDeck([LootType.money]);
      gameManager.game.state = GameState.next;
      const component = createComponent(deck);
      component.update();
      expect(component.disabled).toBe(false);
    });

    it('standalone decks are never disabled', () => {
      const deck = buildDeck([LootType.money]);
      gameManager.game.state = GameState.draw;
      const component = createComponent(deck, { standalone: true });
      component.update();
      expect(component.disabled).toBe(false);
    });

    it('resets queue/drawing when the deck is inactive and not standalone', () => {
      const deck = buildDeck([LootType.money]);
      deck.active = false;
      const component = createComponent(deck);
      component.queue = 4;
      component.drawing = true;
      component.update();
      expect(component.queue).toEqual(0);
      expect(component.drawing).toBe(false);
    });

    it('resyncs current from the deck', () => {
      const deck = buildDeck([LootType.money, LootType.lumber]);
      deck.current = 1;
      const component = createComponent(deck);
      component.update();
      expect(component.current).toEqual(1);
    });
  });

  describe('getCharacter', () => {
    it('finds the character who owns the loot card at the given index', () => {
      const character = buildCharacter();
      character.lootCards = [0, 2];
      gameManager.game.figures = [character];
      const deck = buildDeck([LootType.money]);
      const component = createComponent(deck);
      expect(component.getCharacter(2)).toEqual('brute');
      expect(component.getCharacter(1)).toEqual('');
    });

    it('always returns empty when the characters input is false', () => {
      const character = buildCharacter();
      character.lootCards = [0];
      gameManager.game.figures = [character];
      const deck = buildDeck([LootType.money]);
      const component = createComponent(deck, { characters: false });
      expect(component.getCharacter(0)).toEqual('');
    });
  });

  describe('applyLoot', () => {
    it('adds the loot value to the character and records the card index', () => {
      const character = buildCharacter();
      character.loot = 0;
      const deck = buildDeck([LootType.money]);
      const component = createComponent(deck);
      component.applyLoot(character, deck.cards[0], 0);
      expect(character.loot).toEqual(2);
      expect(character.lootCards).toEqual([0]);
    });

    it('is a no-op once the character already has that card recorded', () => {
      const character = buildCharacter();
      character.loot = 0;
      character.lootCards = [0];
      const deck = buildDeck([LootType.money]);
      const component = createComponent(deck);
      component.applyLoot(character, deck.cards[0], 0);
      expect(character.loot).toEqual(0);
      expect(character.lootCards).toEqual([0]);
    });
  });

  describe('clickCard', () => {
    it('is a no-op while drawing is in progress for an already-drawn index', () => {
      const deck = buildDeck([LootType.money, LootType.lumber]);
      const component = createComponent(deck);
      component.drawing = true;
      component.current = 2;
      const opened = vi.spyOn(component, 'open');
      component.clickCard(1, {});
      expect(opened).not.toHaveBeenCalled();
    });

    it('opens otherwise', () => {
      const deck = buildDeck([LootType.money]);
      gameManager.game.state = GameState.draw;
      const component = createComponent(deck);
      const opened = vi.spyOn(component, 'open').mockImplementation(() => {});
      component.clickCard(0, {});
      expect(opened).toHaveBeenCalled();
    });
  });
});

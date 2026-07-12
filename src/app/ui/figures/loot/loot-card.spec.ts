import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { LootComponent } from 'src/app/ui/figures/loot/loot-card';

// LootComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not to run
// synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (we call ngOnInit()/ngOnChanges()
// directly instead), set the required `loot` input via setInput(), and call methods directly. This
// spec covers section parsing/tracking (ngOnInit/hasSection/toggleSection's non-dialog branches) and
// the animate/revealed flags; changeCharacter() is out of scope (it's almost entirely dialog-driven
// character-assignment flow).

function buildLoot(type: LootType, value?: string): Loot {
  return new Loot(type, 1, 2, 2, 2, value);
}

function createComponent(loot: Loot, inputs: Record<string, any> = {}): LootComponent {
  const fixture = TestBed.createComponent(LootComponent);
  fixture.componentRef.setInput('loot', loot);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('LootComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LootComponent] }).compileComponents();

    gameManager.game.edition = 'gh';
    gameManager.game.party.conclusions = [];
    gameManager.game.lootDeckSections = [];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(LootComponent);
    fixture.componentRef.setInput('loot', buildLoot(LootType.money));
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('ngOnInit', () => {
    it('parses pipe-separated sections for a special1 loot card', () => {
      const loot = buildLoot(LootType.special1, 's1|s2');
      const component = createComponent(loot);
      component.ngOnInit();
      expect(component.sections).toEqual(['s1', 's2']);
    });

    it('leaves sections empty for a non-special loot card', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.ngOnInit();
      expect(component.sections).toEqual([]);
    });

    it('sets animate true unless disableFlip is set', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot, { disableFlip: true });
      component.ngOnInit();
      expect(component.animate).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('flips animate on when flipped transitions to true', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.animate = false;
      component.ngOnChanges({ flipped: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
      expect(component.animate).toBe(true);
    });

    it('does not flip animate when disableFlip is set', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot, { disableFlip: true });
      component.animate = false;
      component.ngOnChanges({ flipped: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
      expect(component.animate).toBe(false);
    });
  });

  describe('onChange', () => {
    it('stores the revealed flag', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.onChange(true);
      expect(component.revealed).toBe(true);
    });
  });

  describe('hasSection', () => {
    it('reflects membership in party.conclusions for the current edition', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('s1', 'gh')];
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      expect(component.hasSection('s1')).toBe(true);
      expect(component.hasSection('s2')).toBe(false);
    });
  });

  describe('toggleSection', () => {
    function fakeEvent() {
      return { preventDefault: () => {}, stopPropagation: () => {} } as any;
    }

    it('is a no-op when the section is already present without force', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('s1', 'gh')];
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.toggleSection(fakeEvent(), 's1');
      expect(gameManager.game.party.conclusions.length).toEqual(1);
    });

    it('removes an already-present section when forced', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('s1', 'gh')];
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.toggleSection(fakeEvent(), 's1', true);
      expect(gameManager.game.party.conclusions).toEqual([]);
    });

    it('adds a section directly when no matching conclusion scenario data exists', () => {
      const loot = buildLoot(LootType.money);
      const component = createComponent(loot);
      component.toggleSection(fakeEvent(), 's1');
      expect(gameManager.game.party.conclusions.some((m) => m.index === 's1' && m.edition === 'gh')).toBe(true);
      expect(gameManager.game.lootDeckSections).toEqual(['s1']);
    });
  });
});

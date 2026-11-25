import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { AdditionalIdentifier, CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemSlot } from 'src/app/game/model/data/ItemData';
import { GameState } from 'src/app/game/model/Game';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';

// ItemsDialogComponent's constructor/ngOnInit pulls item data via ItemManager (already covered by
// ItemManager.spec.ts) and populates filtered/sorted lists — pure derived state built from the
// edition's item pool plus a selected character. Following the AppComponent.spec.ts pattern: create
// via TestBed, never call fixture.detectChanges() (ngOnInit never runs; we call updateEditionItems()
// directly instead), and exercise the filter/sort/select logic and simple state-mutating methods.

function buildItem(overrides: Partial<ItemData> = {}): ItemData {
  return Object.assign(new ItemData(), { edition: 'gh', count: 1 }, overrides);
}

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(overrides: Record<string, any> = {}): ItemsDialogComponent {
  TestBed.configureTestingModule({
    imports: [ItemsDialogComponent],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: { edition: 'gh', select: undefined, affordable: false, craftOnly: false, buyOnly: false, owned: undefined, ...overrides }
      },
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(ItemsDialogComponent);
  return fixture.componentInstance;
}

describe('ItemsDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.campaignMode = false;
    gameManager.game.state = GameState.draw;
    gameManager.game.round = 0;
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.filteredItems = [];
    gameManager.game.party.buildings = [];
    gameManager.editionManager.editionData = [
      Object.assign(
        new EditionData(
          'gh',
          [],
          [],
          [],
          [],
          [],
          [
            buildItem({ id: 1, name: 'boots', slot: ItemSlot.legs }),
            buildItem({ id: 2, name: 'hat', slot: ItemSlot.head }),
            buildItem({ id: 3, name: 'ring', slot: undefined })
          ]
        )
      )
    ];
    settingsManager.settings.editions = ['gh'];
  });

  it('constructs with the requested edition and no character selected', () => {
    const component = createComponent();
    expect(component.edition).toEqual('gh');
    expect(component.character).toBeUndefined();
  });

  it('renders the template (running ngOnInit) without throwing', () => {
    TestBed.configureTestingModule({
      imports: [ItemsDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { edition: 'gh', select: undefined, affordable: false, craftOnly: false, buyOnly: false } },
        { provide: DialogRef, useValue: { close: () => {} } },
        { provide: Dialog, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(ItemsDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('updateEditionItems / update', () => {
    it('populates items from the edition item pool', () => {
      const component = createComponent();
      component.updateEditionItems();
      expect(component.items.map((i) => i.id).sort()).toEqual([1, 2, 3]);
    });

    it('filters items by the free-text filter against the item name', () => {
      const component = createComponent();
      component.updateEditionItems();
      component.filter = 'boots';
      component.update();
      expect(component.items.map((i) => i.id)).toEqual([1]);
    });

    it('flags itemSlotUndefined when at least one visible item has no slot', () => {
      const component = createComponent();
      component.updateEditionItems();
      expect(component.itemSlotUndefined).toBe(true);
    });

    it('restricts to the selected item slots once itemSlots is set', () => {
      const component = createComponent();
      component.updateEditionItems();
      component.itemSlots = [ItemSlot.legs];
      component.update();
      expect(component.items.map((i) => i.id)).toEqual([1]);
    });

    it('populates the character roster from game.figures', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent();
      component.updateEditionItems();
      expect(component.characters).toEqual([character]);
    });
  });

  describe('toggleItemSlotFilter', () => {
    it('sets a single-slot filter by default', () => {
      const component = createComponent();
      component.updateEditionItems();
      component.toggleItemSlotFilter(ItemSlot.legs);
      expect(component.itemSlots).toEqual([ItemSlot.legs]);
    });

    it('adds to the filter when add=true', () => {
      const component = createComponent();
      component.updateEditionItems();
      component.toggleItemSlotFilter(ItemSlot.legs);
      component.toggleItemSlotFilter(ItemSlot.head, true);
      expect(component.itemSlots).toEqual([ItemSlot.legs, ItemSlot.head]);
    });

    it('removes an already-active slot filter', () => {
      const component = createComponent();
      component.updateEditionItems();
      component.itemSlots = [ItemSlot.legs];
      component.toggleItemSlotFilter(ItemSlot.legs, true);
      expect(component.itemSlots).toEqual([]);
    });
  });

  describe('select', () => {
    it('is a no-op without data.select set', () => {
      const component = createComponent();
      const item = buildItem({ id: 1 });
      component.select(item);
      expect(component.selected).toBeUndefined();
    });

    it('selects an owned/addable item when force is set', () => {
      const character = buildCharacter();
      const component = createComponent({ select: character });
      const item = buildItem({ id: 1 });
      component.select(item, true);
      expect(component.selected).toBe(item);
    });

    it('toggles off when selecting the already-selected item', () => {
      const character = buildCharacter();
      const component = createComponent({ select: character });
      const item = buildItem({ id: 1 });
      component.select(item, true);
      component.select(item, true);
      expect(component.selected).toBeUndefined();
    });
  });

  describe('select during a running scenario', () => {
    function ownedCharacter(): Character {
      const character = buildCharacter();
      character.progress.items = [new AdditionalIdentifier(1, 'gh')];
      return character;
    }

    afterEach(() => {
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 0;
    });

    it('selects an owned item with a single click between scenarios', () => {
      const component = createComponent({ select: ownedCharacter() });
      const item = buildItem({ id: 1 });
      component.select(item);
      expect(component.selected).toBe(item);
    });

    it('ignores single clicks while a scenario is running', () => {
      gameManager.game.state = GameState.next;
      gameManager.game.round = 1;
      const component = createComponent({ select: ownedCharacter() });
      const item = buildItem({ id: 1 });
      component.select(item);
      expect(component.selected).toBeUndefined();
    });

    it('deselects with a single click while a scenario is running', () => {
      gameManager.game.state = GameState.next;
      gameManager.game.round = 1;
      const component = createComponent({ select: ownedCharacter() });
      const item = buildItem({ id: 2 });
      component.select(item, true);
      component.select(buildItem({ id: 3 }));
      expect(component.selected).toBeUndefined();
    });

    it('selects with a forced double click while a scenario is running', () => {
      gameManager.game.state = GameState.next;
      gameManager.game.round = 1;
      const component = createComponent({ select: ownedCharacter() });
      const item = buildItem({ id: 2 });
      component.select(item, true);
      expect(component.selected).toBe(item);
    });
  });

  describe('unlocked / unlockItemReveal / removeUnlocked', () => {
    it('unlocked reflects membership in party.unlockedItems', () => {
      const component = createComponent();
      gameManager.game.party.unlockedItems = [new CountIdentifier(5, 'gh')];
      expect(component.unlocked(buildItem({ id: 5 }))).toBe(true);
      expect(component.unlocked(buildItem({ id: 6 }))).toBe(false);
    });

    it('unlockItemReveal adds the item once revealed while pending in unlocks', () => {
      const component = createComponent();
      const item = buildItem({ id: 7 });
      component.unlocks = [item];
      component.unlockItemReveal(item, true);
      expect(component.unlocked(item)).toBe(true);
    });

    it('unlockItemReveal is a no-op when the item is not pending', () => {
      const component = createComponent();
      const item = buildItem({ id: 7 });
      component.unlocks = [];
      component.unlockItemReveal(item, true);
      expect(component.unlocked(item)).toBe(false);
    });

    it('removeUnlocked removes a previously-unlocked item', () => {
      const component = createComponent();
      gameManager.game.party.unlockedItems = [new CountIdentifier(5, 'gh')];
      component.removeUnlocked(buildItem({ id: 5 }));
      expect(component.unlocked(buildItem({ id: 5 }))).toBe(false);
    });
  });

  describe('filtered / filterItem / removeFilterItem', () => {
    it('filtered reflects membership in party.filteredItems', () => {
      const component = createComponent();
      gameManager.game.party.filteredItems = [new CountIdentifier(5, 'gh')];
      expect(component.filtered(buildItem({ id: 5 }))).toBe(true);
      expect(component.filtered(buildItem({ id: 6 }))).toBe(false);
    });

    it('filterItem adds the item to party.filteredItems', () => {
      const component = createComponent();
      component.filterItem(buildItem({ id: 9 }));
      expect(component.filtered(buildItem({ id: 9 }))).toBe(true);
    });

    it('removeFilterItem removes it again', () => {
      const component = createComponent();
      gameManager.game.party.filteredItems = [new CountIdentifier(9, 'gh')];
      component.removeFilterItem(buildItem({ id: 9 }));
      expect(component.filtered(buildItem({ id: 9 }))).toBe(false);
    });
  });

  describe('addItem / removeItem', () => {
    it('adds an item to the selected character progress', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent({ select: character });
      const item = buildItem({ id: 1, count: 1 });
      component.addItem(item, true);
      expect(character.progress.items.some((i) => i.name === '1' && i.edition === 'gh')).toBe(true);
    });

    it('removes a previously-added item', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent({ select: character });
      const item = buildItem({ id: 1, count: 1 });
      component.addItem(item, true);
      component.removeItem(item);
      expect(character.progress.items.some((i) => i.name === '1' && i.edition === 'gh')).toBe(false);
    });

    it('is a no-op without a selected character', () => {
      const component = createComponent();
      const item = buildItem({ id: 1, count: 1 });
      expect(() => component.addItem(item, true)).not.toThrow();
    });
  });

  describe('toggleCharacter', () => {
    it('selects the given character', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent();
      component.updateEditionItems();
      component.toggleCharacter(character);
      expect(component.character).toBe(character);
    });

    it('deselects when toggling the already-selected character', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent({ select: character });
      component.updateEditionItems();
      component.toggleCharacter(character);
      expect(component.character).toBeUndefined();
    });
  });

  describe('owned mode', () => {
    function ownedCharacter(): Character {
      const character = buildCharacter();
      character.progress.items = [new AdditionalIdentifier(2, 'gh'), new AdditionalIdentifier(1, 'gh')];
      gameManager.game.figures = [character];
      return character;
    }

    it('lists all items without a character', () => {
      const component = createComponent();
      expect(component.owned).toBe(false);
    });

    it('lists all items for a character without items', () => {
      expect(createComponent({ select: buildCharacter() }).owned).toBe(false);
    });

    it('starts with owned items for a character owning items', () => {
      const component = createComponent({ select: ownedCharacter(), affordable: true });
      expect(component.owned).toBe(true);
      expect(component.affordable).toBe(false);
    });

    it('respects an explicit owned=false', () => {
      expect(createComponent({ select: ownedCharacter(), owned: false }).owned).toBe(false);
    });

    it('starts with all items for building interactions', () => {
      expect(createComponent({ select: ownedCharacter(), craftOnly: true }).owned).toBe(false);
    });

    it('lists only the owned items, sorted by slot, all marked owned', () => {
      const component = createComponent({ select: ownedCharacter() });
      component.onlyEquipped = false;
      component.updateEditionItems();
      expect(component.items.map((i) => i.id)).toEqual([2, 1]);
      expect(component.itemsMeta.every((meta) => meta.owned)).toBe(true);
    });

    it('applies the text filter to owned items', () => {
      const component = createComponent({ select: ownedCharacter() });
      component.onlyEquipped = false;
      component.filter = 'boots';
      component.updateEditionItems();
      expect(component.items.map((i) => i.id)).toEqual([1]);
    });

    it('filters to equipped items when onlyEquipped is set', () => {
      const character = ownedCharacter();
      character.progress.equippedItems = [new AdditionalIdentifier(1, 'gh')];
      const component = createComponent({ select: character });
      component.onlyEquipped = true;
      component.updateEditionItems();
      expect(component.items.map((i) => i.id)).toEqual([1]);
    });

    it('showAvailable switches back to the full list', () => {
      const component = createComponent({ select: ownedCharacter() });
      component.updateEditionItems();
      component.showAvailable();
      expect(component.owned).toBe(false);
      expect(component.items.map((i) => i.id).sort()).toEqual([1, 2, 3]);
    });

    it('renders owned items as character items without throwing', () => {
      const character = ownedCharacter();
      TestBed.configureTestingModule({
        imports: [ItemsDialogComponent],
        providers: [
          { provide: DIALOG_DATA, useValue: { edition: 'gh', select: character, affordable: false, craftOnly: false, buyOnly: false } },
          { provide: DialogRef, useValue: { close: () => {} } },
          { provide: Dialog, useValue: {} }
        ]
      });
      const fixture = TestBed.createComponent(ItemsDialogComponent);
      fixture.componentInstance.onlyEquipped = false;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(fixture.nativeElement.querySelectorAll('ghs-character-item').length).toEqual(2);
    });
  });
});

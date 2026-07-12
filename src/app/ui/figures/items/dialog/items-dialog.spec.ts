import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemSlot } from 'src/app/game/model/data/ItemData';
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
        useValue: { edition: 'gh', select: undefined, affordable: false, craftOnly: false, buyOnly: false, ...overrides }
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
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.filteredItems = [];
    gameManager.game.party.buildings = [];
    gameManager.editionData = [
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
});

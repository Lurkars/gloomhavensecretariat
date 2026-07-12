import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { CharacterItemsComponent } from 'src/app/ui/figures/items/items';

// CharacterItemsComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not
// to run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit never runs; we call
// updateItems()/set state directly instead), and call methods directly. This spec covers the
// afford/craft eligibility checks (canAdd/assigned/canBuy/canCraft), the state-mutating add/buy/craft
// flows, isEquipped/toggleEquippedItem, and setItemNotes — not the dialog-opening flows
// (removeItem/sellItem/distillItem/openItem/brewDialog/itemDialog).

function buildItem(overrides: Partial<ItemData> = {}): ItemData {
  return Object.assign(new ItemData(), { edition: 'gh', count: 1 }, overrides);
}

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(character: Character): CharacterItemsComponent {
  const fixture = TestBed.createComponent(CharacterItemsComponent);
  fixture.componentRef.setInput('character', character);
  return fixture.componentInstance;
}

describe('CharacterItemsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterItemsComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.round = 0;
    gameManager.game.party.loot = {};
    gameManager.game.party.buildings = [];
    gameManager.game.party.campaignMode = false;
    gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []))];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(CharacterItemsComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('canAdd / assigned', () => {
    it('is true for an available item the character does not already own', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1 });
      expect(component.canAdd(item)).toBe(true);
    });

    it('is false once the item is already fully assigned', () => {
      const characterA = buildCharacter();
      const characterB = buildCharacter();
      const item = buildItem({ id: 1, count: 1 });
      characterA.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [characterA, characterB];
      const component = createComponent(characterB);
      expect(component.canAdd(item)).toBe(false);
    });

    it('is false once the character already owns the item', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 1, count: 1 });
      character.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [character];
      const component = createComponent(character);
      expect(component.canAdd(item)).toBe(false);
    });
  });

  describe('canBuy', () => {
    it('is true when the character can afford the item and it is still available', () => {
      const character = buildCharacter();
      character.progress.gold = 20;
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, cost: 10 });
      expect(component.canBuy(item)).toBe(true);
    });

    it('is false when the character cannot afford it', () => {
      const character = buildCharacter();
      character.progress.gold = 5;
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, cost: 10 });
      expect(component.canBuy(item)).toBe(false);
    });
  });

  describe('canCraft', () => {
    it('is true once the character has enough of the required resource', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 5 };
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, resources: { [LootType.lumber]: 3 } });
      expect(component.canCraft(item)).toBe(true);
    });

    it('falls back to shared party resources for herb-class resources', () => {
      const character = buildCharacter();
      character.progress.loot = {};
      gameManager.game.party.loot = { [LootType.rockroot]: 3 };
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, resources: { [LootType.rockroot]: 3 } });
      expect(component.canCraft(item)).toBe(true);
    });

    it('is false when neither the character nor the party has enough resources', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 1 };
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, resources: { [LootType.lumber]: 3 } });
      expect(component.canCraft(item)).toBe(false);
    });
  });

  describe('addItem', () => {
    it('adds the item to the character progress and local items list', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1 });
      component.addItem(item, true);
      expect(character.progress.items.some((i) => i.name === '1' && i.edition === 'gh')).toBe(true);
      expect(component.items).toContain(item);
    });

    it('is a no-op when the item cannot be added and force is not set', () => {
      const character = buildCharacter();
      character.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1 });
      component.addItem(item);
      expect(character.progress.items.length).toEqual(1);
    });
  });

  describe('buyItem', () => {
    it('deducts gold and adds the item', () => {
      const character = buildCharacter();
      character.progress.gold = 20;
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, cost: 10 });
      component.buyItem(item);
      expect(character.progress.gold).toEqual(10);
      expect(character.progress.items.some((i) => i.name === '1')).toBe(true);
    });
  });

  describe('craftItem', () => {
    it('spends the required resources and adds the item', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 5 };
      gameManager.game.figures = [character];
      const component = createComponent(character);
      const item = buildItem({ id: 1, count: 1, resources: { [LootType.lumber]: 3 } });
      component.craftItem(item);
      expect(character.progress.loot[LootType.lumber]).toEqual(2);
      expect(character.progress.items.some((i) => i.name === '1')).toBe(true);
    });
  });

  describe('isEquipped / toggleEquippedItem', () => {
    it('isEquipped reflects membership in equippedItems', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 1 });
      character.progress.equippedItems = [{ name: '1', edition: 'gh' } as any];
      gameManager.game.figures = [character];
      const component = createComponent(character);
      expect(component.isEquipped(item)).toBeTruthy();
    });

    it('toggleEquippedItem equips an owned item during the draw phase before round 1', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 1 });
      character.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [character];
      gameManager.game.state = 'draw' as any;
      gameManager.game.round = 0;
      const component = createComponent(character);
      component.toggleEquippedItem(item);
      expect(component.isEquipped(item)).toBeTruthy();
    });

    it('is disabled once the round has started, unless forced', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 1 });
      character.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [character];
      gameManager.game.state = 'next' as any;
      gameManager.game.round = 1;
      const component = createComponent(character);
      component.toggleEquippedItem(item);
      expect(component.isEquipped(item)).toBeFalsy();
      component.toggleEquippedItem(item, true);
      expect(component.isEquipped(item)).toBeTruthy();
    });
  });

  describe('setItemNotes', () => {
    it('updates the character item notes', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.setItemNotes({ target: { value: 'some notes' } });
      expect(character.progress.itemNotes).toEqual('some notes');
    });
  });
});

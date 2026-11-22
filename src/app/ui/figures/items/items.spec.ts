import { TestBed } from '@angular/core/testing';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { CharacterItemsComponent } from 'src/app/ui/figures/items/items';

// CharacterItemsComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not
// to run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit never runs; we call
// updateItems()/set state directly instead), and call methods directly. This spec covers
// isEquipped/toggleEquippedItem and setItemNotes - not the dialog-opening flows
// (removeItem/sellItem/distillItem/openItem/brewDialog/itemDialog). Item rules (add/buy/craft/sell)
// live in ItemManager and are covered by ItemManager.spec.ts.

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
    // spec files share the gameManager singleton (vitest runs non-isolated), reputation changes item prices
    gameManager.game.party.reputation = 0;
    gameManager.game.party.specialItems = [];
    gameManager.game.party.campaignMode = false;
    gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []))];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(CharacterItemsComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
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

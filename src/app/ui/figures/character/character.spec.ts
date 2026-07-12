import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { CharacterComponent } from 'src/app/ui/figures/character/character';

// CharacterComponent renders one figure's control surface (hp/xp/loot/token drag handles, initiative,
// conditions, attack-modifier-deck visibility). Its viewChild.required refs (characterName/
// summonButton) are only read by the dialog-opening methods, so — following the AppComponent.spec.ts
// pattern of never calling fixture.detectChanges() — we can construct it, call update() manually
// (ngOnInit never runs without detectChanges), and exercise the pure drag-clamping and condition/
// token/loot mutation methods directly, as long as we avoid the dialog-opening methods that need the
// unresolved viewChilds.

function buildCharacter(overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }, overrides);
  return new Character(data, 1);
}

function createComponent(character: Character): CharacterComponent {
  const fixture = TestBed.createComponent(CharacterComponent);
  fixture.componentRef.setInput('character', character);
  return fixture.componentInstance;
}

describe('CharacterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.round = 0;
    gameManager.game.state = GameState.draw;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.characterCompact = false;
    settingsManager.settings.characterAttackModifierDeckPermanent = false;
    settingsManager.settings.characterAttackModifierDeckPermanentActive = false;
    settingsManager.settings.characterAttackModifierDeckActiveBottom = false;
    settingsManager.settings.automaticAttackModifierFullscreen = false;
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(CharacterComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('syncs the displayed hp/title/off state from the character', () => {
      const character = buildCharacter();
      character.health = 3;
      character.exhausted = false;
      const component = createComponent(character);
      component.update();
      expect(component.characterHp).toEqual(3);
      expect(component.characterMaxHp).toEqual(character.maxHealth);
      expect(component.off).toBe(false);
    });

    it('marks off once the character is exhausted or at 0 hp', () => {
      const character = buildCharacter();
      character.health = 0;
      const component = createComponent(character);
      component.update();
      expect(component.off).toBe(true);
    });
  });

  describe('dragInitiativeMove / dragInitiativeEnd', () => {
    it('clamps the dragged value to [0, 99]', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.dragInitiativeMove(150);
      expect(component.initiative).toEqual(99);
      component.dragInitiativeMove(-5);
      expect(component.initiative).toEqual(0);
    });

    it('forces a minimum of 1 when initiative is required and the round is active', () => {
      const character = buildCharacter();
      gameManager.game.state = GameState.next;
      const component = createComponent(character);
      component.dragInitiativeMove(0);
      expect(component.initiative).toEqual(1);
    });

    it('dragInitiativeEnd commits the value onto the character', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.dragInitiativeEnd(42);
      expect(character.initiative).toEqual(42);
      expect(character.initiativeVisible).toBe(true);
    });

    it('dragInitiativeEnd sets longRest when the value is 99', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.dragInitiativeEnd(99);
      expect(character.longRest).toBe(true);
    });
  });

  describe('dragHpMove / dragHpEnd', () => {
    it('caps healing so total health never exceeds maxHealth', () => {
      const character = buildCharacter();
      character.health = character.maxHealth - 1;
      const component = createComponent(character);
      component.dragHpMove(5);
      expect(component.health).toEqual(1);
    });

    it('dragHpEnd applies the pending delta and resets it', () => {
      const character = buildCharacter();
      character.health = 5;
      const component = createComponent(character);
      component.dragHpMove(-2);
      component.dragHpEnd();
      expect(character.health).toEqual(3);
      expect(component.health).toEqual(0);
    });

    it('dragHpEnd is a no-op when no delta is pending', () => {
      const character = buildCharacter();
      character.health = 5;
      const component = createComponent(character);
      component.dragHpEnd();
      expect(character.health).toEqual(5);
    });
  });

  describe('dragXpMove / dragXpEnd / addExperience', () => {
    it('dragXpMove never allows experience to go negative', () => {
      const character = buildCharacter();
      character.experience = 2;
      const component = createComponent(character);
      component.dragXpMove(-5);
      expect(component.experience).toEqual(-2);
    });

    it('dragXpEnd commits the pending delta', () => {
      const character = buildCharacter();
      character.experience = 2;
      const component = createComponent(character);
      component.dragXpMove(3);
      component.dragXpEnd();
      expect(character.experience).toEqual(5);
      expect(component.experience).toEqual(0);
    });

    it('addExperience is a no-op when it would drive experience negative', () => {
      const character = buildCharacter();
      character.experience = 2;
      const component = createComponent(character);
      component.addExperience(-5);
      expect(character.experience).toEqual(2);
    });

    it('addExperience commits when the result stays non-negative', () => {
      const character = buildCharacter();
      character.experience = 2;
      const component = createComponent(character);
      component.addExperience(3);
      expect(character.experience).toEqual(5);
    });
  });

  describe('dragLootMove / dragLootEnd / addLoot', () => {
    it('dragLootMove never allows loot to go negative', () => {
      const character = buildCharacter();
      character.loot = 1;
      const component = createComponent(character);
      component.dragLootMove(-5);
      expect(component.loot).toEqual(-1);
    });

    it('dragLootEnd commits the pending delta', () => {
      const character = buildCharacter();
      character.loot = 1;
      const component = createComponent(character);
      component.dragLootMove(2);
      component.dragLootEnd();
      expect(character.loot).toEqual(3);
    });

    it('addLoot is a no-op when it would drive loot negative', () => {
      const character = buildCharacter();
      character.loot = 1;
      const component = createComponent(character);
      component.addLoot(-5);
      expect(character.loot).toEqual(1);
    });
  });

  describe('dragCancel', () => {
    it('resets all pending drag deltas', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.health = 3;
      component.experience = 3;
      component.loot = 3;
      component.token = 3;
      component.dragCancel();
      expect(component.health).toEqual(0);
      expect(component.experience).toEqual(0);
      expect(component.loot).toEqual(0);
      expect(component.token).toEqual(0);
    });
  });

  describe('removeCondition', () => {
    it('removes a matching immunity entry', () => {
      const character = buildCharacter();
      character.immunities = [ConditionName.poison];
      const component = createComponent(character);
      const condition = new EntityCondition(ConditionName.poison);
      component.removeCondition(condition);
      expect(character.immunities).toEqual([]);
    });

    it('decrements value for a stackable condition instead of removing it', () => {
      const character = buildCharacter();
      const condition = new EntityCondition(ConditionName.bless, 3);
      const component = createComponent(character);
      component.removeCondition(condition);
      expect(condition.value).toEqual(2);
    });
  });

  describe('removeMarker', () => {
    it('removes the marker from the character marker list', () => {
      const character = buildCharacter();
      character.markers = ['gh-fire', 'gh-ice'];
      const component = createComponent(character);
      component.removeMarker('gh-fire');
      expect(character.markers).toEqual(['gh-ice']);
    });
  });

  describe('removeExtraAction', () => {
    it('removes the action from the non-persistent list by default', () => {
      const character = buildCharacter();
      const action = new Action(ActionType.heal, 1);
      character.extraActions = [action];
      const component = createComponent(character);
      component.removeExtraAction(action);
      expect(character.extraActions).toEqual([]);
    });

    it('removes the action from the persistent list when requested', () => {
      const character = buildCharacter();
      const action = new Action(ActionType.heal, 1);
      character.extraActionsPersistent = [action];
      const component = createComponent(character);
      component.removeExtraAction(action, true);
      expect(character.extraActionsPersistent).toEqual([]);
    });
  });

  describe('toggleAttackModifierDeckVisible', () => {
    it('toggles the deck active/visible directly when no special settings are on', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.toggleAttackModifierDeckVisible();
      expect(character.attackModifierDeck.active).toBe(true);
      expect(character.attackModifierDeckVisible).toBe(true);
    });

    it('hides other characters decks when characterAttackModifierDeckActiveBottom is set', () => {
      settingsManager.settings.characterAttackModifierDeckActiveBottom = true;
      const character = buildCharacter();
      const other = buildCharacter({ name: 'scoundrel' } as any);
      other.attackModifierDeckVisible = true;
      gameManager.game.figures = [character, other];
      const component = createComponent(character);
      component.toggleAttackModifierDeckVisible();
      expect(character.attackModifierDeckVisible).toBe(true);
      expect(other.attackModifierDeckVisible).toBe(false);
    });
  });

  describe('toggleLootCardsVisible', () => {
    it('hides the loot cards once visible', () => {
      const character = buildCharacter();
      character.lootCardsVisible = true;
      const component = createComponent(character);
      component.toggleLootCardsVisible();
      expect(character.lootCardsVisible).toBe(false);
    });

    it('shows loot cards and hides the attack modifier deck otherwise', () => {
      const character = buildCharacter();
      character.lootCardsVisible = false;
      character.attackModifierDeck.active = true;
      character.attackModifierDeckVisible = true;
      const component = createComponent(character);
      component.toggleLootCardsVisible();
      expect(character.lootCardsVisible).toBe(true);
      expect(character.attackModifierDeck.active).toBe(false);
      expect(character.attackModifierDeckVisible).toBe(false);
    });
  });
});

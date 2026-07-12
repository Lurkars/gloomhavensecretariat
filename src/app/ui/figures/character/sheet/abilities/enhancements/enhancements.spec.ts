import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { EnhancementsComponent } from 'src/app/ui/figures/character/sheet/abilities/enhancements/enhancements';

// EnhancementsComponent has no injected Dialog and its `close()`/`apply()` only emit an output
// (never open a dialog), so it's a clean target for the AppComponent.spec.ts pattern: create via
// TestBed, never call fixture.detectChanges() (ngOnInit never runs — we call it directly instead),
// set inputs via setInput(). enhancementsManager's square/circle/diamond/hex action-type lists are
// static class fields (no gameManager/editionData setup needed). This spec covers ngOnInit's
// customAction fallback path, update()'s enhancement-type selection, setEnhancementAction,
// toggleSpecial, setEdition, close(), and apply()'s cost-gating.

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(inputs: Record<string, any> = {}): EnhancementsComponent {
  const fixture = TestBed.createComponent(EnhancementsComponent);
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  return fixture.componentInstance;
}

describe('EnhancementsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EnhancementsComponent] }).compileComponents();
    gameManager.game.edition = 'gh';
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(EnhancementsComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    fixture.componentRef.setInput('action', new Action(ActionType.attack, 1));
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('ngOnInit', () => {
    it('falls back to customAction mode without a resolvable ability (no cardId/actionIndex)', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.ngOnInit();
      expect(component.customAction).toBe(true);
      expect(component.action.type).toEqual(ActionType.attack);
    });

    it('clones the provided action rather than mutating the input', () => {
      const inputAction = new Action(ActionType.heal, 3);
      const component = createComponent({ action: inputAction });
      component.ngOnInit();
      component.action.value = 99;
      expect(inputAction.value).toEqual(3);
    });
  });

  describe('update', () => {
    it('selects the diamond enhancement type for a negative condition action', () => {
      const component = createComponent({ action: new Action(ActionType.condition, ConditionName.poison) });
      component.ngOnInit();
      expect(component.enhancementType).toBeDefined();
    });

    it('resets to a plain attack action once the action type is not in the allowed set', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.ngOnInit();
      component.action = new Action(ActionType.jump, 1);
      component.update();
      expect(component.action.type).toEqual(ActionType.attack);
    });

    it('forces the summon action type set when special is "summon"', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.ngOnInit();
      component.special = 'summon';
      component.update();
      expect(component.actionTypes).toEqual(gameManager.enhancementsManager.summonActions);
      expect(component.enhancementType).toEqual('square');
    });
  });

  describe('setEnhancementAction', () => {
    it('sets the chosen enhancement action and recomputes', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.ngOnInit();
      component.setEnhancementAction(ActionType.jump as any);
      expect(component.enhancementAction).toEqual(ActionType.jump);
      expect(component.enhanceAction.type).toEqual(ActionType.jump);
    });
  });

  describe('toggleSpecial', () => {
    it('sets the special mode and clears it on a second toggle', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.ngOnInit();
      component.toggleSpecial('lost');
      expect(component.special).toEqual('lost');
      component.toggleSpecial('lost');
      expect(component.special).toBeUndefined();
    });
  });

  describe('setEdition', () => {
    it('updates gameManager.game.edition', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      component.setEdition('fh');
      expect(gameManager.game.edition).toEqual('fh');
    });
  });

  describe('close', () => {
    it('emits triggerClose', () => {
      const component = createComponent({ action: new Action(ActionType.attack, 1) });
      let emitted = false;
      component.triggerClose.subscribe(() => (emitted = true));
      component.close();
      expect(emitted).toBe(true);
    });
  });

  describe('apply', () => {
    it('is a no-op without the required card/action-index context', () => {
      const character = buildCharacter();
      character.progress.gold = 100;
      const component = createComponent({ action: new Action(ActionType.attack, 1), character });
      component.ngOnInit();
      component.apply();
      expect(character.progress.enhancements).toEqual([]);
    });

    it('applies and deducts gold when forced with full context', () => {
      const character = buildCharacter();
      character.progress.gold = 100;
      character.progress.enhancements = [];
      const component = createComponent({
        action: new Action(ActionType.attack, 1),
        character,
        actionIndex: '0',
        cardId: 1,
        enhancementIndex: 0
      });
      component.ngOnInit();
      component.apply(true);
      expect(character.progress.enhancements.length).toEqual(1);
      expect(character.progress.gold).toEqual(100);
    });

    it('deducts gold based on calculated cost when not forced and affordable', () => {
      const character = buildCharacter();
      character.progress.gold = 1000;
      character.progress.enhancements = [];
      gameManager.game.party.prosperity = 100;
      const component = createComponent({
        action: new Action(ActionType.attack, 1),
        character,
        actionIndex: '0',
        cardId: 1,
        enhancementIndex: 0
      });
      component.ngOnInit();
      const goldBefore = character.progress.gold;
      component.apply();
      expect(character.progress.enhancements.length).toEqual(1);
      expect(character.progress.gold).toBeLessThan(goldBefore);
    });
  });
});

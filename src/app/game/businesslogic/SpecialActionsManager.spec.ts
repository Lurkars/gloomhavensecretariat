import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterSpecialAction, CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

// This spec covers the generic, name-independent mechanics (beforeTurn's extraActions/
// entityConditions cleanup, and the triggerSlot() slot-advancing state machine used by every
// character with slot-based special actions), plus the per-character-name effects below
// (boneshaper, astral, blinkblade, shackles, eclipse, fist, demolitionist, lightning). The file
// covers only 7-8 characters total, so unlike the other business-logic managers this one is
// small enough to cover fairly exhaustively rather than sampling a slice.

function buildCharacter(name: string = 'generic-character', edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), { name, edition, stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildSummon(name: string = 'shambling-skeleton'): Summon {
  const summon = new Summon('summon-uuid', name, '1', 1, 1, SummonColor.blue);
  summon.health = 5;
  summon.maxHealth = 5;
  summon.movement = 2;
  return summon;
}

describe('SpecialActionsManager', () => {
  const specialActionsManager = gameManager.specialActionsManager;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('beforeTurn', () => {
    it('removes all "extra"-type actions, and any action carrying a hidden "banner-of-strength" subAction', () => {
      const character = buildCharacter();
      const plainExtra = new Action(ActionType.extra, '', ActionValueType.fixed);
      const attackWithBanner = new Action(ActionType.attack, 1, ActionValueType.fixed, [
        new Action(ActionType.custom, 'banner-of-strength', ActionValueType.fixed, [], false, true)
      ]);
      const plainAttack = new Action(ActionType.attack, 1);
      character.extraActions = [plainExtra, attackWithBanner, plainAttack];

      specialActionsManager.beforeTurn(character);

      expect(character.extraActions).toEqual([plainAttack]);
    });

    it('removes highlighted entityConditions that are in the "new" state', () => {
      const character = buildCharacter();
      const highlightedNew = Object.assign(new EntityCondition(ConditionName.heal, 1), {
        highlight: true,
        state: EntityConditionState.new
      });
      const highlightedApplied = Object.assign(new EntityCondition(ConditionName.heal, 1), {
        highlight: true,
        state: EntityConditionState.normal
      });
      const notHighlighted = Object.assign(new EntityCondition(ConditionName.poison, 1), {
        highlight: false,
        state: EntityConditionState.new
      });
      character.entityConditions = [highlightedNew, highlightedApplied, notHighlighted];

      specialActionsManager.beforeTurn(character);

      expect(character.entityConditions).toEqual([highlightedApplied, notHighlighted]);
    });
  });

  describe('triggerSlot', () => {
    it('advances the slot, removes the tag and grants xp when passing an "xp" slot (slots starting with "start")', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('test-action', 0, false, false, false, false, ['start', 'xp'] as any, 'roundStart');
      character.specialActions = [specialAction];
      character.tags = ['test-action'];
      character.experience = 0;

      specialActionsManager.triggerSlot(character, 'roundStart');

      expect(character.experience).toEqual(1);
      expect(character.tags).toEqual([]);
    });

    it('applies the -1 offset when the first slot does not start with "start"', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('test-action', 0, false, false, false, false, ['xp', 'end'] as any, 'roundStart');
      character.specialActions = [specialAction];
      character.tags = ['test-action'];
      character.experience = 0;

      specialActionsManager.triggerSlot(character, 'roundStart');

      expect(character.experience).toEqual(1);
      expect(character.tags).toEqual([]);
    });

    it('does nothing when the character does not currently carry the special action tag', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('test-action', 0, false, false, false, false, ['start', 'xp'] as any, 'roundStart');
      character.specialActions = [specialAction];
      character.tags = [];
      character.experience = 0;

      specialActionsManager.triggerSlot(character, 'roundStart');

      expect(character.experience).toEqual(0);
      expect(character.tags).toEqual([]);
    });

    it('does nothing for a non-matching slotTrigger', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('test-action', 0, false, false, false, false, ['start', 'xp'] as any, 'roundStart');
      character.specialActions = [specialAction];
      character.tags = ['test-action'];
      character.experience = 0;

      specialActionsManager.triggerSlot(character, 'roundEnd');

      expect(character.experience).toEqual(0);
      expect(character.tags).toEqual(['test-action']);
    });

    it('adds the tag back and reverses xp when revert is true', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('test-action', 0, false, false, false, false, ['xp', 'end'] as any, 'roundStart');
      character.specialActions = [specialAction];
      character.tags = ['test-action'];
      character.experience = 5;

      specialActionsManager.triggerSlot(character, 'roundStart', undefined, true);

      expect(character.experience).toEqual(4);
      expect(character.tags).toEqual(['test-action', 'test-action']);
    });
  });

  describe('addSummon', () => {
    it('boneshaper + solid-bones buffs a shambling-skeleton summon (health/movement/action)', () => {
      const character = buildCharacter('boneshaper');
      character.tags = ['solid-bones'];
      const summon = buildSummon('shambling-skeleton');
      summon.health = 5;
      summon.maxHealth = 5; // already at full health -> stays topped up after the +1 maxHealth bump

      specialActionsManager.addSummon(character, summon);

      expect(summon.maxHealth).toBe(6);
      expect(summon.health).toBe(6);
      expect(summon.movement).toBe(3);
      expect(summon.action).toEqual(new Action(ActionType.pierce, 1));
    });

    it('boneshaper without solid-bones/unholy-prowess leaves the summon untouched', () => {
      const character = buildCharacter('boneshaper');
      character.tags = [];
      const summon = buildSummon('shambling-skeleton');

      specialActionsManager.addSummon(character, summon);

      expect(summon.maxHealth).toBe(5);
      expect(summon.health).toBe(5);
    });

    it('astral + veil-of-protection adds +3 health/maxHealth to any summon', () => {
      const character = buildCharacter('astral');
      character.tags = ['veil-of-protection'];
      const summon = buildSummon('bear');

      specialActionsManager.addSummon(character, summon);

      expect(summon.health).toBe(8);
      expect(summon.maxHealth).toBe(8);
    });

    it('astral + imbue-with-life grants a permanent disarm when summoning animated-claymore', () => {
      const character = buildCharacter('astral');
      character.tags = ['imbue-with-life'];
      const summon = buildSummon('animated-claymore');

      specialActionsManager.addSummon(character, summon);

      const disarm = character.entityConditions.find((c) => c.name === ConditionName.disarm);
      expect(disarm?.permanent).toBe(true);
      expect(disarm?.expired).toBe(false);
    });

    it('is a no-op for an unrelated character', () => {
      const character = buildCharacter('generic-character');
      const summon = buildSummon('bear');

      expect(() => specialActionsManager.addSummon(character, summon)).not.toThrow();
      expect(summon.health).toBe(5);
    });
  });

  describe('removeSummon', () => {
    it('astral + imbue-with-life expires the disarm condition when removing animated-claymore', () => {
      const character = buildCharacter('astral');
      character.tags = ['imbue-with-life'];
      const disarm = Object.assign(new EntityCondition(ConditionName.disarm), { permanent: true });
      character.entityConditions = [disarm];
      const summon = buildSummon('animated-claymore');

      specialActionsManager.removeSummon(character, summon);

      expect(disarm.permanent).toBe(false);
      expect(disarm.state).toBe(EntityConditionState.expire);
    });

    it('is a no-op for an unrelated character', () => {
      const character = buildCharacter('generic-character');
      const summon = buildSummon('bear');
      expect(() => specialActionsManager.removeSummon(character, summon)).not.toThrow();
    });
  });

  describe('next', () => {
    it('blinkblade + time_tokens resets identity to 0 while primaryToken is 0', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 1;

      specialActionsManager.next(character);

      expect(character.identity).toBe(0);
    });

    it('blinkblade + roundAction-overdrive decrements the persistent shield each round', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['roundAction-overdrive'];
      character.extraActionsPersistent = [new Action(ActionType.shield, 2)];

      specialActionsManager.next(character);

      expect(character.extraActionsPersistent[0].value).toBe(1);
    });

    it('blinkblade + roundAction-overdrive removes the shield entirely once it reaches 0', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['roundAction-overdrive'];
      character.extraActionsPersistent = [new Action(ActionType.shield, 1)];

      specialActionsManager.next(character);

      expect(character.extraActionsPersistent.find((a) => a.type === ActionType.shield)).toBeUndefined();
    });

    it('skips the blinkblade branches while absent', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 1;
      character.absent = true;

      specialActionsManager.next(character);

      expect(character.identity).toBe(1);
    });
  });

  describe('draw', () => {
    it('blinkblade + time_tokens (identity 0): increments tokenValues[0] up to a cap of 2', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 0;
      character.tokenValues = [1];

      specialActionsManager.draw(character);

      expect(character.tokenValues[0]).toBe(2);
    });

    it('blinkblade + time_tokens (identity 1, tokens remaining): decrements tokenValues[0]', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 1;
      character.tokenValues = [2];

      specialActionsManager.draw(character);

      expect(character.tokenValues[0]).toBe(1);
    });

    it('blinkblade + time_tokens (identity 1, no tokens left): flips back to identity 0 with 1 token', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 1;
      character.tokenValues = [0];

      specialActionsManager.draw(character);

      expect(character.identity).toBe(0);
      expect(character.tokenValues[0]).toBe(1);
    });

    it('blinkblade + overdrive (identity 0, not yet applied this round): grants a persistent shield and tags roundAction-overdrive', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive'];
      character.identity = 0;
      character.extraActionsPersistent = [];

      specialActionsManager.draw(character);

      expect(character.tags).toContain('roundAction-overdrive');
      expect(character.extraActionsPersistent.find((a) => a.type === ActionType.shield)?.value).toBe(1);
    });

    it('blinkblade + overdrive: increments an existing persistent shield instead of duplicating it', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive'];
      character.identity = 0;
      character.extraActionsPersistent = [new Action(ActionType.shield, 1)];

      specialActionsManager.draw(character);

      expect(character.extraActionsPersistent.length).toBe(1);
      expect(character.extraActionsPersistent[0].value).toBe(2);
    });

    it('does not re-apply overdrive once roundAction-overdrive is already set', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive', 'roundAction-overdrive'];
      character.identity = 0;
      character.extraActionsPersistent = [];

      specialActionsManager.draw(character);

      expect(character.extraActionsPersistent.length).toBe(0);
    });
  });

  describe('isSlotTriggering', () => {
    it('is true by default for a living character', () => {
      const character = buildCharacter();
      const specialAction = new CharacterSpecialAction('any-action', 0, false, false, false, false, ['start'] as any, 'roundStart');
      expect(specialActionsManager.isSlotTriggering(character, specialAction)).toBe(true);
    });

    it('is false for a dead character', () => {
      const character = buildCharacter();
      character.health = 0;
      const specialAction = new CharacterSpecialAction('any-action', 0, false, false, false, false, ['start'] as any, 'roundStart');
      expect(specialActionsManager.isSlotTriggering(character, specialAction)).toBe(false);
    });

    it('blinkblade: "breaknet_speed" does not trigger while long resting', () => {
      const character = buildCharacter('blinkblade');
      character.longRest = true;
      const specialAction = new CharacterSpecialAction('breaknet_speed', 0, false, false, false, false, ['start'] as any, 'roundStart');
      expect(specialActionsManager.isSlotTriggering(character, specialAction)).toBe(false);
    });

    it('eclipse (gh): "nightfall" does not trigger while a dark element is strong', () => {
      const character = buildCharacter('eclipse', 'gh');
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.dark), { state: ElementState.strong })];
      const specialAction = new CharacterSpecialAction('nightfall', 0, false, false, false, false, ['start'] as any, 'roundStart');
      expect(specialActionsManager.isSlotTriggering(character, specialAction)).toBe(false);
    });

    it('eclipse (gh): "nightfall" triggers normally while dark is inert', () => {
      const character = buildCharacter('eclipse', 'gh');
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.dark), { state: ElementState.inert })];
      const specialAction = new CharacterSpecialAction('nightfall', 0, false, false, false, false, ['start'] as any, 'roundStart');
      expect(specialActionsManager.isSlotTriggering(character, specialAction)).toBe(true);
    });
  });

  describe('triggerSlotBefore', () => {
    it('shackles + delayed_malady: moves active negative conditions to "new" and immunizes them', () => {
      const character = buildCharacter('shackles');
      const poison = Object.assign(new EntityCondition(ConditionName.poison), {
        types: [ConditionType.negative]
      });
      character.entityConditions = [poison];
      const specialAction = new CharacterSpecialAction('delayed_malady', 0, false, false, false, false, ['start'] as any, 'roundStart');

      specialActionsManager.triggerSlotBefore(character, specialAction, false);

      expect(poison.state).toBe(EntityConditionState.new);
      expect(character.immunities).toContain(ConditionName.poison);
    });

    it('does nothing when revert is true', () => {
      const character = buildCharacter('shackles');
      const poison = Object.assign(new EntityCondition(ConditionName.poison), {
        types: [ConditionType.negative]
      });
      character.entityConditions = [poison];
      const specialAction = new CharacterSpecialAction('delayed_malady', 0, false, false, false, false, ['start'] as any, 'roundStart');

      specialActionsManager.triggerSlotBefore(character, specialAction, true);

      expect(character.immunities).toEqual([]);
    });
  });

  describe('triggerSlotAfter', () => {
    it('shackles + delayed_malady (tag no longer present): re-applies immunized conditions and clears immunities', () => {
      const character = buildCharacter('shackles');
      character.immunities = [ConditionName.poison];
      character.tags = [];
      const specialAction = new CharacterSpecialAction('delayed_malady', 0, false, false, false, false, ['start'] as any, 'roundStart');
      const addSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});

      specialActionsManager.triggerSlotAfter(character, specialAction, false);

      expect(addSpy).toHaveBeenCalledWith(character, character, new Condition(ConditionName.poison));
      expect(character.immunities).toEqual([]);
    });

    it('eclipse (gh) + nightfall: sets all dark elements to "new"', () => {
      const character = buildCharacter('eclipse', 'gh');
      const darkElement = Object.assign(new ElementModel(Element.dark), { state: ElementState.inert });
      gameManager.game.elementBoard = [darkElement];
      const specialAction = new CharacterSpecialAction('nightfall', 0, false, false, false, false, ['start'] as any, 'roundStart');

      specialActionsManager.triggerSlotAfter(character, specialAction, false);

      expect(darkElement.state).toBe(ElementState.new);
    });

    it('blinkblade + breaknet_speed: costs 2 health (or refunds 2 on revert)', () => {
      const character = buildCharacter('blinkblade');
      const specialAction = new CharacterSpecialAction('breaknet_speed', 0, false, false, false, false, ['start'] as any, 'roundStart');
      const changeHealthSpy = vi.spyOn(gameManager.entityManager, 'changeHealth').mockImplementation(() => {});

      specialActionsManager.triggerSlotAfter(character, specialAction, false);
      expect(changeHealthSpy).toHaveBeenCalledWith(character, character, -2, true);

      specialActionsManager.triggerSlotAfter(character, specialAction, true);
      expect(changeHealthSpy).toHaveBeenCalledWith(character, character, 2, true);
    });
  });

  describe('removeSpecialAction', () => {
    it('always strips the given tag from entity.tags', () => {
      const character = buildCharacter('generic-character');
      character.tags = ['keep-me', 'remove-me'];
      specialActionsManager.removeSpecialAction(character, character, 'remove-me');
      expect(character.tags).toEqual(['keep-me']);
    });

    it('lightning + careless-charge clears immunities', () => {
      const character = buildCharacter('lightning');
      character.immunities = [ConditionName.wound];
      character.tags = ['careless-charge'];
      specialActionsManager.removeSpecialAction(character, character, 'careless-charge');
      expect(character.immunities).toEqual([]);
    });

    it('shackles + delayed_malady restores immunized conditions and clears immunities/tag', () => {
      const character = buildCharacter('shackles');
      const poison = new EntityCondition(ConditionName.poison);
      character.entityConditions = [poison];
      character.immunities = [ConditionName.poison];
      character.tags = ['delayed_malady'];

      specialActionsManager.removeSpecialAction(character, character, 'delayed_malady');

      expect(poison.state).toBe(EntityConditionState.new);
      expect(poison.lastState).toBe(EntityConditionState.new);
      expect(character.immunities).toEqual([]);
      expect(character.tags).not.toContain('delayed_malady');
    });

    it('fist + one-with-the-mountain removes a permanent regenerate condition', () => {
      const character = buildCharacter('fist');
      const permanentRegen = Object.assign(new EntityCondition(ConditionName.regenerate), { permanent: true });
      const otherCondition = new EntityCondition(ConditionName.poison);
      character.entityConditions = [permanentRegen, otherCondition];
      character.tags = ['one-with-the-mountain'];

      specialActionsManager.removeSpecialAction(character, character, 'one-with-the-mountain');

      expect(character.entityConditions).toEqual([otherCondition]);
    });

    it('demolitionist + mech reduces maxHealth by 5 and runs checkHealth', () => {
      const character = buildCharacter('demolitionist');
      character.maxHealth = 15;
      character.tags = ['mech'];
      const checkHealthSpy = vi.spyOn(gameManager.entityManager, 'checkHealth').mockImplementation(() => {});

      specialActionsManager.removeSpecialAction(character, character, 'mech');

      expect(character.maxHealth).toBe(10);
      expect(checkHealthSpy).toHaveBeenCalledWith(character, character);
    });

    it('boneshaper + solid-bones debuffs a shambling-skeleton summon back down', () => {
      const character = buildCharacter('boneshaper');
      const summon = buildSummon('shambling-skeleton');
      summon.maxHealth = 6;
      summon.health = 6;
      summon.movement = 3;
      summon.action = new Action(ActionType.pierce, 1);
      character.summons = [summon];
      character.tags = ['solid-bones'];

      specialActionsManager.removeSpecialAction(character, character, 'solid-bones');

      expect(summon.maxHealth).toBe(5);
      expect(summon.health).toBe(5);
      expect(summon.movement).toBe(2);
      expect(summon.action).toBeUndefined();
    });

    it('astral + veil-of-protection removes +3 health from the character and its summons', () => {
      const character = buildCharacter('astral');
      character.health = 13;
      character.maxHealth = 13;
      const summon = buildSummon('bear');
      summon.health = 8;
      summon.maxHealth = 8;
      character.summons = [summon];
      character.tags = ['veil-of-protection'];

      specialActionsManager.removeSpecialAction(character, character, 'veil-of-protection');

      expect(character.health).toBe(10);
      expect(character.maxHealth).toBe(10);
      expect(summon.health).toBe(5);
      expect(summon.maxHealth).toBe(5);
    });
  });

  describe('addSpecialAction', () => {
    it('pushes the tag once per slot when the special action defines slots', () => {
      const character = buildCharacter('generic-character');
      const specialAction = new CharacterSpecialAction(
        'slotted-action',
        0,
        false,
        false,
        false,
        false,
        ['a', 'b', 'c'] as any,
        'roundStart'
      );
      character.specialActions = [specialAction];

      specialActionsManager.addSpecialAction(character, character, 'slotted-action');

      expect(character.tags.filter((t) => t === 'slotted-action').length).toBe(3);
    });

    it('pushes the tag exactly once when there is no matching (or slot-less) special action', () => {
      const character = buildCharacter('generic-character');
      character.specialActions = [];

      specialActionsManager.addSpecialAction(character, character, 'plain-tag');

      expect(character.tags).toEqual(['plain-tag']);
    });

    it('fist + one-with-the-mountain grants a permanent regenerate condition', () => {
      const character = buildCharacter('fist');
      character.specialActions = [];

      specialActionsManager.addSpecialAction(character, character, 'one-with-the-mountain');

      const regen = character.entityConditions.find((c) => c.name === ConditionName.regenerate);
      expect(regen?.permanent).toBe(true);
    });

    it('demolitionist + mech grants +5 maxHealth and a 10-point heal', () => {
      const character = buildCharacter('demolitionist');
      character.maxHealth = 10;
      character.health = 10;
      character.specialActions = [];
      const addSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});
      const applySpy = vi.spyOn(gameManager.entityManager, 'applyCondition').mockImplementation(() => {});

      specialActionsManager.addSpecialAction(character, character, 'mech');

      expect(character.maxHealth).toBe(15);
      expect(character.health).toBe(20);
      expect(addSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalled();
    });

    it('boneshaper + solid-bones buffs an existing shambling-skeleton summon', () => {
      const character = buildCharacter('boneshaper');
      character.specialActions = [];
      const summon = buildSummon('shambling-skeleton');
      character.summons = [summon];

      specialActionsManager.addSpecialAction(character, character, 'solid-bones');

      expect(summon.maxHealth).toBe(6);
      expect(summon.movement).toBe(3);
    });

    it('astral + veil-of-protection buffs the character and its summons', () => {
      const character = buildCharacter('astral');
      character.specialActions = [];
      character.health = 10;
      character.maxHealth = 10;
      const summon = buildSummon('bear');
      character.summons = [summon];

      specialActionsManager.addSpecialAction(character, character, 'veil-of-protection');

      expect(character.health).toBe(13);
      expect(character.maxHealth).toBe(13);
      expect(summon.health).toBe(8);
      expect(summon.maxHealth).toBe(8);
    });

    it("prism (autoapply_mode): transfers a damaged summon's conditions/damage to the character and tags it prism_mode", () => {
      const character = buildCharacter('prism');
      character.tags = ['autoapply_mode'];
      character.specialActions = [];
      const summon = buildSummon('prism-summon');
      summon.maxHealth = 10;
      summon.health = 6; // 4 damage taken
      summon.entityConditions = [new EntityCondition(ConditionName.poison)];
      character.summons = [summon];
      const changeHealthSpy = vi.spyOn(gameManager.entityManager, 'changeHealth').mockImplementation(() => {});
      vi.spyOn(gameManager.entityManager, 'isImmune').mockReturnValue(false);
      const addConditionSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});

      specialActionsManager.addSpecialAction(summon, character, 'prism_mode');

      expect(changeHealthSpy).toHaveBeenCalledWith(character, character, -4);
      expect(summon.health).toBe(summon.maxHealth);
      expect(addConditionSpy).toHaveBeenCalledWith(character, character, new Condition(ConditionName.poison));
      expect(summon.entityConditions).toEqual([]);
      expect(summon.tags).toContain('prism_mode');
    });

    it('without autoapply_mode, prism_mode is tagged but the damage/condition transfer is skipped', () => {
      const character = buildCharacter('prism');
      character.tags = [];
      character.specialActions = [];
      const summon = buildSummon('prism-summon');
      summon.maxHealth = 10;
      summon.health = 6; // damaged
      character.summons = [summon];
      const changeHealthSpy = vi.spyOn(gameManager.entityManager, 'changeHealth').mockImplementation(() => {});

      specialActionsManager.addSpecialAction(summon, character, 'prism_mode');

      // the generic tag-push at the top of addSpecialAction always applies, regardless of autoapply_mode
      expect(summon.tags).toContain('prism_mode');
      // but the autoapply-gated damage transfer does not run
      expect(changeHealthSpy).not.toHaveBeenCalled();
      expect(summon.health).toBe(6);
    });
  });
});

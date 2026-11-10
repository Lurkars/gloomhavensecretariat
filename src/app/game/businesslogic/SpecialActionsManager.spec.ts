import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterSpecialAction, CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

// This spec covers the generic, name-independent mechanics (beforeTurn's extraActions/
// entityConditions cleanup, and the triggerSlot() slot-advancing state machine used by every
// character with slot-based special actions), plus the per-character-name effects and queries
// for every character with special actions. The manager is small enough to cover fairly
// exhaustively rather than sampling a slice.

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
    it('blinkblade + time_tokens resets identity to 1 while primaryToken is 0', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 0;

      specialActionsManager.next(character);

      expect(character.identity).toBe(1);
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
      character.identity = 0;
      character.absent = true;

      specialActionsManager.next(character);

      expect(character.identity).toBe(0);
    });

    it('coral + roundAction-perk9: removes the round-scoped Shield 1 gained from the long rest perk', () => {
      const character = buildCharacter('coral', 'fh');
      character.tags = ['perk9', 'roundAction-perk9'];
      character.extraActions = [new Action(ActionType.shield, 1)];

      specialActionsManager.next(character);

      expect(character.extraActions.find((a) => a.type === ActionType.shield)).toBeUndefined();
    });
  });

  describe('draw', () => {
    it('blinkblade + time_tokens (identity 1): increments tokenValues[0] up to a cap of 2', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 1;
      character.tokenValues = [1];

      specialActionsManager.draw(character);

      expect(character.tokenValues[0]).toBe(2);
    });

    it('blinkblade + time_tokens (identity 0, tokens remaining): decrements tokenValues[0]', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 0;
      character.tokenValues = [2];

      specialActionsManager.draw(character);

      expect(character.tokenValues[0]).toBe(1);
    });

    it('blinkblade + time_tokens (identity 0, no tokens left): flips back to identity 1 with 1 token', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      character.identity = 0;
      character.tokenValues = [0];

      specialActionsManager.draw(character);

      expect(character.identity).toBe(1);
      expect(character.tokenValues[0]).toBe(1);
    });

    it('blinkblade + overdrive (identity 1, not yet applied this round): grants a persistent shield and tags roundAction-overdrive', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive'];
      character.identity = 1;
      character.extraActionsPersistent = [];

      specialActionsManager.draw(character);

      expect(character.tags).toContain('roundAction-overdrive');
      expect(character.extraActionsPersistent.find((a) => a.type === ActionType.shield)?.value).toBe(1);
    });

    it('blinkblade + overdrive: increments an existing persistent shield instead of duplicating it', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive'];
      character.identity = 1;
      character.extraActionsPersistent = [new Action(ActionType.shield, 1)];

      specialActionsManager.draw(character);

      expect(character.extraActionsPersistent.length).toBe(1);
      expect(character.extraActionsPersistent[0].value).toBe(2);
    });

    it('does not re-apply overdrive once roundAction-overdrive is already set', () => {
      const character = buildCharacter('blinkblade');
      character.tags = ['overdrive', 'roundAction-overdrive'];
      character.identity = 1;
      character.extraActionsPersistent = [];

      specialActionsManager.draw(character);

      expect(character.extraActionsPersistent.length).toBe(0);
    });

    it('coral + perk9 while long resting: grants a round-scoped Shield 1 and tags roundAction-perk9', () => {
      const character = buildCharacter('coral', 'fh');
      character.tags = ['perk9'];
      character.longRest = true;
      character.extraActions = [];

      specialActionsManager.draw(character);

      expect(character.tags).toContain('roundAction-perk9');
      expect(character.extraActions.find((a) => a.type === ActionType.shield)?.value).toBe(1);
    });

    it('coral + perk9 without a declared long rest: grants nothing', () => {
      const character = buildCharacter('coral', 'fh');
      character.tags = ['perk9'];
      character.longRest = false;
      character.extraActions = [];

      specialActionsManager.draw(character);

      expect(character.tags).not.toContain('roundAction-perk9');
      expect(character.extraActions.length).toBe(0);
    });

    it('coral + perk9: does not stack the shield again once roundAction-perk9 is set', () => {
      const character = buildCharacter('coral', 'fh');
      character.tags = ['perk9', 'roundAction-perk9'];
      character.longRest = true;
      character.extraActions = [new Action(ActionType.shield, 1)];

      specialActionsManager.draw(character);

      expect(character.extraActions.length).toBe(1);
      expect(character.extraActions[0].value).toBe(1);
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

      expect(addSpy).toHaveBeenCalledWith(character, character, new Condition(ConditionName.poison), false, true);
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

  describe('addSpecialAction (immunities)', () => {
    it('lightning careless-charge grants immunity to all negative conditions and curse', () => {
      const character = buildCharacter('lightning');
      character.specialActions = [];
      character.immunities = [];

      specialActionsManager.addSpecialAction(character, character, 'careless-charge');

      expect(character.immunities).toContain(ConditionName.curse);
      gameManager
        .conditionsForTypes('character', 'negative')
        .forEach((condition) => expect(character.immunities).toContain(condition.name));
    });

    it('shackles delayed_malady adds active negative non-amDeck conditions as immunities', () => {
      const character = buildCharacter('shackles', 'fh');
      character.specialActions = [];
      character.immunities = [];
      const poison = new EntityCondition(ConditionName.poison);
      const expiredWound = Object.assign(new EntityCondition(ConditionName.wound), { expired: true });
      const curse = new EntityCondition(ConditionName.curse);
      const strengthen = new EntityCondition(ConditionName.strengthen);
      character.entityConditions = [poison, expiredWound, curse, strengthen];

      specialActionsManager.addSpecialAction(character, character, 'delayed_malady');

      expect(character.immunities).toEqual([ConditionName.poison]);
    });
  });

  describe('queries', () => {
    it('keepInitiativeOnLongRest only for prism with long_rest', () => {
      const prism = buildCharacter('prism', 'fh');
      expect(specialActionsManager.keepInitiativeOnLongRest(prism)).toBe(false);
      prism.tags = ['long_rest'];
      expect(specialActionsManager.keepInitiativeOnLongRest(prism)).toBe(true);
      const other = buildCharacter('other');
      other.tags = ['long_rest'];
      expect(specialActionsManager.keepInitiativeOnLongRest(other)).toBe(false);
    });

    it('isIdentityLocked for blinkblade with time_tokens during next state', () => {
      const character = buildCharacter('blinkblade', 'fh');
      character.tags = ['time_tokens'];
      character.primaryToken = 0;
      const originalState = gameManager.game.state;
      try {
        gameManager.game.state = GameState.next;
        expect(specialActionsManager.isIdentityLocked(character)).toBe(true);
        gameManager.game.state = GameState.draw;
        character.identity = 0;
        character.tokenValues = [0];
        expect(specialActionsManager.isIdentityLocked(character)).toBe(false);
        character.identity = 1;
        expect(specialActionsManager.isIdentityLocked(character)).toBe(true);
        character.tags = [];
        expect(specialActionsManager.isIdentityLocked(character)).toBe(false);
      } finally {
        gameManager.game.state = originalState;
      }
    });

    it('maxTokenValue caps blinkblade time tokens and shards resonance tokens at 5', () => {
      const character = buildCharacter('blinkblade', 'fh');
      expect(specialActionsManager.maxTokenValue(character, 0)).toBeUndefined();
      character.tags = ['time_tokens'];
      expect(specialActionsManager.maxTokenValue(character, 0)).toBe(5);
      expect(specialActionsManager.maxTokenValue(character, 1)).toBeUndefined();
      const shards = buildCharacter('shards', 'fh');
      expect(specialActionsManager.maxTokenValue(shards, 0)).toBeUndefined();
      shards.tags = ['resonance_tokens'];
      expect(specialActionsManager.maxTokenValue(shards, 0)).toBe(5);
    });

    it('maxHealthBonus for demolitionist mech and astral veil-of-protection', () => {
      const demolitionist = buildCharacter('demolitionist', 'jotl');
      expect(specialActionsManager.maxHealthBonus(demolitionist)).toBe(0);
      demolitionist.tags = ['mech'];
      expect(specialActionsManager.maxHealthBonus(demolitionist)).toBe(5);
      const astral = buildCharacter('astral', 'fh');
      astral.tags = ['veil-of-protection'];
      expect(specialActionsManager.maxHealthBonus(astral)).toBe(3);
    });

    it('maxHealth is at least 26 for lightning with unbridled-power, also for pending tags', () => {
      const character = buildCharacter('lightning');
      character.maxHealth = 10;
      expect(specialActionsManager.maxHealth(character)).toBe(10);
      expect(specialActionsManager.maxHealth(character, ['unbridled-power'])).toBe(26);
      character.tags = ['unbridled-power'];
      expect(specialActionsManager.maxHealth(character)).toBe(26);
      character.maxHealth = 30;
      expect(specialActionsManager.maxHealth(character)).toBe(30);
    });

    it('isImmune for prism summons in prism_mode', () => {
      const character = buildCharacter('prism', 'fh');
      const summon = buildSummon('prism-summon');
      expect(specialActionsManager.isImmune(summon, character)).toBe(false);
      summon.tags = ['prism_mode'];
      expect(specialActionsManager.isImmune(summon, character)).toBe(true);
      expect(specialActionsManager.isImmune(character, character)).toBe(false);
    });

    it('isConditionSuspended for negative non-amDeck conditions on shackles with delayed_malady', () => {
      const character = buildCharacter('shackles', 'fh');
      character.tags = ['delayed_malady'];
      expect(specialActionsManager.isConditionSuspended(character, new Condition(ConditionName.poison))).toBe(true);
      expect(specialActionsManager.isConditionSuspended(character, new Condition(ConditionName.curse))).toBe(false);
      expect(specialActionsManager.isConditionSuspended(character, new Condition(ConditionName.strengthen))).toBe(false);
      character.tags = [];
      expect(specialActionsManager.isConditionSuspended(character, new Condition(ConditionName.poison))).toBe(false);
    });

    it('woundBonus applies to enemy monsters while a character has call-of-the-grave', () => {
      const monster = new Monster(Object.assign(new MonsterData(), { name: 'test-monster', edition: 'gh' }));
      const character = buildCharacter('envx');
      character.tags = ['call-of-the-grave'];
      vi.spyOn(gameManager.characterManager, 'getActiveCharacters').mockReturnValue([character]);
      expect(specialActionsManager.woundBonus(monster)).toBe(1);
      monster.isAlly = true;
      expect(specialActionsManager.woundBonus(monster)).toBe(0);
      monster.isAlly = false;
      expect(specialActionsManager.woundBonus(character)).toBe(0);
      character.tags = [];
      expect(specialActionsManager.woundBonus(monster)).toBe(0);
    });

    it('preventElementWaning for fire/ice/air/earth while triangles has element_waning', () => {
      const character = buildCharacter('triangles', 'gh2e');
      character.tags = ['element_waning'];
      const originalFigures = gameManager.game.figures;
      try {
        gameManager.game.figures = [character];
        expect(specialActionsManager.preventElementWaning(Element.fire)).toBe(true);
        expect(specialActionsManager.preventElementWaning(Element.dark)).toBe(false);
        character.tags = [];
        expect(specialActionsManager.preventElementWaning(Element.fire)).toBe(false);
      } finally {
        gameManager.game.figures = originalFigures;
      }
    });

    it('longRestHealBonus for lightning perks', () => {
      const gh2e = buildCharacter('lightning', 'gh2e');
      expect(specialActionsManager.longRestHealBonus(gh2e)).toBe(0);
      gh2e.tags = ['long_rest_heal'];
      expect(specialActionsManager.longRestHealBonus(gh2e)).toBe(1);
      const fhCrossover = buildCharacter('lightning', 'fh-crossover');
      fhCrossover.tags = ['rapid_recovery'];
      expect(specialActionsManager.longRestHealBonus(fhCrossover)).toBe(1);
    });
  });

  describe('hooks', () => {
    it('afterTurn only triggers turnEnd slots, not turnStart', () => {
      const character = buildCharacter();
      const triggerSlotSpy = vi.spyOn(specialActionsManager, 'triggerSlot');
      specialActionsManager.afterTurn(character);
      expect(triggerSlotSpy).toHaveBeenCalledTimes(1);
      expect(triggerSlotSpy).toHaveBeenCalledWith(character, 'turnEnd');
    });

    it('beforeTurn / turn adjust music-note experience with song_active', () => {
      const character = buildCharacter('music-note');
      character.tags = ['song_active'];
      character.experience = 3;
      specialActionsManager.beforeTurn(character);
      expect(character.experience).toBe(2);
      specialActionsManager.turn(character, character);
      expect(character.experience).toBe(3);
    });

    it('turn applies prism repair_mode and spider_mode once per round', () => {
      const character = buildCharacter('prism', 'fh');
      character.tags = ['repair_mode', 'spider_mode'];
      const addConditionSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});
      vi.spyOn(gameManager.entityManager, 'applyCondition').mockImplementation(() => {});
      character.health = 5;

      specialActionsManager.turn(character, character);
      specialActionsManager.turn(character, character);

      expect(character.health).toBe(7);
      expect(character.tags).toContain('roundAction-repair_mode');
      expect(character.tags).toContain('roundAction-spider_mode');
      expect(addConditionSpy).toHaveBeenCalledWith(character, character, new Condition(ConditionName.ward));
      expect(addConditionSpy).toHaveBeenCalledTimes(2);
    });

    it('turn: lightning blood-pact deals 1 damage, gh2e not below 1 health', () => {
      const changeHealthSpy = vi.spyOn(gameManager.entityManager, 'changeHealth').mockImplementation(() => {});
      const gh = buildCharacter('lightning', 'gh');
      gh.tags = ['blood-pact'];
      gh.health = 1;
      specialActionsManager.turn(gh, gh);
      expect(changeHealthSpy).toHaveBeenCalledWith(gh, gh, -1, true);

      changeHealthSpy.mockClear();
      const gh2e = buildCharacter('lightning', 'gh2e');
      gh2e.tags = ['blood-pact'];
      gh2e.health = 1;
      specialActionsManager.turn(gh2e, gh2e);
      expect(changeHealthSpy).not.toHaveBeenCalled();
    });

    it('turn: rpg berserker strength-in-agony deals 1 damage only above 1 health', () => {
      const changeHealthSpy = vi.spyOn(gameManager.entityManager, 'changeHealth').mockImplementation(() => {});
      const berserker = buildCharacter('berserker', 'rpg');
      berserker.health = 2;
      specialActionsManager.turn(berserker, berserker);
      expect(changeHealthSpy).not.toHaveBeenCalled();

      berserker.tags = ['strength-in-agony'];
      specialActionsManager.turn(berserker, berserker);
      expect(changeHealthSpy).toHaveBeenCalledWith(berserker, berserker, -1, true);

      changeHealthSpy.mockClear();
      berserker.health = 1;
      specialActionsManager.turn(berserker, berserker);
      expect(changeHealthSpy).not.toHaveBeenCalled();
    });

    it('turn adds three-spears supply token with perk only while long resting', () => {
      const character = buildCharacter('three-spears', 'gh2e');
      character.tags = ['supply_tokens_perk'];
      character.primaryToken = 0;
      character.tokenValues = [1];
      character.progress.perks[10] = 2;
      const applyLongRest = settingsManager.settings.applyLongRest;
      try {
        settingsManager.settings.applyLongRest = true;
        specialActionsManager.turn(character, character);
        expect(character.tokenValues[0]).toBe(1);
        character.longRest = true;
        specialActionsManager.turn(character, character);
        expect(character.tokenValues[0]).toBe(2);
      } finally {
        settingsManager.settings.applyLongRest = applyLongRest;
      }
    });

    it('afterTurn: shards resonance token up to 5, skull spirits summons lose health', () => {
      const shards = buildCharacter('shards', 'fh');
      shards.tags = ['resonance_tokens'];
      shards.tokenValues = [4];
      specialActionsManager.afterTurn(shards);
      specialActionsManager.afterTurn(shards);
      expect(shards.tokenValues[0]).toBe(5);

      const skull = buildCharacter('skull', 'cs');
      skull.tags = ['spirits'];
      const spirit = buildSummon('spirit');
      spirit.afterTurn = true;
      const regular = buildSummon('regular');
      skull.summons = [spirit, regular];
      vi.spyOn(gameManager.entityManager, 'checkHealth').mockImplementation(() => {});
      specialActionsManager.afterTurn(skull);
      expect(spirit.health).toBe(4);
      expect(regular.health).toBe(5);
    });

    it('afterTurn: fist gift-of-the-mountain heals 2 when damaged', () => {
      const character = buildCharacter('fist', 'fh');
      character.tags = ['gift-of-the-mountain'];
      character.health = 5;
      vi.spyOn(gameManager.entityManager, 'applyCondition').mockImplementation(() => {});
      specialActionsManager.afterTurn(character);
      expect(character.health).toBe(7);
      expect(character.entityConditions.find((condition) => condition.name === ConditionName.heal)?.value).toBe(2);
    });

    it('startScenario initializes tokens', () => {
      const kelp = buildCharacter('kelp', 'fh');
      kelp.tags = ['trophy_tokens'];
      kelp.tokenValues = [];
      specialActionsManager.startScenario(kelp);
      expect(kelp.tokenValues[0]).toBe(2);

      const shards = buildCharacter('shards', 'fh');
      shards.tags = ['resonance_tokens', 'extra_resonance_tokens'];
      shards.tokenValues = [];
      const addConditionSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});
      specialActionsManager.startScenario(shards);
      expect(shards.tokenValues[0]).toBe(3);
      expect(addConditionSpy).toHaveBeenCalledWith(shards, shards, new Condition(ConditionName.brittle));
    });

    it('revealMonsterEntities muddles revealed enemies while snowflake has muddle-monster', () => {
      const character = buildCharacter('snowflake', 'fh');
      character.tags = ['muddle-monster'];
      const monster = new Monster(Object.assign(new MonsterData(), { name: 'test-monster', edition: 'gh' }));
      const revealed = new MonsterEntity(1, MonsterType.normal, monster);
      const hidden = new MonsterEntity(2, MonsterType.normal, monster);
      monster.entities = [revealed, hidden];
      vi.spyOn(gameManager.entityManager, 'isImmune').mockReturnValue(false);
      const addConditionSpy = vi.spyOn(gameManager.entityManager, 'addCondition').mockImplementation(() => {});
      const originalFigures = gameManager.game.figures;
      try {
        gameManager.game.figures = [character, monster];
        specialActionsManager.revealMonsterEntities([revealed]);
      } finally {
        gameManager.game.figures = originalFigures;
      }
      expect(addConditionSpy).toHaveBeenCalledTimes(1);
      expect(addConditionSpy).toHaveBeenCalledWith(revealed, monster, new Condition(ConditionName.muddle));
    });
  });
});

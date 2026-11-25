import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { Element } from 'src/app/game/model/data/Element';
import { Enhancement } from 'src/app/game/model/data/Enhancement';

// EnhancementsManager also covers update() (which derives fh/temporary/enhancerLevel from
// settingsManager/game state) and calculateCosts() (the full composite pipeline). This spec
// sticks to the pure cost-table lookups (calculateBaseCosts, levelCosts, enhancementCosts)
// and isMultiTarget, driving fh/temporary/enhancerLevel directly instead of through update().

describe('EnhancementsManager', () => {
  const enhancementsManager = gameManager.enhancementsManager;

  beforeEach(() => {
    enhancementsManager.fh = false;
    enhancementsManager.temporary = false;
    enhancementsManager.enhancerLevel = 0;
  });

  describe('calculateBaseCosts', () => {
    it('uses GH costs by default', () => {
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.move, 1))).toEqual(30);
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.attack, 1))).toEqual(50);
    });

    it('discounts move/attack for temporary GH enhancements', () => {
      enhancementsManager.temporary = true;
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.move, 1))).toEqual(20);
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.attack, 1))).toEqual(35);
    });

    it('uses FH costs when fh is set, ignoring the temporary discount', () => {
      enhancementsManager.fh = true;
      enhancementsManager.temporary = true;
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.move, 1))).toEqual(30);
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.target, 1))).toEqual(75);
    });

    it('charges more for the wild element than other elements', () => {
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.element, Element.fire))).toEqual(100);
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.element, Element.wild))).toEqual(150);
    });

    it('looks up condition costs by condition name', () => {
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.condition, ConditionName.poison))).toEqual(75);
      enhancementsManager.fh = true;
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.condition, ConditionName.disarm))).toEqual(0);
    });

    it('uses summon-specific costs when special is "summon"', () => {
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.move, 1), 'summon')).toEqual(100);
      enhancementsManager.fh = true;
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.move, 1), 'summon')).toEqual(60);
    });

    it('divides area costs by the number of target hexes', () => {
      const oneHex = new Action(ActionType.area, '(0,0,target)');
      expect(enhancementsManager.calculateBaseCosts(oneHex)).toEqual(200);

      const twoHexes = new Action(ActionType.area, '(0,0,target)|(1,0,target)');
      expect(enhancementsManager.calculateBaseCosts(twoHexes)).toEqual(100);
    });

    it('is 0 for action types without a cost table entry', () => {
      expect(enhancementsManager.calculateBaseCosts(new Action(ActionType.custom, 'anything'))).toEqual(0);
    });
  });

  describe('levelCosts', () => {
    it('is 0 at level 1', () => {
      expect(enhancementsManager.levelCosts(1)).toEqual(0);
    });

    it('clamps below level 1 up to 1', () => {
      expect(enhancementsManager.levelCosts(0)).toEqual(0);
      expect(enhancementsManager.levelCosts(-5)).toEqual(0);
    });

    it('clamps above level 9 down to 9', () => {
      expect(enhancementsManager.levelCosts(9)).toEqual(enhancementsManager.levelCosts(20));
    });

    it('charges 25/level normally, 10/level for temporary GH enhancements, 15/level with a level-3 enhancer', () => {
      expect(enhancementsManager.levelCosts(3)).toEqual(50);

      enhancementsManager.temporary = true;
      expect(enhancementsManager.levelCosts(3)).toEqual(20);

      enhancementsManager.temporary = false;
      enhancementsManager.fh = true;
      enhancementsManager.enhancerLevel = 3;
      expect(enhancementsManager.levelCosts(3)).toEqual(30);
    });
  });

  describe('enhancementCosts', () => {
    it('clamps negative enhancement counts to 0', () => {
      expect(enhancementsManager.enhancementCosts(-1)).toEqual(0);
    });

    it('charges 75/enhancement normally, 20/enhancement for temporary GH enhancements, 50/enhancement with a level-4 enhancer', () => {
      expect(enhancementsManager.enhancementCosts(2)).toEqual(150);

      enhancementsManager.temporary = true;
      expect(enhancementsManager.enhancementCosts(2)).toEqual(40);

      enhancementsManager.temporary = false;
      enhancementsManager.fh = true;
      enhancementsManager.enhancerLevel = 4;
      expect(enhancementsManager.enhancementCosts(2)).toEqual(100);
    });
  });

  describe('isMultiTarget', () => {
    it('is false for area/target/element actions under fh rules', () => {
      enhancementsManager.fh = true;
      const action = new Action(ActionType.target, 1);
      expect(enhancementsManager.isMultiTarget(action, action)).toBe(false);
    });

    it('is false for area actions regardless of fh rules', () => {
      const action = new Action(ActionType.area, 'target');
      expect(enhancementsManager.isMultiTarget(action, action)).toBe(false);
    });

    it('defers to actionsManager.hasMultiTarget otherwise', () => {
      const rootAction = Object.assign(new Action(ActionType.attack, 1), { multiTarget: true });
      const action = new Action(ActionType.attack, 1);
      expect(enhancementsManager.isMultiTarget(action, rootAction)).toBe(true);
    });
  });

  describe('character enhancements', () => {
    function buildCharacter(): Character {
      return new Character(Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
    }

    afterEach(() => vi.restoreAllMocks());

    it('counts enhancements per card half and enhanced cards without inherited ones', () => {
      const character = buildCharacter();
      character.progress.enhancements = [
        new Enhancement(1, '0', 0, 'plus1'),
        new Enhancement(1, 'bottom-0', 0, 'plus1'),
        new Enhancement(1, '1', 0, 'plus1'),
        new Enhancement(2, '0', 0, 'plus1'),
        new Enhancement(3, '0', 0, 'plus1', true)
      ];
      expect(enhancementsManager.cardEnhancements(character, 1, '0')).toBe(2);
      expect(enhancementsManager.cardEnhancements(character, 1, 'bottom-1')).toBe(1);
      expect(enhancementsManager.enhancedCards(character)).toBe(2);
      expect(enhancementsManager.enhancedCards(character, 1)).toBe(1);
    });

    it('limits enhanced cards by prosperity outside of fh', () => {
      vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(1);
      const character = buildCharacter();
      character.progress.gold = 50;
      character.progress.enhancements = [new Enhancement(1, '0', 0, 'plus1')];
      expect(enhancementsManager.canEnhance(character, 1, 50)).toBe(true);
      expect(enhancementsManager.canEnhance(character, 1, 60)).toBe(false);
      expect(enhancementsManager.canEnhance(character, 2, 50)).toBe(false);
      enhancementsManager.fh = true;
      expect(enhancementsManager.canEnhance(character, 2, 50)).toBe(true);
    });

    it('refuses an occupied enhancement slot, force skips gold and prosperity only', () => {
      vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(1);
      const character = buildCharacter();
      character.progress.gold = 0;
      character.progress.enhancements = [new Enhancement(1, '0', 0, 'plus1')];
      expect(enhancementsManager.canAddEnhancement(character, 1, '0', 0, 0, true)).toBe(false);
      expect(enhancementsManager.addEnhancement(character, 1, '0', 0, 'plus1', 0, true)).toBe(false);
      expect(enhancementsManager.canAddEnhancement(character, 2, '0', 0, 50)).toBe(false);
      expect(enhancementsManager.canAddEnhancement(character, 2, '0', 0, 0, true)).toBe(true);
      expect(enhancementsManager.addEnhancement(character, 2, '0', 0, 'plus1', 0, true)).toBe(true);
      expect(character.progress.enhancements.length).toBe(2);
    });

    it('adds an enhancement paying its costs and removes it again', () => {
      const character = buildCharacter();
      character.progress.gold = 100;
      expect(enhancementsManager.addEnhancement(character, 1, '0', 0, 'plus1', 75)).toBe(true);
      expect(character.progress.gold).toBe(25);
      expect(character.progress.enhancements).toEqual([new Enhancement(1, '0', 0, 'plus1')]);
      enhancementsManager.removeEnhancement(character, character.progress.enhancements[0]);
      expect(character.progress.enhancements).toEqual([]);
    });
  });

  describe('enhancementMapping', () => {
    it('collects an actionId per enhancementType-carrying action, recursing into subActions', () => {
      const nested = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });
      const withEnhancement = Object.assign(new Action(ActionType.attack, 2), { enhancementTypes: ['attack'] });
      const withSubActions = Object.assign(new Action(ActionType.move, 2), { subActions: [nested] });

      const mapping = enhancementsManager.enhancementMapping([withEnhancement, withSubActions], '');

      expect(mapping).toEqual(['0', '1-0']);
    });

    it('skips the wip placeholder action entirely', () => {
      const wip = new Action(ActionType.custom, '%character.abilities.wip%');
      const real = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });

      const mapping = enhancementsManager.enhancementMapping([wip, real], '');

      expect(mapping).toEqual(['1']);
    });

    it('prefixes actionIds with the parentIndex (e.g. for bottom actions)', () => {
      const action = Object.assign(new Action(ActionType.attack, 1), { enhancementTypes: ['attack'] });
      expect(enhancementsManager.enhancementMapping([action], 'bottom')).toEqual(['bottom-0']);
    });
  });
});

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PERSONAL_QUEST_SCENARIO_CONCLUDED } from 'src/app/game/businesslogic/PersonalQuestManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuest, PersonalQuestAutotrackType, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

function buildCharacter(name: string, edition: string = 'gh', overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name, edition, stats: [new CharacterStat(1, 10)], ...overrides });
  return new Character(data, 1);
}

describe('PersonalQuestManager', () => {
  const personalQuestManager = gameManager.personalQuestManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.retirements = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
  });

  describe('personalQuestByCard', () => {
    it('finds a personal quest by cardId within the resolved edition', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '101', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [pq] })];
      settingsManager.settings.editions = ['gh'];

      expect(personalQuestManager.personalQuestByCard('gh', '101')).toBe(pq);
    });

    it('also matches by altId', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '101', altId: '201', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [pq] })];
      settingsManager.settings.editions = ['gh'];

      expect(personalQuestManager.personalQuestByCard('gh', '201')).toBe(pq);
    });

    it('returns undefined when no personal quest matches', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [] })];
      settingsManager.settings.editions = ['gh'];

      expect(personalQuestManager.personalQuestByCard('gh', '999')).toBeUndefined();
    });
  });

  describe('personal quest pool (locked / picked / fulfilled)', () => {
    function pq(cardId: string, overrides: Partial<PersonalQuest> = {}): PersonalQuest {
      return Object.assign(new PersonalQuest(), { cardId, edition: 'gh2e', ...overrides });
    }

    beforeEach(() => {
      settingsManager.settings.editions = ['gh2e'];
      gameManager.game.unlockedPersonalQuests = [];
    });

    it('treats a card as unlocked unless it is the unlockPQ target of another card', () => {
      const source = pq('01', { unlockPQ: '02' });
      const target = pq('02');
      gameManager.editionData = [Object.assign(new EditionData('gh2e', [], [], [], [], [], []), { personalQuests: [source, target] })];

      expect(personalQuestManager.personalQuestUnlocked(source)).toBe(true);
      expect(personalQuestManager.personalQuestUnlocked(target)).toBe(false);
    });

    it('unlockPersonalQuest unlocks the chain target, resolving by cardId or altId', () => {
      const source = pq('01', { unlockPQ: '02' });
      const target = pq('02');
      gameManager.editionData = [Object.assign(new EditionData('gh2e', [], [], [], [], [], []), { personalQuests: [source, target] })];

      expect(personalQuestManager.personalQuestUnlocked(target)).toBe(false);

      personalQuestManager.unlockPersonalQuest('gh2e', source.unlockPQ);

      expect(gameManager.game.unlockedPersonalQuests).toContain('gh2e:02');
      expect(personalQuestManager.personalQuestUnlocked(target)).toBe(true);
    });

    it('personalQuestPicked is true while a figure currently carries the card', () => {
      const card = pq('03');
      const character = buildCharacter('brute', 'gh2e');
      character.progress.personalQuest = '03';
      gameManager.game.figures = [character];

      expect(personalQuestManager.personalQuestPicked(card)).toBe(true);
      expect(personalQuestManager.personalQuestPicked(pq('04'))).toBe(false);
    });

    it('personalQuestFulfilled is true once a retired character is recorded with that PQ', () => {
      const card = pq('04');

      expect(personalQuestManager.personalQuestFulfilled(card)).toBe(false);

      const retiredCharacter = buildCharacter('spellweaver', 'gh2e');
      retiredCharacter.progress.personalQuest = '04';
      gameManager.game.party.retirements = [retiredCharacter.toModel()];

      expect(personalQuestManager.personalQuestFulfilled(card)).toBe(true);
    });

    it('availablePersonalQuests excludes locked, picked and fulfilled cards', () => {
      const locked = pq('02');
      const unlocker = pq('01', { unlockPQ: '02' });
      const picked = pq('03');
      const fulfilled = pq('04');
      gameManager.editionData = [
        Object.assign(new EditionData('gh2e', [], [], [], [], [], []), {
          personalQuests: [locked, unlocker, picked, fulfilled]
        })
      ];

      const character = buildCharacter('brute', 'gh2e');
      character.progress.personalQuest = '03';
      gameManager.game.figures = [character];

      const retiredCharacter = buildCharacter('spellweaver', 'gh2e');
      retiredCharacter.progress.personalQuest = '04';
      gameManager.game.party.retirements = [retiredCharacter.toModel()];

      expect(personalQuestManager.availablePersonalQuests('gh2e')).toEqual([unlocker]);
    });

    it('treats a card with unlockBuilding (by building id) as locked until that building is built, level 0 included', () => {
      const locked = Object.assign(new PersonalQuest(), { cardId: '542', altId: '18', edition: 'fh', unlockBuilding: '81' });
      const campaign = Object.assign(new CampaignData(), {
        buildings: [Object.assign(new BuildingData(), { id: '81', name: 'hall-of-revelry' })]
      });
      gameManager.editionData = [Object.assign(new EditionData('fh', [], [], [], [], [], []), { campaign })];
      settingsManager.settings.editions = ['fh'];
      gameManager.game.party.buildings = [];

      expect(personalQuestManager.personalQuestUnlocked(locked)).toBe(false);

      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 0)];

      expect(personalQuestManager.personalQuestUnlocked(locked)).toBe(true);
    });

    it('a manual unlock overrides an unmet unlockBuilding gate, and lockPersonalQuest undoes it', () => {
      const locked = Object.assign(new PersonalQuest(), { cardId: '542', altId: '18', edition: 'fh', unlockBuilding: '81' });
      const campaign = Object.assign(new CampaignData(), {
        buildings: [Object.assign(new BuildingData(), { id: '81', name: 'hall-of-revelry' })]
      });
      gameManager.editionData = [Object.assign(new EditionData('fh', [], [], [], [], [], []), { campaign, personalQuests: [locked] })];
      settingsManager.settings.editions = ['fh'];
      gameManager.game.party.buildings = [];

      expect(personalQuestManager.personalQuestUnlocked(locked)).toBe(false);

      personalQuestManager.unlockPersonalQuest('fh', '18');

      expect(personalQuestManager.personalQuestUnlocked(locked)).toBe(true);

      personalQuestManager.lockPersonalQuest('fh', '18');

      expect(personalQuestManager.personalQuestUnlocked(locked)).toBe(false);
    });
  });

  describe('personalQuestAutotrackSupported', () => {
    function pq(requirements: Partial<PersonalQuestRequirement>[]): PersonalQuest {
      return Object.assign(new PersonalQuest(), {
        cardId: '01',
        edition: 'gh2e',
        requirements: requirements.map((requirement) => Object.assign(new PersonalQuestRequirement(), requirement))
      });
    }

    it('is false for a requirement without an autotrack tag', () => {
      const personalQuest = pq([{ counter: 5 }]);

      expect(personalQuestManager.personalQuestAutotrackSupported(personalQuest, 0)).toBe(false);
    });

    it('is true for a recognized, event-hookable autotrack kind', () => {
      const personalQuest = pq([{ counter: 1, autotrack: 'scenario:63|64' as PersonalQuestAutotrackType }]);

      expect(personalQuestManager.personalQuestAutotrackSupported(personalQuest, 0)).toBe(true);
    });

    it('is false for a tag with no discrete event hook (e.g. a cross-quest reference like "QA2")', () => {
      const personalQuest = pq([{ counter: 1, autotrack: 'QA2' as PersonalQuestAutotrackType }]);

      expect(personalQuestManager.personalQuestAutotrackSupported(personalQuest, 0)).toBe(false);
    });
  });

  describe('trackPersonalQuestProgress (increment-on-event, never overwrite)', () => {
    function pq(requirements: Partial<PersonalQuestRequirement>[], overrides: Partial<PersonalQuest> = {}): PersonalQuest {
      return Object.assign(new PersonalQuest(), {
        cardId: '01',
        edition: 'gh2e',
        requirements: requirements.map((requirement) => Object.assign(new PersonalQuestRequirement(), requirement)),
        ...overrides
      });
    }

    function withQuest(character: Character, personalQuest: PersonalQuest) {
      character.progress.personalQuest = personalQuest.cardId;
      character.progress.personalQuestAutotrack = true;
      gameManager.editionData = [
        Object.assign(new EditionData(character.edition, [], [], [], [], [], []), {
          personalQuests: [personalQuest]
        })
      ];
    }

    beforeEach(() => {
      settingsManager.settings.editions = ['gh2e'];
    });

    it('does nothing when the character has no personal quest assigned', () => {
      const character = buildCharacter('brute', 'gh2e');
      character.progress.personalQuestAutotrack = true;

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress).toEqual([]);
    });

    it('does nothing when autotrack is disabled for the character', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 10, autotrack: PersonalQuestAutotrackType.loot }]);
      withQuest(character, personalQuest);
      character.progress.personalQuestAutotrack = false;

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);
    });

    it('increments matching requirement progress by exactly one per event', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 10, autotrack: PersonalQuestAutotrackType.loot }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress[0]).toEqual(2);
    });

    it('reverts progress with a negative value, also from a completed counter, without going below 0', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: PersonalQuestAutotrackType.loot }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);
      expect(character.progress.personalQuestProgress[0]).toEqual(1);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot, undefined, -1);
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot, undefined, -1);
      expect(character.progress.personalQuestProgress[0]).toEqual(0);
    });

    it('never overwrites or lowers previously-tracked progress, even if held resources later drop', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 10, autotrack: PersonalQuestAutotrackType.loot }]);
      withQuest(character, personalQuest);
      character.progress.personalQuestProgress = [6];
      character.progress.loot = { [LootType.lumber]: 0 };

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress[0]).toEqual(7);
    });

    it('stops incrementing once the requirement counter is reached', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 2, autotrack: PersonalQuestAutotrackType.loot }]);
      withQuest(character, personalQuest);
      character.progress.personalQuestProgress = [2];

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress[0]).toEqual(2);
    });

    it('only matches a "scenario:ID" requirement when the fired event lists that id', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: 'scenario:63|64' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '65');
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '64');
      expect(character.progress.personalQuestProgress[0]).toEqual(1);
    });

    it('"scenario:from|to" counts every scenario of the chain within the range, without ever fulfilling it by count', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: 'scenario:71|77' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '70');
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '78');
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);

      ['71', '72', '73', '74A', '76', '77'].forEach((index) =>
        personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, index)
      );
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(6);
      expect(personalQuestManager.personalQuestRequirementFulfilled(character, personalQuest, 0)).toBe(false);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '77', -1);
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(5);
    });

    it('keeps counting a concluded scenario chain (rewards may conclude first) and keeps the conclusion when reverting', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: 'scenario:65|68' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);
      character.progress.personalQuestProgress = [2 | PERSONAL_QUEST_SCENARIO_CONCLUDED];

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '68');
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(3);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '68', -1);
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, '67', -1);
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(1);
      expect(personalQuestManager.personalQuestRequirementFulfilled(character, personalQuest, 0)).toBe(true);
    });

    it('"scenario:ID" requires an exact match and is concluded by completing that scenario', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: 'scenario:AA1' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, 'AA2');
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, 'AA1');
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(1);
      expect(personalQuestManager.personalQuestRequirementFulfilled(character, personalQuest, 0)).toBe(true);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenario, 'AA1', -1);
      expect(character.progress.personalQuestProgress[0]).toEqual(0);
    });

    it('leaves an unrelated requirement kind untouched', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 1, autotrack: 'item:148' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);

      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);
    });

    it('sets the matching bit for a "differentHerbs" checkbox requirement, without clearing other bits', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([
        { counter: 6, checkbox: ['a', 'b', 'c', 'd', 'e', 'f'], autotrack: PersonalQuestAutotrackType.differentHerbs }
      ]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.differentHerbs, LootType.arrowvine);
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.differentHerbs, LootType.axenut);
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.differentHerbs, LootType.arrowvine);

      expect(character.progress.personalQuestProgress[0]).toEqual(0b11);
      expect(personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toEqual(2);
    });

    it('increments by the given "value" instead of a flat 1, clamped to the counter', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 100, autotrack: PersonalQuestAutotrackType.gold }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.gold, undefined, 40);
      expect(character.progress.personalQuestProgress[0]).toEqual(40);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.gold, undefined, 90);
      expect(character.progress.personalQuestProgress[0]).toEqual(100);
    });

    it('"scenarioXP" only bumps (by 1) when the measured XP meets the tag-encoded threshold', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 5, autotrack: 'scenarioXP:12' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenarioXP, '11');
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.scenarioXP, '12');
      expect(character.progress.personalQuestProgress[0]).toEqual(1);
    });

    it('"sideScenarios" only bumps when the finished scenario index falls in the tag-encoded range', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 5, autotrack: 'sideScenarios:52-95' as PersonalQuestAutotrackType }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.sideScenarios, '51');
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.sideScenarios, '52');
      expect(character.progress.personalQuestProgress[0]).toEqual(1);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.sideScenarios, '95');
      expect(character.progress.personalQuestProgress[0]).toEqual(2);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.sideScenarios, '96');
      expect(character.progress.personalQuestProgress[0]).toEqual(2);
    });

    it('"bossScenarios" bumps unconditionally (by 1) when called with no arg, matching a bare tag', () => {
      const character = buildCharacter('brute', 'gh2e');
      const personalQuest = pq([{ counter: 5, autotrack: PersonalQuestAutotrackType.bossScenarios }]);
      withQuest(character, personalQuest);

      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.bossScenarios);

      expect(character.progress.personalQuestProgress[0]).toEqual(1);
    });
  });

  describe('unlockPersonalQuestScenarios', () => {
    const initial = Object.assign(new ScenarioData(), { edition: 'fh', index: '1', initial: true });
    const chainStart = Object.assign(new ScenarioData(), { edition: 'fh', index: '71' });
    const gatedStart = Object.assign(new ScenarioData(), { edition: 'fh', index: '69' });

    function withQuest(requirements: Partial<PersonalQuestRequirement>[]): Character {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '509',
        edition: 'fh',
        requirements: requirements.map((requirement) => Object.assign(new PersonalQuestRequirement(), requirement))
      });
      gameManager.editionData = [
        Object.assign(new EditionData('fh', [], [], [], [initial, chainStart, gatedStart], [], []), { personalQuests: [personalQuest] })
      ];
      const character = buildCharacter('blinkblade', 'fh');
      character.progress.personalQuest = '509';
      character.progress.personalQuestProgress = [];
      return character;
    }

    beforeEach(() => {
      settingsManager.settings.editions = ['fh'];
      settingsManager.settings.automaticUnlocking = true;
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.scenarios = [];
      gameManager.game.party.conclusions = [];
      gameManager.game.party.manualScenarios = [];
    });

    afterEach(() => {
      settingsManager.settings.automaticUnlocking = true;
      gameManager.game.party.campaignMode = false;
      gameManager.game.party.manualScenarios = [];
    });

    it('unlocks the first scenario of a "scenario" requirement without requires right away, only once', () => {
      const character = withQuest([{ counter: 6, autotrack: 'scenario:71|77' as PersonalQuestAutotrackType }]);

      expect(personalQuestManager.unlockPersonalQuestScenarios(character)).toBe(true);
      expect(gameManager.game.party.manualScenarios).toEqual([new GameScenarioModel('71', 'fh', undefined)]);
      expect(gameManager.scenarioManager.scenarioData('fh')).toContain(chainStart);

      expect(personalQuestManager.unlockPersonalQuestScenarios(character)).toBe(false);
      expect(gameManager.game.party.manualScenarios.length).toBe(1);
    });

    it('unlocks the scenario of a requirement with requires once the required requirements are fulfilled', () => {
      const character = withQuest([
        { counter: 8, autotrack: 'looted:lumber' as PersonalQuestAutotrackType },
        { counter: 2, autotrack: 'scenario:69|70' as PersonalQuestAutotrackType, requires: [1] }
      ]);
      character.progress.personalQuestAutotrack = true;

      expect(personalQuestManager.unlockPersonalQuestScenarios(character)).toBe(false);

      character.progress.personalQuestProgress = [7];
      personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.looted, 'lumber');

      expect(character.progress.personalQuestProgress[0]).toEqual(8);
      expect(gameManager.game.party.manualScenarios).toEqual([new GameScenarioModel('69', 'fh', undefined)]);
    });

    it('does nothing outside campaign mode, without automatic unlocking or for unknown scenarios', () => {
      const character = withQuest([{ counter: 1, autotrack: 'scenario:999' as PersonalQuestAutotrackType }]);
      expect(personalQuestManager.unlockPersonalQuestScenarios(character)).toBe(false);

      const chainCharacter = withQuest([{ counter: 6, autotrack: 'scenario:71|77' as PersonalQuestAutotrackType }]);
      settingsManager.settings.automaticUnlocking = false;
      expect(personalQuestManager.unlockPersonalQuestScenarios(chainCharacter)).toBe(false);

      settingsManager.settings.automaticUnlocking = true;
      gameManager.game.party.campaignMode = false;
      expect(personalQuestManager.unlockPersonalQuestScenarios(chainCharacter)).toBe(false);
      expect(gameManager.game.party.manualScenarios.length).toBe(0);
    });
  });

  describe('trackMoneyTokens', () => {
    function withMoneyQuest(): Character {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '02',
        edition: 'gh2e',
        requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 60, autotrack: 'looted:money' })]
      });
      gameManager.editionData = [Object.assign(new EditionData('gh2e', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['gh2e'];
      const character = buildCharacter('brute', 'gh2e');
      character.progress.personalQuest = '02';
      character.progress.personalQuestAutotrack = true;
      return character;
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('tracks money token changes as looted money, including reverts', () => {
      const character = withMoneyQuest();
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);

      personalQuestManager.trackMoneyTokens(character, 3);
      expect(character.progress.personalQuestProgress[0]).toEqual(3);

      personalQuestManager.trackMoneyTokens(character, -1);
      expect(character.progress.personalQuestProgress[0]).toEqual(2);
    });

    it('ignores money changes under FH rules', () => {
      const character = withMoneyQuest();
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);

      personalQuestManager.trackMoneyTokens(character, 3);
      expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);
    });
  });

  describe('personalQuestCompleted', () => {
    it('is true once every requirement is fulfilled, including concluded scenario chains', () => {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '582',
        edition: 'fh',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 8, autotrack: 'looted:lumber' }),
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'scenario:69|70', requires: [1] })
        ]
      });
      gameManager.editionData = [Object.assign(new EditionData('fh', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['fh'];
      const character = buildCharacter('blinkblade', 'fh');
      expect(personalQuestManager.personalQuestCompleted(character)).toBe(false);

      character.progress.personalQuest = '582';
      character.progress.personalQuestProgress = [8, 2];
      expect(personalQuestManager.personalQuestCompleted(character)).toBe(false);

      character.progress.personalQuestProgress = [8, 2 | PERSONAL_QUEST_SCENARIO_CONCLUDED];
      expect(personalQuestManager.personalQuestCompleted(character)).toBe(true);
    });
  });

  describe('completePersonalQuestScenarios', () => {
    it('concludes the matching scenario requirement of characters holding the quest with autotrack enabled', () => {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '509',
        altId: '12',
        edition: 'fh',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'scenario:71|77' }),
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'scenario:80' })
        ]
      });
      gameManager.editionData = [Object.assign(new EditionData('fh', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['fh'];

      const tracked = buildCharacter('blinkblade', 'fh');
      tracked.progress.personalQuest = '509';
      tracked.progress.personalQuestAutotrack = true;
      tracked.progress.personalQuestProgress = [5];
      const untracked = buildCharacter('drifter', 'fh');
      untracked.progress.personalQuest = '509';
      untracked.progress.personalQuestProgress = [5];
      gameManager.game.figures = [tracked, untracked];

      personalQuestManager.completePersonalQuestScenarios('12', '76');

      expect(personalQuestManager.personalQuestRequirementFulfilled(tracked, personalQuest, 0)).toBe(true);
      expect(personalQuestManager.personalQuestRequirementCount(tracked, personalQuest, 0)).toEqual(5);
      expect(personalQuestManager.personalQuestRequirementFulfilled(tracked, personalQuest, 1)).toBe(false);
      expect(personalQuestManager.personalQuestRequirementFulfilled(untracked, personalQuest, 0)).toBe(false);
    });
  });

  describe('migrateScenarioChainProgress', () => {
    function withQuest(): Character {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '510',
        edition: 'gh',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 3 }),
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'scenario:52|54', requires: [1] })
        ]
      });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['gh'];
      const character = buildCharacter('brute', 'gh');
      character.progress.personalQuest = '510';
      return character;
    }

    it('concludes scenario requirements completed with the former counter semantics, once', () => {
      const character = withQuest();
      character.progress.personalQuestProgress = [3, 1];

      personalQuestManager.migrateScenarioChainProgress(character);
      expect(character.progress.personalQuestProgress).toEqual([3, 1 | PERSONAL_QUEST_SCENARIO_CONCLUDED]);

      character.progress.personalQuestProgress[1] = 2;
      personalQuestManager.migrateScenarioChainProgress(character);
      expect(character.progress.personalQuestProgress[1]).toEqual(2);
    });

    it('does not migrate characters whose quest was assigned with chain semantics', () => {
      const character = withQuest();
      vi.spyOn(personalQuestManager, 'unlockPersonalQuestScenarios').mockReturnValue(false);
      personalQuestManager.personalQuestAssigned(character);
      character.progress.personalQuestProgress = [3, 2];

      personalQuestManager.migrateScenarioChainProgress(character);
      expect(character.progress.personalQuestProgress).toEqual([3, 2]);
      vi.restoreAllMocks();
    });
  });

  describe('trackPersonalQuestProgressForParty', () => {
    it('bumps the matching requirement for every character figure', () => {
      const a = buildCharacter('brute', 'gh2e');
      const b = buildCharacter('tinkerer', 'gh2e');
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '01',
        edition: 'gh2e',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 5, autotrack: PersonalQuestAutotrackType.scenariosCompleted })
        ]
      });
      [a, b].forEach((character) => {
        character.progress.personalQuest = '01';
        character.progress.personalQuestAutotrack = true;
      });
      gameManager.game.figures = [a, b];
      gameManager.editionData = [Object.assign(new EditionData('gh2e', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['gh2e'];

      personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.scenariosCompleted);

      expect(a.progress.personalQuestProgress[0]).toEqual(1);
      expect(b.progress.personalQuestProgress[0]).toEqual(1);
    });
  });
});

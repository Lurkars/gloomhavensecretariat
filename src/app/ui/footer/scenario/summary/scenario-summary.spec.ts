import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';

// ScenarioSummaryComponent's constructor is unusually heavy: it reads DIALOG_DATA, may set
// gameManager.game.finish, and calls updateState()/updateFinish()/loadFinish(). Passing
// conclusionOnly=true short-circuits nearly all of that (it forces success=true, clears
// game.finish, and skips the reward-computation branch in updateState() since campaignMode is
// off by default) — that's the cheapest way to get a constructible instance for unit testing.
// Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges(), call methods directly. This spec covers the pure reward/collective-
// resource calculations (hasRewards, hasBonus, addWeek, availableCollectiveGold/Resource,
// lootValue, unlocked, itemDistributed) rather than the dialog-opening/mutation flows.

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(scenario: Scenario): ScenarioSummaryComponent {
  TestBed.configureTestingModule({
    imports: [ScenarioSummaryComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: { scenario, success: true, conclusionOnly: true, rewardsOnly: false } },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(ScenarioSummaryComponent);
  return fixture.componentInstance;
}

describe('ScenarioSummaryComponent', () => {
  let scenario: Scenario;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.finish = undefined;
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.conclusions = [];
    gameManager.game.lootDeck.cards = [];
    gameManager.game.unlockedCharacters = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
    scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
  });

  it('constructs successfully from a conclusionOnly DIALOG_DATA payload', () => {
    const component = createComponent(scenario);
    expect(component).toBeTruthy();
    expect(component.success).toBe(true);
    expect(component.conclusion).toBe(scenario);
  });

  describe('hasRewards', () => {
    it('is false with no rewards set', () => {
      const component = createComponent(scenario);
      component.rewards = undefined;
      expect(component.hasRewards()).toBe(false);
    });

    it('is true once any reward field is set (e.g. gold)', () => {
      const component = createComponent(scenario);
      component.rewards = Object.assign(new ScenarioRewards(), { gold: 5 });
      expect(component.hasRewards()).toBe(true);
    });

    it('is false when rewards exist but every tracked field is empty', () => {
      const component = createComponent(scenario);
      component.rewards = new ScenarioRewards();
      expect(component.hasRewards()).toBe(false);
    });
  });

  describe('hasBonus', () => {
    it('is false outside campaign mode', () => {
      const component = createComponent(scenario);
      gameManager.game.party.campaignMode = false;
      component.forceCampaign = false;
      expect(component.hasBonus()).toBe(false);
    });

    it('is false for conclusionOnly summaries even in campaign mode', () => {
      const component = createComponent(scenario);
      gameManager.game.party.campaignMode = true;
      component.conclusionOnly = true;
      expect(component.hasBonus()).toBe(false);
    });

    it('is true for a solo-ineligible campaign scenario with fewer than 4 characters under fh rules and no ignored bonus', () => {
      const component = createComponent(scenario);
      gameManager.game.edition = 'fh';
      settingsManager.settings.editions = ['fh'];
      gameManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
      gameManager.game.party.campaignMode = true;
      component.conclusionOnly = false;
      component.scenario.solo = undefined;
      component.numberChallenges = 0;
      component.rewards = undefined;
      gameManager.game.figures = [buildCharacter()];
      expect(component.hasBonus()).toBe(true);
    });
  });

  describe('addWeek', () => {
    it('is false when automaticPassTime is disabled', () => {
      const component = createComponent(scenario);
      settingsManager.settings.automaticPassTime = false;
      expect(component.addWeek()).toBe(false);
    });
  });

  describe('availableCollectiveGold', () => {
    it('is 0 with no collectiveGold reward configured', () => {
      const component = createComponent(scenario);
      component.rewards = undefined;
      component.collectiveGold = [];
      expect(component.availableCollectiveGold()).toEqual(0);
    });

    it('is the reward pool minus already-distributed gold', () => {
      const component = createComponent(scenario);
      component.rewards = Object.assign(new ScenarioRewards(), { collectiveGold: 10 });
      component.collectiveGold = [3, 2];
      expect(component.availableCollectiveGold()).toEqual(5);
    });
  });

  describe('availableCollectiveResource', () => {
    it('is 0 with no matching collective resource reward', () => {
      const component = createComponent(scenario);
      component.rewards = undefined;
      expect(component.availableCollectiveResource(LootType.hide)).toEqual(0);
    });

    it('is the reward pool minus already-distributed amounts', () => {
      const component = createComponent(scenario);
      component.rewards = Object.assign(new ScenarioRewards(), { collectiveResources: [{ type: LootType.hide, value: 5 }] });
      component.collectiveResources = [{ hide: 2 }, { hide: 1 }];
      expect(component.availableCollectiveResource(LootType.hide)).toEqual(2);
    });
  });

  describe('lootValue', () => {
    it('sums the value of looted cards of the given type', () => {
      const component = createComponent(scenario);
      const character = buildCharacter();
      character.lootCards = [0, 1];
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 4, 3, 2), new Loot(LootType.hide, 2, 1, 1, 1)];
      gameManager.game.figures = [character];
      expect(component.lootValue(character, LootType.hide)).toEqual(1);
    });

    it('is 0 when the character has no matching looted cards', () => {
      const component = createComponent(scenario);
      const character = buildCharacter();
      character.lootCards = [];
      expect(component.lootValue(character, LootType.money)).toEqual(0);
    });
  });

  describe('unlocked', () => {
    it('checks membership in gameManager.game.unlockedCharacters as "edition:name"', () => {
      const component = createComponent(scenario);
      gameManager.game.unlockedCharacters = ['gh:brute'];
      expect(component.unlocked('brute')).toBe(true);
      expect(component.unlocked('spellweaver')).toBe(false);
    });
  });

  describe('itemDistributed', () => {
    it('is true once the character already owns the reward item', () => {
      const component = createComponent(scenario);
      const character = buildCharacter();
      character.progress.items = [{ name: '5', edition: 'gh' } as any];
      component.characters = [character];
      component.rewardItems = [Object.assign(new ItemData(), { id: 5, edition: 'gh', count: 1 })];
      component.rewardItemCount = [1];
      component.items = [[]];
      expect(component.itemDistributed(0, 0)).toBe(true);
    });
  });
});

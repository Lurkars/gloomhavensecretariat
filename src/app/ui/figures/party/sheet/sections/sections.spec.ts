import { DialogRef } from '@angular/cdk/dialog';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GameCharacterModel } from 'src/app/game/model/Character';
import { EditionData, ReputationSection } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { PartyCampaignRetirementsComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-retirements';
import {
  campaignScenarioData,
  maxScenario,
  PartyCampaignScenariosComponent
} from 'src/app/ui/figures/party/sheet/sections/campaign-scenarios';
import { PartyCampaignTreasuresComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-treasures';
import { PartySheetFhCalendarComponent } from 'src/app/ui/figures/party/sheet/sections/fh-calendar';
import { PartySheetFhCampaignStickersComponent } from 'src/app/ui/figures/party/sheet/sections/fh-campaign-stickers';
import { moraleDefense } from 'src/app/ui/figures/party/sheet/sections/fh-morale';
import { PartySheetFhSoldiersComponent } from 'src/app/ui/figures/party/sheet/sections/fh-soldiers';
import { PartySheetGh2eFactionsComponent } from 'src/app/ui/figures/party/sheet/sections/gh2e-factions';
import { PartySheetNotesComponent } from 'src/app/ui/figures/party/sheet/sections/notes';
import { PartySheetReputationComponent } from 'src/app/ui/figures/party/sheet/sections/reputation';

function create<T>(type: Type<T>): T {
  return TestBed.createComponent(type).componentInstance;
}

describe('Party sheet sections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: DialogRef, useValue: { closed: { subscribe: () => {} }, close: () => {} } }]
    }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.party.treasures = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.party.casualScenarios = [];
    gameManager.game.party.manualScenarios = [];
    gameManager.game.party.randomItemLooted = [];
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.buildings = [];
    gameManager.game.party.soldiers = 0;
    gameManager.game.party.weekSections = {};
    gameManager.game.party.campaignStickers = [];
    gameManager.game.party.factionReputation = {};
    gameManager.editionData = [];
  });

  it('every section renders without throwing', () => {
    [
      PartySheetNotesComponent,
      PartySheetReputationComponent,
      PartySheetFhCalendarComponent,
      PartySheetFhSoldiersComponent,
      PartyCampaignScenariosComponent,
      PartyCampaignTreasuresComponent,
      PartyCampaignRetirementsComponent
    ].forEach((type) => {
      const fixture = TestBed.createComponent(type as Type<unknown>);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('maxScenario', () => {
    it('returns the length of the longest scenario index', () => {
      const scenarios = [
        Object.assign(new ScenarioData(), { index: '1' }),
        Object.assign(new ScenarioData(), { index: '123' }),
        Object.assign(new ScenarioData(), { index: '12' })
      ];
      expect(maxScenario(scenarios)).toEqual(3);
    });
  });

  describe('treasures / hasTreasure', () => {
    it('filters by the selected treasure edition', () => {
      gameManager.game.party.treasures = [new Identifier('1', 'gh'), new Identifier('2', 'fh')];
      const component = create(PartyCampaignTreasuresComponent);
      component.treasureEdition = 'gh';
      expect(component.treasures().map((t) => t.name)).toEqual(['1']);
    });

    it('sorts numerically by treasure name when no edition filter is set', () => {
      gameManager.game.party.treasures = [new Identifier('10', 'gh'), new Identifier('2', 'gh')];
      const component = create(PartyCampaignTreasuresComponent);
      component.treasureEdition = '';
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { url: 'gh' })];
      expect(component.treasures().map((t) => t.name)).toEqual(['2', '10']);
    });

    it('hasTreasure checks name+edition membership', () => {
      gameManager.game.party.treasures = [new Identifier('5', 'gh')];
      const component = create(PartyCampaignTreasuresComponent);
      expect(component.hasTreasure('5', 'gh')).toBe(true);
      expect(component.hasTreasure('5', 'fh')).toBe(false);
    });
  });

  describe('sectionsForWeek', () => {
    it('reads party.weekSections at week+1', () => {
      const component = create(PartySheetFhCalendarComponent);
      gameManager.game.party.weekSections = { 2: ['a', 'b'] };
      expect(component.sectionsForWeek(1)).toEqual(['a', 'b']);
      expect(component.sectionsForWeek(5)).toEqual([]);
    });
  });

  describe('isConclusion', () => {
    it('is false for an empty section', () => {
      expect(create(PartySheetNotesComponent).isConclusion('')).toBe(false);
    });

    it('matches a conclusion by index and (default) the current game edition', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('12', 'gh')];
      const component = create(PartySheetNotesComponent);
      expect(component.isConclusion('12')).toBe(true);
      expect(component.isConclusion('99')).toBe(false);
    });

    it('matches against an explicit edition override', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('12', 'fh')];
      const component = create(PartySheetNotesComponent);
      expect(component.isConclusion('12', 'fh')).toBe(true);
      expect(component.isConclusion('12', 'gh')).toBe(false);
    });
  });

  describe('characterPerks', () => {
    it('sums the perk-progress counts', () => {
      const characterModel = { progress: { perks: [1, 0, 2] } } as unknown as GameCharacterModel;
      expect(create(PartyCampaignRetirementsComponent).characterPerks(characterModel)).toEqual(3);
    });

    it('is 0 when there is no perk progress', () => {
      const characterModel = { progress: { perks: [] } } as unknown as GameCharacterModel;
      expect(create(PartyCampaignRetirementsComponent).characterPerks(characterModel)).toEqual(0);
    });
  });

  describe('additionalReputation', () => {
    it('a "special" reputation section checks whether any faction exceeds the threshold', () => {
      const component = create(PartySheetGh2eFactionsComponent);
      gameManager.game.party.factionReputation = { alpha: 5 };
      const section: ReputationSection = { faction: 'special', value: 3, section: 'x' };
      expect(component.additionalReputation(section)).toBe(true);

      gameManager.game.party.factionReputation = { alpha: 2 };
      expect(component.additionalReputation(section)).toBe(false);
    });

    it('a normal faction section requires reputation >= value and all required scenarios completed', () => {
      const component = create(PartySheetGh2eFactionsComponent);
      gameManager.game.party.factionReputation = { alpha: 10 };
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const section: ReputationSection = { faction: 'alpha', value: 5, section: 'x', requires: ['1'] };
      expect(component.additionalReputation(section)).toBe(true);
    });

    it('is false when the required scenario has not been completed', () => {
      const component = create(PartySheetGh2eFactionsComponent);
      gameManager.game.party.factionReputation = { alpha: 10 };
      const section: ReputationSection = { faction: 'alpha', value: 5, section: 'x', requires: ['1'] };
      expect(component.additionalReputation(section)).toBe(false);
    });
  });

  describe('soldierAvailable', () => {
    it('is true outside campaign mode', () => {
      expect(create(PartySheetFhSoldiersComponent).soldierAvailable()).toBe(true);
    });

    it('is false in campaign mode with no barracks built', () => {
      gameManager.game.party.campaignMode = true;
      expect(create(PartySheetFhSoldiersComponent).soldierAvailable()).toBe(false);
    });
  });

  describe('campaignStickerImage', () => {
    it('is undefined when the campaign has no matching sticker', () => {
      expect(create(PartySheetFhCampaignStickersComponent).campaignStickerImage('unknown-sticker', 0)).toBeUndefined();
    });
  });

  describe('moraleDefense', () => {
    it('maps morale to the defense bonus', () => {
      expect(moraleDefense(0)).toEqual(-10);
      expect(moraleDefense(6)).toEqual(0);
      expect(moraleDefense(12)).toEqual(10);
      expect(moraleDefense(20)).toEqual(15);
    });
  });

  describe('reputation price modifier', () => {
    it('follows the reputation table', () => {
      const component = create(PartySheetReputationComponent);
      gameManager.game.party.reputation = 7;
      component.update();
      expect(component.priceModifier).toEqual(-2);
      gameManager.game.party.reputation = -7;
      component.update();
      expect(component.priceModifier).toEqual(2);
    });
  });

  describe('countFinished / hasRandomItemLooted / isManual', () => {
    it('reads values derived from the party scenario lists', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh'), new GameScenarioModel('1', 'gh')];
      gameManager.game.party.randomItemLooted = [new GameScenarioModel('1', 'gh')];
      gameManager.game.party.manualScenarios = [new GameScenarioModel('1', 'gh')];
      const component = create(PartyCampaignScenariosComponent);
      component.data = campaignScenarioData(gameManager.game.party, 'gh');
      const scenario = Object.assign(new ScenarioData(), { edition: 'gh', index: '1', group: undefined });
      expect(component.countFinished(scenario)).toEqual(2);
      expect(component.hasRandomItemLooted(scenario)).toBe(true);
      expect(component.isManual(scenario)).toBe(true);
    });

    it('defaults to 0/false when nothing is recorded', () => {
      const component = create(PartyCampaignScenariosComponent);
      const scenario = Object.assign(new ScenarioData(), { edition: 'gh', index: '2', group: undefined });
      expect(component.countFinished(scenario)).toEqual(0);
      expect(component.hasRandomItemLooted(scenario)).toBe(false);
      expect(component.isManual(scenario)).toBe(false);
    });
  });
});

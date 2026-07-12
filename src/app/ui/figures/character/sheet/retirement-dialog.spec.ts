import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { CharacterRetirementDialog } from 'src/app/ui/figures/character/sheet/retirement-dialog';

// CharacterRetirementDialog's constructor is driven entirely by DIALOG_DATA=character plus
// gameManager edition/party state (no helper-class fan-out like EntitiesMenuDialogComponent), so
// it's constructible with a minimal editionData/character setup. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges(), and call methods directly.
// apply()'s tail call to openConclusions() is a no-op (and never touches the Dialog stub) as long as
// no conclusion/personalQuestConclusion was resolved, which holds for the plain-character scenarios
// below.

function buildCharacter(overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }, overrides);
  return new Character(data, 1);
}

function createComponent(character: Character): CharacterRetirementDialog {
  TestBed.configureTestingModule({
    imports: [CharacterRetirementDialog],
    providers: [
      { provide: DIALOG_DATA, useValue: character },
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(CharacterRetirementDialog);
  return fixture.componentInstance;
}

describe('CharacterRetirementDialog', () => {
  beforeEach(() => {
    gameManager.game.edition = 'gh';
    gameManager.game.figures = [];
    gameManager.game.party.retirements = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.manualScenarios = [];
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.inspiration = 0;
    gameManager.game.party.prosperity = 0;
    gameManager.game.unlockedCharacters = [];
    gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []))];
    settingsManager.settings.editions = ['gh'];
    settingsManager.settings.automaticUnlocking = false;
    settingsManager.settings.unlockEnvelopeBuildings = false;
    settingsManager.settings.animations = false;
  });

  it('constructs from a plain (no personal quest) character', () => {
    const component = createComponent(buildCharacter());
    expect(component).toBeTruthy();
    expect(component.personalQuest).toBeUndefined();
    expect(component.alreadyRetired).toBe(false);
  });

  it('renders the template without throwing', () => {
    TestBed.configureTestingModule({
      imports: [CharacterRetirementDialog],
      providers: [
        { provide: DIALOG_DATA, useValue: buildCharacter() },
        { provide: DialogRef, useValue: { close: () => {} } },
        { provide: Dialog, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(CharacterRetirementDialog);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('hasResources', () => {
    it('is false when the character has no resource loot', () => {
      const character = buildCharacter();
      character.progress.loot = {};
      const component = createComponent(character);
      expect(component.hasResources).toBe(false);
    });

    it('is true once a resource-type loot value is set', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.hide]: 3 };
      const component = createComponent(character);
      expect(component.hasResources).toBe(true);
    });
  });

  describe('alreadyRetired', () => {
    it('is true once the character is already in party.retirements', () => {
      const character = buildCharacter();
      gameManager.game.party.retirements = [{ edition: 'gh', name: 'brute' } as any];
      const component = createComponent(character);
      expect(component.alreadyRetired).toBe(true);
    });
  });

  describe('conclusion detection', () => {
    it('finds a matching conclusion section for the character retirement', () => {
      const conclusionSection = Object.assign(new ScenarioData(), {
        edition: 'gh',
        index: 'c1',
        conclusion: true,
        retirement: 'brute'
      });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [conclusionSection], []))];
      const character = buildCharacter();
      const component = createComponent(character);
      expect(component.conclusion).toBe(conclusionSection);
    });
  });

  describe('apply', () => {
    it('marks the character retired and moves it into party.retirements', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.apply();
      expect(character.progress.retired).toBe(true);
      expect(gameManager.game.party.retirements.length).toEqual(1);
      expect(gameManager.game.figures).not.toContain(character);
    });
  });

  describe('buildingsEnvelopeHelper', () => {
    it('returns the first not-yet-built envelope building', () => {
      const buildingA = Object.assign(new BuildingData(), { id: 'a', name: 'sanctuary' });
      const buildingB = Object.assign(new BuildingData(), { id: 'b', name: 'shrine' });
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          campaign: Object.assign(new CampaignData(), { buildings: [buildingA, buildingB] })
        })
      ];
      const component = createComponent(buildCharacter());
      expect(component.buildingsEnvelopeHelper('a:b')).toBe(buildingA);
    });

    it('falls through to the second building once the first is already built', () => {
      const buildingA = Object.assign(new BuildingData(), { id: 'a', name: 'sanctuary' });
      const buildingB = Object.assign(new BuildingData(), { id: 'b', name: 'shrine' });
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          campaign: Object.assign(new CampaignData(), { buildings: [buildingA, buildingB] })
        })
      ];
      gameManager.game.party.buildings = [{ name: 'sanctuary', level: 1 } as any];
      const component = createComponent(buildCharacter());
      expect(component.buildingsEnvelopeHelper('a:b')).toBe(buildingB);
    });

    it('returns undefined once both envelope buildings are already built', () => {
      const buildingA = Object.assign(new BuildingData(), { id: 'a', name: 'sanctuary' });
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          campaign: Object.assign(new CampaignData(), { buildings: [buildingA] })
        })
      ];
      gameManager.game.party.buildings = [{ name: 'sanctuary', level: 1 } as any];
      const component = createComponent(buildCharacter());
      expect(component.buildingsEnvelopeHelper('a')).toBeUndefined();
    });
  });

  describe('changeAdditionalPQ', () => {
    it('resolves the personal quest by card id from edition data', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '42', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], [], undefined, [], [], [pq]))];
      const component = createComponent(buildCharacter());
      component.changeAdditionalPQ({ target: { value: '42' } });
      expect(component.additionalPQ).toBe(pq);
    });

    it('leaves additionalPQ unset for an unknown card id', () => {
      const component = createComponent(buildCharacter());
      component.changeAdditionalPQ({ target: { value: '999' } });
      expect(component.additionalPQ).toBeUndefined();
    });
  });
});

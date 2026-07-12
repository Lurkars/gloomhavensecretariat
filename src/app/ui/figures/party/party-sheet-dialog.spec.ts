import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GameCharacterModel } from 'src/app/game/model/Character';
import { EditionData, ReputationSection } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';

// PartySheetDialogComponent's constructor pulls in gameManager.game.party directly and does a
// series of defensive-default assignments, but (unlike ScenarioSummaryComponent) doesn't trigger
// its own heavy update() pipeline, so it's constructible with a fresh default game state. Following
// the AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges(), and
// call methods directly. This spec covers the small lookups/computations (treasures, conclusion/
// reputation checks, campaign stickers, soldier availability) rather than the giant update()
// method or the dialog-opening/mutation flows.

function createComponent(): PartySheetDialogComponent {
  const fixture = TestBed.createComponent(PartySheetDialogComponent);
  return fixture.componentInstance;
}

describe('PartySheetDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartySheetDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: {} },
        { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } }
      ]
    }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.party.treasures = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.buildings = [];
    gameManager.game.party.soldiers = 0;
    gameManager.game.party.weekSections = {};
    gameManager.game.party.campaignStickers = [];
    gameManager.game.party.factionReputation = {};
    gameManager.editionData = [];
  });

  it('constructs successfully from a minimal DIALOG_DATA payload', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('renders the template (running ngOnInit/update) without throwing', () => {
    const fixture = TestBed.createComponent(PartySheetDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('maxScenario', () => {
    it('returns the length of the longest scenario index', () => {
      const component = createComponent();
      const scenarios = [
        Object.assign(new ScenarioData(), { index: '1' }),
        Object.assign(new ScenarioData(), { index: '123' }),
        Object.assign(new ScenarioData(), { index: '12' })
      ];
      expect(component.maxScenario(scenarios)).toEqual(3);
    });
  });

  describe('treasures / hasTreasure', () => {
    it('filters by the selected treasure edition', () => {
      gameManager.game.party.treasures = [new Identifier('1', 'gh'), new Identifier('2', 'fh')];
      const component = createComponent();
      component.treasureEdition = 'gh';
      expect(component.treasures().map((t) => t.name)).toEqual(['1']);
    });

    it('sorts numerically by treasure name when no edition filter is set', () => {
      gameManager.game.party.treasures = [new Identifier('10', 'gh'), new Identifier('2', 'gh')];
      const component = createComponent();
      component.treasureEdition = '';
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { url: 'gh' })];
      expect(component.treasures().map((t) => t.name)).toEqual(['2', '10']);
    });

    it('hasTreasure checks name+edition membership', () => {
      gameManager.game.party.treasures = [new Identifier('5', 'gh')];
      const component = createComponent();
      expect(component.hasTreasure('5', 'gh')).toBe(true);
      expect(component.hasTreasure('5', 'fh')).toBe(false);
    });
  });

  describe('sectionsForWeekFixed / sectionsForWeek', () => {
    it('sectionsForWeek reads party.weekSections at week+1', () => {
      const component = createComponent();
      gameManager.game.party.weekSections = { 2: ['a', 'b'] };
      expect(component.sectionsForWeek(1)).toEqual(['a', 'b']);
      expect(component.sectionsForWeek(5)).toEqual([]);
    });
  });

  describe('isConclusion', () => {
    it('is false for an empty section', () => {
      const component = createComponent();
      expect(component.isConclusion('')).toBe(false);
    });

    it('matches a conclusion by index and (default) the current game edition', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('12', 'gh')];
      const component = createComponent();
      expect(component.isConclusion('12')).toBe(true);
      expect(component.isConclusion('99')).toBe(false);
    });

    it('matches against an explicit edition override', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('12', 'fh')];
      const component = createComponent();
      expect(component.isConclusion('12', 'fh')).toBe(true);
      expect(component.isConclusion('12', 'gh')).toBe(false);
    });
  });

  describe('characterPerks', () => {
    it('sums the perk-progress counts', () => {
      const component = createComponent();
      const characterModel = { progress: { perks: [1, 0, 2] } } as unknown as GameCharacterModel;
      expect(component.characterPerks(characterModel)).toEqual(3);
    });

    it('is 0 when there is no perk progress', () => {
      const component = createComponent();
      const characterModel = { progress: { perks: [] } } as unknown as GameCharacterModel;
      expect(component.characterPerks(characterModel)).toEqual(0);
    });
  });

  describe('additionalReputation', () => {
    it('a "special" reputation section checks whether any faction exceeds the threshold', () => {
      const component = createComponent();
      gameManager.game.party.factionReputation = { alpha: 5 };
      const section: ReputationSection = { faction: 'special', value: 3, section: 'x' };
      expect(component.additionalReputation(section)).toBe(true);

      gameManager.game.party.factionReputation = { alpha: 2 };
      expect(component.additionalReputation(section)).toBe(false);
    });

    it('a normal faction section requires reputation >= value and all required scenarios completed', () => {
      const component = createComponent();
      gameManager.game.edition = 'gh';
      gameManager.game.party.factionReputation = { alpha: 10 };
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const section: ReputationSection = { faction: 'alpha', value: 5, section: 'x', requires: ['1'] };
      expect(component.additionalReputation(section)).toBe(true);
    });

    it('is false when the required scenario has not been completed', () => {
      const component = createComponent();
      gameManager.game.edition = 'gh';
      gameManager.game.party.factionReputation = { alpha: 10 };
      gameManager.game.party.scenarios = [];
      const section: ReputationSection = { faction: 'alpha', value: 5, section: 'x', requires: ['1'] };
      expect(component.additionalReputation(section)).toBe(false);
    });
  });

  describe('soldierAvailable', () => {
    it('is true outside campaign mode', () => {
      const component = createComponent();
      gameManager.game.party.campaignMode = false;
      expect(component.soldierAvailable()).toBe(true);
    });

    it('is false in campaign mode with no barracks built', () => {
      const component = createComponent();
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.buildings = [];
      expect(component.soldierAvailable()).toBe(false);
    });
  });

  describe('campaignStickerImage', () => {
    it('is undefined when the campaign has no matching sticker', () => {
      const component = createComponent();
      expect(component.campaignStickerImage('unknown-sticker', 0)).toBeUndefined();
    });
  });

  describe('countFinished / hasRandomItemLooted / isManual', () => {
    it('reads back values keyed by edition:group:index (populated internally by update())', () => {
      const component = createComponent();
      const scenario = Object.assign(new ScenarioData(), { edition: 'gh', index: '1', group: undefined });
      (component as any).finishedCountMap.set('gh::1', 2);
      (component as any).randomItemLootedSet.add('gh::1');
      (component as any).manualSet.add('gh::1');
      expect(component.countFinished(scenario)).toEqual(2);
      expect(component.hasRandomItemLooted(scenario)).toBe(true);
      expect(component.isManual(scenario)).toBe(true);
    });

    it('defaults to 0/false when nothing is recorded', () => {
      const component = createComponent();
      const scenario = Object.assign(new ScenarioData(), { edition: 'gh', index: '2', group: undefined });
      expect(component.countFinished(scenario)).toEqual(0);
      expect(component.hasRandomItemLooted(scenario)).toBe(false);
      expect(component.isManual(scenario)).toBe(false);
    });
  });
});

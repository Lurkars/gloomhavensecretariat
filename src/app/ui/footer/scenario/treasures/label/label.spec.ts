import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { TreasureData } from 'src/app/game/model/data/RoomData';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';

// TreasureLabelComponent builds the reward labels in ngOnInit. Following the scenario-rule.spec.ts pattern,
// the component is created via TestBed with inputs set via setInput() and ngOnInit() is invoked directly
// without rendering the template. This spec covers the random reward labels (drawn vs. deck depleted).

const prefix = 'game.loot.treasures.rewards.';

function createComponent(treasure: string, rewardResults: string[][] = []): TreasureLabelComponent {
  const fixture = TestBed.createComponent(TreasureLabelComponent);
  fixture.componentRef.setInput('treasure', new TreasureData(treasure, 0));
  fixture.componentRef.setInput('edition', 'fh');
  fixture.componentRef.setInput('rewardResults', rewardResults);
  const component = fixture.componentInstance;
  component.ngOnInit();
  return component;
}

describe('TreasureLabelComponent', () => {
  let edition: string | undefined;
  let drawRandomScenario: boolean;
  let drawRandomItem: boolean;
  let editions: string[];
  let editionData: EditionData[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TreasureLabelComponent] }).compileComponents();
    edition = gameManager.game.edition;
    drawRandomScenario = settingsManager.settings.drawRandomScenario;
    drawRandomItem = settingsManager.settings.drawRandomItem;
    editions = settingsManager.settings.editions;
    editionData = gameManager.editionData;
    settingsManager.settings.editions = ['fh'];
    gameManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
    gameManager.game.edition = 'fh';
    settingsManager.settings.drawRandomScenario = true;
    settingsManager.settings.drawRandomItem = true;
  });

  afterEach(() => {
    gameManager.game.edition = edition;
    settingsManager.settings.drawRandomScenario = drawRandomScenario;
    settingsManager.settings.drawRandomItem = drawRandomItem;
    settingsManager.settings.editions = editions;
    gameManager.editionData = editionData;
  });

  describe('random scenario', () => {
    it('uses the default label when not looted yet', () => {
      const component = createComponent('randomScenarioFh');
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomScenarioFh');
    });

    it('uses the default label when a scenario was drawn', () => {
      const component = createComponent('randomScenarioFh', [['121', 'Title', '%data.scenarioNumber:121%']]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomScenarioFh');
    });

    it('uses the depleted label when nothing could be drawn', () => {
      const component = createComponent('randomScenarioFh', [[]]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomScenarioFh.altFh');
    });

    it('treats a stored empty result as depleted', () => {
      const component = createComponent('gold:5|randomScenarioFh', [['5'], ['']]);
      expect(component.rewardLabel[1][0]).toEqual(prefix + 'randomScenarioFh.altFh');
    });

    it('uses the default label when drawing is disabled', () => {
      settingsManager.settings.drawRandomScenario = false;
      const component = createComponent('randomScenarioFh', [[]]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomScenarioFh');
    });
  });

  describe('random item', () => {
    it('uses the default label when an item was drawn', () => {
      const component = createComponent('randomItemBlueprint', [['1', 'data.items.name', 'fh']]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomItemBlueprint');
    });

    it('uses the depleted label when nothing could be drawn', () => {
      const component = createComponent('randomItemBlueprint', [[]]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomItemBlueprint.altFh');
    });

    it('uses the default label when drawing is disabled', () => {
      settingsManager.settings.drawRandomItem = false;
      const component = createComponent('randomItemBlueprint', [[]]);
      expect(component.rewardLabel[0][0]).toEqual(prefix + 'randomItemBlueprint');
    });
  });
});

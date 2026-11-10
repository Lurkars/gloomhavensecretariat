import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { openPendingWeekSections, openSection } from 'src/app/ui/figures/party/week-sections/week-sections';
import { WeekSectionsHintDialogComponent } from 'src/app/ui/figures/party/week-sections/week-sections-hint';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';

// openPendingWeekSections opens one dialog after another for the pending calendar sections; the
// dialog is faked to record the opened components and to close them on demand.

interface OpenedDialog {
  component: any;
  data: any;
  closed: Subject<any>;
}

function fakeDialog(opened: OpenedDialog[]): Dialog {
  return {
    open: (component: any, config: any) => {
      const closed = new Subject<any>();
      opened.push({ component, data: config.data, closed });
      return { closed };
    }
  } as unknown as Dialog;
}

function section(index: string, overrides: Partial<ScenarioData> = {}): ScenarioData {
  return Object.assign(new ScenarioData(), { edition: 'fh', index, parentSections: undefined, ...overrides });
}

describe('openPendingWeekSections', () => {
  let opened: OpenedDialog[];
  let dialog: Dialog;

  beforeEach(() => {
    opened = [];
    dialog = fakeDialog(opened);
    settingsManager.settings.editions = ['fh'];
    gameManager.game.edition = 'fh';
    gameManager.game.party.conclusions = [];
    gameManager.game.party.weekSections = {};
    gameManager.editionData = [
      new EditionData(
        'fh',
        [],
        [],
        [],
        [],
        [
          section('10.1', { conclusion: true }),
          section('20.1'),
          section('20.2', { conclusion: true, parentSections: [['20.1']] }),
          section('20.3', { conclusion: true, parentSections: [['20.1']] }),
          section('30.1'),
          section('30.2', { conclusion: true, parentSections: [['30.1']] }),
          section('30.3', { parentSections: [['30.1']] }),
          section('30.4', { conclusion: true, parentSections: [['30.3']] }),
          section('40.1', { conclusion: true }),
          section('40.2', { conclusion: true, parentSections: [['40.1']] }),
          section('40.3', { conclusion: true, parentSections: [['40.1']] }),
          section('60.1'),
          section('60.2'),
          section('60.3', { conclusion: true, parentSections: [['60.1'], ['60.2']] })
        ],
        []
      )
    ];
  });

  afterEach(() => {
    gameManager.scenarioManager.pendingWeekSections = [];
    vi.restoreAllMocks();
  });

  it('does nothing without pending sections', () => {
    openPendingWeekSections(dialog);
    expect(opened.length).toBe(0);
  });

  it('opens conclusions and a single hint for consecutive sections without data, one after another', () => {
    gameManager.scenarioManager.pendingWeekSections = [
      { week: 1, index: '10.1', edition: 'fh', group: undefined },
      { week: 1, index: '50.1', edition: 'fh', group: undefined },
      { week: 1, index: '50.2', edition: 'fh', group: undefined }
    ];

    openPendingWeekSections(dialog);

    expect(gameManager.scenarioManager.pendingWeekSections).toEqual([]);
    expect(opened.length).toBe(1);
    expect(opened[0].component).toBe(ScenarioSummaryComponent);
    expect(opened[0].data.conclusionOnly).toBe(true);
    expect(opened[0].data.scenario.index).toBe('10.1');

    opened[0].closed.next(undefined);

    expect(opened.length).toBe(2);
    expect(opened[1].component).toBe(WeekSectionsHintDialogComponent);
    expect(opened[1].data).toEqual(['50.1', '50.2']);
  });

  it('lets select a continuing conclusion and keeps it in the calendar', () => {
    vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
    vi.spyOn(gameManager.stateManager, 'after').mockImplementation(async () => {});
    gameManager.scenarioManager.pendingWeekSections = [{ week: 3, index: '20.1', edition: 'fh', group: undefined }];

    openPendingWeekSections(dialog);

    expect(opened[0].component).toBe(ScenarioConclusionComponent);
    expect(opened[0].data.conclusions.map((conclusion: ScenarioData) => conclusion.index)).toEqual(['20.2', '20.3']);

    opened[0].closed.next(opened[0].data.conclusions[1]);

    expect(gameManager.game.party.weekSections[3]).toEqual(['20.3']);
    expect(opened[1].component).toBe(ScenarioSummaryComponent);
    expect(opened[1].data.scenario.index).toBe('20.3');
  });

  it('offers sections continued by further sections and opens their choice after selection', () => {
    gameManager.scenarioManager.pendingWeekSections = [{ week: 1, index: '30.1', edition: 'fh', group: undefined }];

    openPendingWeekSections(dialog);

    expect(opened[0].component).toBe(ScenarioConclusionComponent);
    expect(opened[0].data.conclusions.map((section: ScenarioData) => section.index)).toEqual(['30.2', '30.3']);

    opened[0].closed.next(opened[0].data.conclusions[1]);

    // only one continuing conclusion: the choice dialog selects it by itself
    expect(opened[1].component).toBe(ScenarioConclusionComponent);
    expect(opened[1].data.conclusions.map((section: ScenarioData) => section.index)).toEqual(['30.4']);
  });

  it('opens the choice of continuing sections after a solved conclusion', () => {
    gameManager.scenarioManager.pendingWeekSections = [{ week: 2, index: '40.1', edition: 'fh', group: undefined }];

    openPendingWeekSections(dialog);

    expect(opened[0].component).toBe(ScenarioSummaryComponent);
    expect(opened[0].data.scenario.index).toBe('40.1');

    // cancelled: no continuing sections
    gameManager.game.party.conclusions = [];
    opened[0].closed.next(undefined);
    expect(opened.length).toBe(1);

    gameManager.scenarioManager.pendingWeekSections = [{ week: 2, index: '40.1', edition: 'fh', group: undefined }];
    openPendingWeekSections(dialog);
    gameManager.game.party.conclusions = [{ index: '40.1', edition: 'fh', group: undefined } as any];
    opened[1].closed.next(undefined);

    expect(opened[2].component).toBe(ScenarioConclusionComponent);
    expect(opened[2].data.parent.index).toBe('40.1');
    expect(opened[2].data.conclusions.map((section: ScenarioData) => section.index)).toEqual(['40.2', '40.3']);
  });

  it('offers sections with several alternative parent sections', () => {
    openSection(dialog, '60.2', 'fh');

    expect(opened[0].component).toBe(ScenarioConclusionComponent);
    expect(opened[0].data.continue).toBe(true);
    expect(opened[0].data.conclusions.map((section: ScenarioData) => section.index)).toEqual(['60.3']);
  });

  it('opens a single section manually without recording it in the calendar and notifies when done', () => {
    const before = vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
    const done = vi.fn();

    openSection(dialog, '20.1', 'fh', undefined, done);
    opened[0].closed.next(opened[0].data.conclusions[0]);

    expect(before).not.toHaveBeenCalled();
    expect(gameManager.game.party.weekSections).toEqual({});
    expect(opened[1].component).toBe(ScenarioSummaryComponent);
    expect(done).not.toHaveBeenCalled();

    opened[1].closed.next(undefined);
    expect(done).toHaveBeenCalled();
  });
});

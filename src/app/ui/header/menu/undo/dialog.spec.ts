import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { LogEntry } from 'src/app/game/model/LogEntry';
import { LogRow, UndoDialogComponent } from 'src/app/ui/header/menu/undo/dialog';

// Covers how the undo/redo stacks and the log are turned into rows: redo stack above the current
// state, undo stack below, followed by older log entries. Never calls detectChanges().

function createComponent(): UndoDialogComponent {
  TestBed.configureTestingModule({
    imports: [UndoDialogComponent],
    providers: [
      {
        provide: DialogRef,
        useValue: { close: () => {}, overlayRef: { hostElement: { style: {} }, backdropElement: undefined } }
      }
    ]
  });
  return TestBed.createComponent(UndoDialogComponent).componentInstance;
}

const describeRow = (row: LogRow) => (row.current ? 'current' : `${row.info[0] ?? '?'}:${row.link ? row.link.type : '-'}`);

describe('UndoDialogComponent', () => {
  const stateManager = gameManager.stateManager;

  async function change(label: string) {
    stateManager.before(label);
    gameManager.game.party.location = label;
    await stateManager.after(0);
  }

  function rows(): string[] {
    stateManager.updatePermissions();
    const component = createComponent();
    component.update();
    return component.rows.map(describeRow);
  }

  beforeEach(() => {
    vi.spyOn(storageManager, 'writeGameModel').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'writeArray').mockResolvedValue(undefined);
    vi.spyOn(gameManager, 'triggerUiChange').mockImplementation(() => undefined);
    settingsManager.label = { data: { partyAchievements: {}, globalAchievements: {} } };
    gameManager.game.figures = [];
    gameManager.game.revision = 0;
    gameManager.game.revisionOffset = 0;
    stateManager.undos = [];
    stateManager.redos = [];
    stateManager.log = [];
    stateManager.ws = undefined;
    stateManager.permissions = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    settingsManager.label = {};
  });

  it('shows only the current state without history', () => {
    expect(rows()).toEqual(['current']);
  });

  it('shows the redo stack above and the undo stack below the current state', async () => {
    await change('a');
    await change('b');
    await change('c');
    stateManager.undo();
    expect(rows()).toEqual(['c:redo', 'current', 'b:undo', 'a:undo']);
  });

  it('shows the next redo directly above the current state', async () => {
    await change('a');
    await change('b');
    stateManager.fixedUndo(2);
    stateManager.updatePermissions();
    const component = createComponent();
    component.update();
    expect(component.rows.map(describeRow)).toEqual(['b:redo', 'a:redo', 'current']);
    stateManager.redo();
    component.update();
    expect(component.rows.map(describeRow)).toEqual(['b:redo', 'current', 'a:undo']);
  });

  it('leaves out undone changes which got replaced by a later change', async () => {
    await change('a');
    await change('b');
    stateManager.undo();
    await change('x');
    expect(rows()).toEqual(['current', 'x:undo', 'a:undo']);
  });

  it('lists older changes without undo snapshot below the undo stack', async () => {
    await change('a');
    await change('b');
    stateManager.clearUndos();
    await change('c');
    expect(rows()).toEqual(['current', 'c:undo', 'b:-', 'a:-']);
  });

  it('shows undo snapshots without log entry', () => {
    stateManager.undos = [gameManager.game.toModel()];
    expect(rows()).toEqual(['current', '?:undo']);
  });

  it('hides older changes without info and of other campaigns unless requested', () => {
    stateManager.log = [new LogEntry('update', 0, []), new LogEntry('update', 1, ['other'], 1, gameManager.game.party.id + 1)];
    stateManager.updatePermissions();
    const component = createComponent();
    component.update();
    expect(component.rows.map(describeRow)).toEqual(['current']);
    expect(component.multipleParties).toBe(true);
    component.toggleAllParties();
    expect(component.rows.map(describeRow)).toEqual(['current', 'other:-']);
  });

  it('asks for confirmation before undoing to the state before a change', async () => {
    gameManager.game.party.location = 'start';
    await change('a');
    await change('b');
    stateManager.updatePermissions();
    const component = createComponent();
    component.update();
    const row = component.rows.find((row) => row.info[0] === 'a')!;

    component.select(row);
    expect(component.isConfirm(row)).toBe(true);
    expect(stateManager.undos.length).toBe(2);

    component.select(row);
    expect(stateManager.undos.length).toBe(0);
    expect(stateManager.redos.length).toBe(2);
    expect(gameManager.game.party.location).toBe('start');
  });

  it('shows time, campaign and server sync as tooltip metadata', () => {
    vi.spyOn(settingsManager, 'getLabel').mockImplementation((key: string, args: string[] = []) => key + ':' + args.join(','));
    const component = createComponent();
    component.multipleParties = true;
    const entry = new LogEntry('update', 1, ['a'], Date.UTC(2026, 10, 13, 12, 8), 7, 'gh', true);
    const lines = component.tooltip(entry).split('<br>');
    expect(lines.length).toBe(3);
    expect(lines[0]).toMatch(/^state\.log\.time:.*2026/);
    expect(lines[1]).toBe('state.log.party:%party% 7 (%data.edition.gh%)');
    expect(lines[2]).toBe('state.log.server:');
    expect(component.tooltip(new LogEntry('update', 1, ['a'], 0))).toBe('');
  });

  it('does not select changes without snapshot', () => {
    stateManager.log = [new LogEntry('update', 5, ['old'])];
    const component = createComponent();
    component.update();
    const row = component.rows.find((row) => !row.current)!;
    expect(component.disabled(row)).toBe(true);
    component.select(row);
    expect(component.undoConfirm).toBe('');
  });
});

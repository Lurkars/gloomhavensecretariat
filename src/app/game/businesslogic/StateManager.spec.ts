import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { StateManager } from 'src/app/game/businesslogic/StateManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { commandManager } from 'src/app/game/commands/CommandManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LogEntry } from 'src/app/game/model/LogEntry';
import { Permissions } from 'src/app/game/model/Permissions';

// StateManager backs the game's undo/redo stack, local persistence and websocket sync.
// These tests focus on the pure bookkeeping logic (before/after pairing, undo/redo stack
// mechanics) with storage and network side-effects mocked out.

function buildCharacter(name: string, edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), {
    name,
    edition,
    stats: [new CharacterStat(1, 10)]
  });
  return new Character(data, 1);
}

describe('StateManager', () => {
  const stateManager = gameManager.stateManager;

  beforeEach(() => {
    vi.spyOn(storageManager, 'writeGameModel').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'writeArray').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'addBackup').mockImplementation(() => undefined as any);
    vi.spyOn(gameManager, 'triggerUiChange').mockImplementation(() => undefined);

    gameManager.game.figures = [];
    gameManager.game.revision = 0;
    gameManager.game.revisionOffset = 0;
    gameManager.game.party.retirements = [];

    stateManager.undos = [];
    stateManager.redos = [];
    stateManager.log = [];
    stateManager.ws = undefined;
    stateManager.permissions = undefined;
    stateManager.updateBlocked = false;
    stateManager.lastAction = 'update';
    document.body.className = '';

    // Game.fromModel() triggers Party.migrate(), which reads label data that is only
    // populated once game data is loaded in the running app; provide a minimal stub so
    // undo/redo (which round-trip through fromModel) don't throw in this unit test.
    settingsManager.label = { data: { partyAchievements: {}, globalAchievements: {} } };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
    settingsManager.label = {};
    settingsManager.settings.serverCode = undefined;
    settingsManager.settings.serverSettings = false;
  });

  describe('buildWsUrl', () => {
    it('builds a simple url without a path', () => {
      expect(stateManager.buildWsUrl('ws://', 'example.com', 8080)).toEqual('ws://example.com:8080');
    });

    it('builds a url preserving a sub-path', () => {
      expect(stateManager.buildWsUrl('wss://', 'example.com/ghs', 443)).toEqual('wss://example.com:443/ghs');
    });

    it('joins multiple path segments', () => {
      expect(stateManager.buildWsUrl('ws://', 'example.com/a/b', 80)).toEqual('ws://example.com:80/a/b');
    });
  });

  describe('wsState', () => {
    it('returns -99 when server is not configured', () => {
      expect(stateManager.wsState()).toEqual(-99);
    });
  });

  describe('hasUndo / hasRedo', () => {
    it('is false for empty stacks', () => {
      expect(stateManager.hasUndo()).toBe(false);
      expect(stateManager.hasRedo()).toBe(false);
    });

    it('is true once entries exist', () => {
      stateManager.undos.push(gameManager.game.toModel());
      stateManager.redos.push(gameManager.game.toModel());
      expect(stateManager.hasUndo()).toBe(true);
      expect(stateManager.hasRedo()).toBe(true);
    });
  });

  describe('before / addToUndo', () => {
    it('pushes a new undo snapshot with the given label', () => {
      stateManager.before('undoLabel', 'arg1', 2);
      expect(stateManager.undos.length).toEqual(1);
      expect(stateManager.log[stateManager.log.length - 1].info).toEqual(['undoLabel', 'arg1', '2']);
      expect(stateManager.undoInfo(0)).toEqual(['undoLabel', 'arg1', '2']);
    });

    it('adds the working class to body', () => {
      stateManager.before('someLabel');
      expect(document.body.classList.contains('working')).toBe(true);
    });

    it('clears the redo stack on a new mutation', () => {
      stateManager.redos.push(gameManager.game.toModel());
      expect(stateManager.hasRedo()).toBe(true);
      stateManager.before('label');
      expect(stateManager.hasRedo()).toBe(false);
    });

    it('accumulates multiple undo entries across successive before() calls', () => {
      stateManager.before('first');
      stateManager.before('second');
      stateManager.before('third');
      expect(stateManager.undos.length).toEqual(3);
      expect(stateManager.log.map((entry) => entry.info[0])).toEqual(['first', 'second', 'third']);
    });

    it('caps undo stack length at maxUndo (capped at 50 without a real db)', () => {
      const originalMaxUndo = settingsManager.settings.maxUndo;
      settingsManager.settings.maxUndo = 3;
      try {
        stateManager.before('a');
        stateManager.before('b');
        stateManager.before('c');
        stateManager.before('d');
        expect(stateManager.undos.length).toEqual(3);
      } finally {
        settingsManager.settings.maxUndo = originalMaxUndo;
      }
    });
  });

  describe('revertLastUndo', () => {
    it('discards the most recent undo entry without touching earlier ones', () => {
      stateManager.before('first');
      stateManager.before('second');
      expect(stateManager.undos.length).toEqual(2);

      stateManager.revertLastUndo();

      expect(stateManager.undos.length).toEqual(1);
      expect(stateManager.log.length).toEqual(1);
      expect(stateManager.log[0].info[0]).toEqual('first');
    });

    it('removes the working/server-sync classes and triggers a ui change', () => {
      document.body.classList.add('working');
      document.body.classList.add('server-sync');
      stateManager.before('label');

      stateManager.revertLastUndo();

      expect(document.body.classList.contains('working')).toBe(false);
      expect(document.body.classList.contains('server-sync')).toBe(false);
      expect(gameManager.triggerUiChange).toHaveBeenCalled();
    });
  });

  describe('clearUndos / clearRedos', () => {
    it('clearUndos empties the undo stack but keeps the log', () => {
      stateManager.before('a');
      stateManager.before('b');
      stateManager.clearUndos();
      expect(stateManager.undos.length).toEqual(0);
      expect(stateManager.log.length).toEqual(2);
      expect(stateManager.undoInfo(0)).toEqual([]);
    });

    it('clearRedos empties the redo stack', () => {
      stateManager.redos.push(gameManager.game.toModel(), gameManager.game.toModel());
      stateManager.clearRedos();
      expect(stateManager.redos.length).toEqual(0);
      expect(stateManager.hasRedo()).toBe(false);
    });
  });

  describe('undo / redo (fixedUndo / fixedRedo)', () => {
    it('undo() moves the current state to redos and restores the previous game state', () => {
      gameManager.game.party.location = 'first-location';
      stateManager.before('checkpoint'); // snapshot with 'first-location'

      gameManager.game.party.location = 'second-location';

      stateManager.undo(false);

      expect(gameManager.game.party.location).toEqual('first-location');
      expect(stateManager.undos.length).toEqual(0);
      expect(stateManager.redos.length).toEqual(1);
      expect(stateManager.lastAction).toEqual('undo');
    });

    it('redo() restores the state that was undone', () => {
      gameManager.game.party.location = 'first-location';
      stateManager.before('checkpoint');
      gameManager.game.party.location = 'second-location';

      stateManager.undo(false);
      expect(gameManager.game.party.location).toEqual('first-location');

      stateManager.redo(false);
      expect(gameManager.game.party.location).toEqual('second-location');
      expect(stateManager.redos.length).toEqual(0);
      expect(stateManager.undos.length).toEqual(1);
    });

    it('does nothing when there is nothing to undo', () => {
      expect(stateManager.undos.length).toEqual(0);
      stateManager.undo(false);
      expect(stateManager.redos.length).toEqual(0);
    });

    it('does nothing when there is nothing to redo', () => {
      expect(stateManager.redos.length).toEqual(0);
      stateManager.redo(false);
      expect(stateManager.undos.length).toEqual(0);
    });

    it('fixedUndo can jump back multiple steps at once', () => {
      gameManager.game.party.location = 'loc-1';
      stateManager.before('c1');
      gameManager.game.party.location = 'loc-2';
      stateManager.before('c2');
      gameManager.game.party.location = 'loc-3';
      stateManager.before('c3');
      gameManager.game.party.location = 'loc-4';

      stateManager.fixedUndo(3, false);

      expect(gameManager.game.party.location).toEqual('loc-1');
      expect(stateManager.undos.length).toEqual(0);
      expect(stateManager.redos.length).toEqual(3);
    });
  });

  describe('log', () => {
    async function change(label: string) {
      stateManager.before(label);
      gameManager.game.party.location = label;
      await stateManager.after(0);
    }

    it('records an update entry bound to the effective revision of the undo snapshot', async () => {
      gameManager.game.revision = 10;
      gameManager.game.revisionOffset = 4;
      await change('a');
      expect(stateManager.log.length).toBe(1);
      expect(stateManager.log[0].type).toBe('update');
      expect(stateManager.log[0].revision).toBe(6);
      expect(stateManager.log[0].revision).toBe(stateManager.undos[0].revision - stateManager.undos[0].revisionOffset);
      expect(stateManager.log[0].party).toBe(gameManager.game.party.id);
      expect(stateManager.log[0].timestamp).toBeGreaterThan(0);
    });

    it('labels undo and redo snapshots from the log while undoing and redoing', async () => {
      await change('a');
      await change('b');
      await change('c');
      expect([0, 1, 2].map((i) => stateManager.undoInfo(i)[0])).toEqual(['a', 'b', 'c']);

      stateManager.undo();
      expect(stateManager.undoInfo(1)[0]).toBe('b');
      expect(stateManager.redoInfo(0)[0]).toBe('c');
      expect(stateManager.log[stateManager.log.length - 1]).toMatchObject({ type: 'undo', info: ['c'], length: 1 });

      stateManager.undo();
      expect(stateManager.undoInfo(0)[0]).toBe('a');
      expect(stateManager.redoInfo(0)[0]).toBe('b');
      expect(stateManager.redoInfo(1)[0]).toBe('c');

      stateManager.redo();
      expect(stateManager.undoInfo(1)[0]).toBe('b');
      expect(stateManager.redoInfo(0)[0]).toBe('c');
      expect(stateManager.log[stateManager.log.length - 1]).toMatchObject({ type: 'redo', info: ['b'], length: 1 });
      expect(gameManager.game.party.location).toBe('b');
    });

    it('links a new change after an undo instead of the undone one', async () => {
      await change('a');
      await change('b');
      stateManager.undo();
      await change('x');
      expect(stateManager.undoInfo(0)[0]).toBe('a');
      expect(stateManager.undoInfo(1)[0]).toBe('x');
      expect(stateManager.hasRedo()).toBe(false);
    });

    it('logs a multi-step undo as a single entry with length and target revision', async () => {
      await change('a');
      await change('b');
      await change('c');
      stateManager.fixedUndo(3);
      const entry = stateManager.log[stateManager.log.length - 1];
      expect(entry).toMatchObject({ type: 'undo', info: ['c'], length: 3, revision: 3, target: 0 });
      expect(stateManager.redoInfo(0)[0]).toBe('a');
      expect(stateManager.redoInfo(2)[0]).toBe('c');
    });

    it('does not link entries of an older game with overlapping revisions to newer snapshots', async () => {
      await change('old');
      // an older revision gets loaded (e.g. another server game)
      gameManager.game.revision = 0;
      await change('new');
      expect(stateManager.undoInfo(1)[0]).toBe('new');
      expect(stateManager.undoInfo(0)[0]).toBe('old');
    });

    it('exposes links from log entries to the snapshots', async () => {
      await change('a');
      await change('b');
      stateManager.undo();
      const links = stateManager.history().links;
      expect(links.get(stateManager.log[0])).toEqual({ type: 'undo', index: 0 });
      expect(links.get(stateManager.log[1])).toEqual({ type: 'redo', index: 0 });
      expect(links.get(stateManager.log[2])).toBeUndefined();
    });

    it('keeps the log when undo snapshots are trimmed and trims the log to maxLog', async () => {
      const maxUndo = settingsManager.settings.maxUndo;
      const maxLog = settingsManager.settings.maxLog;
      settingsManager.settings.maxUndo = 2;
      settingsManager.settings.maxLog = 4;
      try {
        for (const label of ['a', 'b', 'c', 'd', 'e']) {
          await change(label);
        }
        expect(stateManager.undos.length).toBe(2);
        expect(stateManager.log.map((entry) => entry.info[0])).toEqual(['b', 'c', 'd', 'e']);
        expect(stateManager.undoInfo(0)[0]).toBe('d');
      } finally {
        settingsManager.settings.maxUndo = maxUndo;
        settingsManager.settings.maxLog = maxLog;
      }
    });

    it('never trims the log with maxLog -1', async () => {
      const maxUndo = settingsManager.settings.maxUndo;
      const maxLog = settingsManager.settings.maxLog;
      settingsManager.settings.maxUndo = 1;
      settingsManager.settings.maxLog = -1;
      try {
        for (const label of ['a', 'b', 'c', 'd']) {
          await change(label);
        }
        expect(stateManager.undos.length).toBe(1);
        expect(stateManager.log.map((entry) => entry.info[0])).toEqual(['a', 'b', 'c', 'd']);
      } finally {
        settingsManager.settings.maxUndo = maxUndo;
        settingsManager.settings.maxLog = maxLog;
      }
    });

    it('stores no log with maxLog 0', async () => {
      const maxLog = settingsManager.settings.maxLog;
      settingsManager.settings.maxLog = 0;
      try {
        await change('a');
        expect(stateManager.log.length).toBe(0);
        expect(stateManager.undos.length).toBe(1);
        expect(stateManager.undoInfo(0)).toEqual([]);
      } finally {
        settingsManager.settings.maxLog = maxLog;
      }
    });

    it('sends the info of the matching log entry to the server', async () => {
      const send = vi.fn();
      stateManager.ws = { readyState: WebSocket.OPEN, send } as any;
      settingsManager.settings.serverCode = 'code';
      await change('a');
      await change('b');
      expect(JSON.parse(send.mock.calls[1][0])).toMatchObject({ type: 'game', undoinfo: ['b'] });
      stateManager.undo();
      expect(JSON.parse(send.mock.calls[2][0])).toMatchObject({ type: 'game-undo', undoinfo: ['b'], undolength: 1 });
      stateManager.redo();
      expect(JSON.parse(send.mock.calls[3][0])).toMatchObject({ type: 'game-redo', undoinfo: ['b'] });
    });

    it('logs an undo received from the server', async () => {
      await change('a');
      await change('b');
      const model = stateManager.undos[1];
      stateManager.onMessage({ data: JSON.stringify({ type: 'game-undo', payload: model, revision: 1, undoinfo: ['b'], undolength: 1 }) });
      const entry = stateManager.log[stateManager.log.length - 1];
      expect(entry).toMatchObject({ type: 'undo', server: true, info: ['serverSync', 'b'], revision: 2, target: 1 });
      expect(stateManager.redoInfo(0)[0]).toBe('b');
    });

    it('displays server infos as a single resolved argument', () => {
      vi.spyOn(settingsManager, 'getLabel').mockImplementation((key: string, args: string[] = []) => key + ':' + args.join(','));
      expect(stateManager.displayInfo(new LogEntry('update', 0, ['serverSync', 'setInitiative', 'brute', '50']))).toEqual([
        'serverSync',
        'state.info.setInitiative:brute,'
      ]);
      expect(stateManager.displayInfo(new LogEntry('update', 0, ['serverSync', 'setInitiative', 'brute', '50']), false)).toEqual([
        'serverSync',
        'state.info.setInitiative:brute,50'
      ]);
      expect(stateManager.displayInfo(new LogEntry('update', 0, ['serverSync']))).toEqual(['serverSync', '']);
      expect(stateManager.displayInfo(undefined)).toEqual([]);
    });

    it('clearLog keeps only entries linked to undo/redo snapshots', async () => {
      await change('a');
      await change('b');
      stateManager.undo();
      stateManager.clearUndos();
      stateManager.clearLog();
      expect(stateManager.log.map((entry) => entry.info[0])).toEqual(['b']);
      expect(stateManager.redoInfo(0)[0]).toBe('b');
    });

    it('never trims entries linked to undo/redo snapshots', async () => {
      const maxUndo = settingsManager.settings.maxUndo;
      const maxLog = settingsManager.settings.maxLog;
      settingsManager.settings.maxUndo = 3;
      settingsManager.settings.maxLog = 3;
      try {
        await change('a');
        await change('b');
        await change('c');
        // undo/redo entries take log slots as well
        stateManager.undo();
        stateManager.redo();
        expect(stateManager.log.length).toBe(5);
        expect([0, 1, 2].map((i) => stateManager.undoInfo(i)[0])).toEqual(['a', 'b', 'c']);
        await change('d');
        expect(stateManager.undoInfo(0)[0]).toBe('b');
        expect(stateManager.log[0].info[0]).toBe('b');
      } finally {
        settingsManager.settings.maxUndo = maxUndo;
        settingsManager.settings.maxLog = maxLog;
      }
    });
  });

  describe('automatic changes', () => {
    async function change(label: string) {
      stateManager.before(label);
      gameManager.game.party.location = label;
      await stateManager.after(0);
    }

    it('keeps the redo history and the undo/redo position', async () => {
      await change('a');
      await change('b');
      stateManager.undo();
      const revision = gameManager.game.revision;
      const effective = gameManager.game.revision - gameManager.game.revisionOffset;

      stateManager.beforeAutomatic('gameClock.automaticGameClockOut');
      await stateManager.afterAutomatic(0);

      expect(stateManager.redos.length).toBe(1);
      expect(stateManager.undos.length).toBe(1);
      expect(gameManager.game.revision).toBe(revision + 1);
      expect(gameManager.game.revision - gameManager.game.revisionOffset).toBe(effective);
      expect(stateManager.log[stateManager.log.length - 1]).toMatchObject({
        type: 'automatic',
        info: ['gameClock.automaticGameClockOut']
      });
      expect(stateManager.undoInfo(0)[0]).toBe('a');
      expect(stateManager.redoInfo(0)[0]).toBe('b');

      stateManager.redo();
      expect(gameManager.game.party.location).toBe('b');
      expect(stateManager.undoInfo(1)[0]).toBe('b');
    });

    it('syncs the change with a higher revision but without undo info', async () => {
      const send = vi.fn();
      stateManager.ws = { readyState: WebSocket.OPEN, send } as any;
      settingsManager.settings.serverCode = 'code';
      await change('a');
      stateManager.beforeAutomatic('gameClock.automaticGameClockOut');
      await stateManager.afterAutomatic(0);
      const message = JSON.parse(send.mock.calls[1][0]);
      expect(message.type).toBe('game');
      expect(message.undoinfo).toBeUndefined();
      expect(message.payload.revision).toBe(2);
    });
  });

  describe('migration of undo infos', () => {
    const snapshot = (revision: number, revisionOffset: number = 0) => ({ revision, revisionOffset }) as any;

    it('binds undo infos to the revisions of the undo/redo snapshots', () => {
      const undos = [snapshot(1), snapshot(4, 2)];
      const redos = [snapshot(5), snapshot(4)];
      const log = StateManager.undoInfosToLog([['a'], ['b'], ['c'], ['d']], undos, redos, { revision: 3, revisionOffset: 0 });
      expect(log.map((entry) => [entry.revision, entry.info[0]])).toEqual([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd']
      ]);
      expect(log.every((entry) => entry.type === 'update' && !entry.timestamp)).toBe(true);

      gameManager.game.revision = 3;
      stateManager.undos = undos;
      stateManager.redos = redos;
      stateManager.log = log;
      expect(stateManager.undoInfo(0)[0]).toBe('a');
      expect(stateManager.undoInfo(1)[0]).toBe('b');
      expect(stateManager.redoInfo(0)[0]).toBe('c');
      expect(stateManager.redoInfo(1)[0]).toBe('d');
    });

    it('handles padded (missing) and surplus infos and marks server infos', () => {
      const undos = [snapshot(1), snapshot(2)];
      expect(StateManager.undoInfosToLog([['b']], undos, [], { revision: 3, revisionOffset: 0 }).map((e) => [e.revision, e.info])).toEqual([
        [1, []],
        [2, ['b']]
      ]);
      const log = StateManager.undoInfosToLog([['x'], [], ['serverSync', 'c']], undos, [], { revision: 3, revisionOffset: 0 });
      expect(log.length).toBe(2);
      expect(log[0]).toMatchObject({ revision: 1, info: [] });
      expect(log[1]).toMatchObject({ revision: 2, server: true, info: ['serverSync', 'c'] });
    });

    it('migrates stored undo infos once into the log and clears them', async () => {
      stateManager.undos = [snapshot(1)];
      vi.spyOn(storageManager, 'readAll').mockImplementation(async (store: string) => (store === 'undo-infos' ? [['a']] : []) as any);
      const clear = vi.spyOn(storageManager, 'clear').mockResolvedValue(undefined);

      await stateManager.migrateUndoInfos();

      expect(stateManager.log.map((entry) => entry.info)).toEqual([['a']]);
      expect(storageManager.writeArray).toHaveBeenCalledWith('log', stateManager.log);
      expect(clear).toHaveBeenCalledWith('undo-infos');
    });

    it('keeps an existing log and only drops the undo infos', async () => {
      stateManager.log = [new LogEntry('update', 0, ['existing'])];
      vi.spyOn(storageManager, 'readAll').mockResolvedValue([['a']] as any);
      const clear = vi.spyOn(storageManager, 'clear').mockResolvedValue(undefined);

      await stateManager.migrateUndoInfos();

      expect(stateManager.log.map((entry) => entry.info)).toEqual([['existing']]);
      expect(clear).toHaveBeenCalledWith('undo-infos');
    });
  });

  describe('after', () => {
    it('advances the game revision by revisionChange', async () => {
      gameManager.game.revision = 5;
      await stateManager.after(0, false, 2);
      expect(gameManager.game.revision).toEqual(7);
    });

    it('persists the game locally via storageManager', async () => {
      await stateManager.after(0);
      expect(storageManager.writeGameModel).toHaveBeenCalled();
    });

    it('sets lastAction back to update and triggers a ui change when timeout is 0', async () => {
      stateManager.lastAction = 'undo';
      await stateManager.after(0);
      expect(stateManager.lastAction).toEqual('update');
      expect(gameManager.triggerUiChange).toHaveBeenCalled();
    });

    it('removes the working/server-sync classes', async () => {
      document.body.classList.add('working');
      document.body.classList.add('server-sync');
      await stateManager.after(0);
      expect(document.body.classList.contains('working')).toBe(false);
      expect(document.body.classList.contains('server-sync')).toBe(false);
    });
  });

  describe('updatePermissions', () => {
    it('grants undo/redo permission when there are no server permissions', () => {
      stateManager.undos.push(gameManager.game.toModel());
      stateManager.permissions = undefined;
      stateManager.updatePermissions();
      expect(stateManager.undoPermission).toBe(true);
    });

    it('denies undo/redo permission while update is blocked and permissions are set', () => {
      stateManager.undos.push(gameManager.game.toModel());
      stateManager.permissions = new Permissions();
      stateManager.updateBlocked = true;
      stateManager.updatePermissions();
      expect(stateManager.undoPermission).toBe(false);
    });

    it('grants character permission for a specific character when listed', () => {
      const character = buildCharacter('brute');
      gameManager.game.figures.push(character);

      const permissions = new Permissions();
      permissions.characters = false;
      permissions.character = [{ name: 'brute', edition: 'gh' } as any];
      stateManager.permissions = permissions;

      stateManager.updatePermissions();

      expect(stateManager.characterPermissions['brute|gh']).toBe(true);
    });

    it('denies character permission for characters not listed', () => {
      const character = buildCharacter('brute');
      gameManager.game.figures.push(character);

      const permissions = new Permissions();
      permissions.characters = false;
      permissions.character = [];
      stateManager.permissions = permissions;

      stateManager.updatePermissions();

      expect(stateManager.characterPermissions['brute|gh']).toBe(false);
    });
  });

  describe('onMessage', () => {
    it('applies an incoming "game" payload, saves locally and clears any prior server error', () => {
      stateManager.automaticTheme = false; // skip the edition-driven theme-detection branch
      stateManager.serverError = 'previous error';
      const model = gameManager.game.toModel();
      model.revision = 5;

      stateManager.onMessage({ data: JSON.stringify({ type: 'game', payload: model }) });

      expect(gameManager.game.revision).toBe(5);
      expect(stateManager.serverError).toBe('');
      expect(storageManager.writeGameModel).toHaveBeenCalled();
    });

    it('catches malformed JSON, logs it and records the raw payload as the server error', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      stateManager.onMessage({ data: 'not-json' });

      expect(stateManager.errorLog).toContain('not-json');
      expect(stateManager.serverError).toBe('not-json');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('applies a "permissions" payload and refreshes derived permission state', () => {
      const permissions = new Permissions();
      permissions.characters = true;
      stateManager.serverError = 'previous error';
      const updateSpy = vi.spyOn(stateManager, 'updatePermissions');

      stateManager.onMessage({ data: JSON.stringify({ type: 'permissions', payload: permissions }) });

      expect(stateManager.permissions?.characters).toBe(true);
      expect(updateSpy).toHaveBeenCalled();
      expect(stateManager.serverError).toBe('');
    });

    it('clears permissions when the "permissions" payload is empty', () => {
      stateManager.permissions = new Permissions();

      stateManager.onMessage({ data: JSON.stringify({ type: 'permissions', payload: undefined }) });

      expect(stateManager.permissions).toBeUndefined();
    });

    it('undoes the last action on a "Permission(s) missing" error while lastAction is "update"', () => {
      stateManager.lastAction = 'update';
      const undoSpy = vi.spyOn(stateManager, 'undo').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      stateManager.onMessage({ data: JSON.stringify({ type: 'error', message: 'Permission(s) missing for X' }) });

      expect(undoSpy).toHaveBeenCalledWith(false);
      expect(stateManager.serverError).toContain('Permission(s) missing');
    });

    it('redoes instead when a permission error arrives while lastAction is "undo"', () => {
      stateManager.lastAction = 'undo';
      const redoSpy = vi.spyOn(stateManager, 'redo').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      stateManager.onMessage({ data: JSON.stringify({ type: 'error', message: 'invalid revision for Y' }) });

      expect(redoSpy).toHaveBeenCalledWith(false);
    });

    it('requests a game-update via after() on "requestUpdate"', () => {
      const afterSpy = vi.spyOn(stateManager, 'after').mockImplementation(async () => {});
      stateManager.serverError = 'previous error';

      stateManager.onMessage({ data: JSON.stringify({ type: 'requestUpdate' }) });

      expect(afterSpy).toHaveBeenCalledWith(1, false, 0, 'game-update');
      expect(stateManager.serverError).toBe('');
    });

    it('triggers a ui change for an unrecognized message type', () => {
      stateManager.onMessage({ data: JSON.stringify({ type: 'something-unknown' }) });

      expect(gameManager.triggerUiChange).toHaveBeenCalledWith(false);
    });

    it('does not throw for a "ping" message', () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      expect(() => stateManager.onMessage({ data: JSON.stringify({ type: 'ping' }) })).not.toThrow();
    });

    it('executes a remote command when the game is server-authoritative', () => {
      gameManager.game.server = true;
      const executeSpy = vi.spyOn(commandManager, 'execute').mockImplementation(() => {});

      stateManager.onMessage({
        data: JSON.stringify({ type: 'remoteCommand', payload: { id: 'round.state', parameters: [] } })
      });

      expect(executeSpy).toHaveBeenCalledWith('round.state', true);
    });

    it('ignores a remote command when the game is not server-authoritative and not forced', () => {
      gameManager.game.server = false;
      const executeSpy = vi.spyOn(commandManager, 'execute').mockImplementation(() => {});

      stateManager.onMessage({
        data: JSON.stringify({ type: 'remoteCommand', payload: { id: 'round.state', parameters: [], force: false } })
      });

      expect(executeSpy).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('closes an open websocket and clears permissions', () => {
      const close = vi.fn();
      stateManager.ws = { readyState: WebSocket.OPEN, close } as any;
      stateManager.permissions = new Permissions();
      const updateSpy = vi.spyOn(stateManager, 'updatePermissions');

      stateManager.disconnect();

      expect(close).toHaveBeenCalled();
      expect(stateManager.permissions).toBeUndefined();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('does not attempt to close an already-closed websocket', () => {
      const close = vi.fn();
      stateManager.ws = { readyState: WebSocket.CLOSED, close } as any;

      stateManager.disconnect();

      expect(close).not.toHaveBeenCalled();
    });

    it('is a no-op (no throw) when there is no websocket at all', () => {
      stateManager.ws = undefined;
      expect(() => stateManager.disconnect()).not.toThrow();
    });
  });

  describe('onOpen', () => {
    it('resets connection bookkeeping, restores the backed-up permissions and requests the game state', () => {
      settingsManager.settings.serverCode = 'code1';
      settingsManager.settings.serverSettings = false;
      stateManager.connectionTries = 3;
      stateManager.updateBlocked = true;
      stateManager.permissionBackup = new Permissions();
      const send = vi.fn();
      const ws = { readyState: WebSocket.OPEN, send } as any;
      const updateSpy = vi.spyOn(stateManager, 'updatePermissions');

      stateManager.onOpen({ target: ws } as any);

      expect(stateManager.connectionTries).toBe(0);
      expect(stateManager.updateBlocked).toBe(false);
      expect(stateManager.permissions).toBe(stateManager.permissionBackup);
      expect(send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('request-game');
      expect(updateSpy).toHaveBeenCalled();
      expect(gameManager.triggerUiChange).toHaveBeenCalledWith(false);
    });

    it('also requests settings when serverSettings is enabled', () => {
      settingsManager.settings.serverCode = 'code1';
      settingsManager.settings.serverSettings = true;
      const send = vi.fn();
      const ws = { readyState: WebSocket.OPEN, send } as any;

      stateManager.onOpen({ target: ws } as any);

      expect(send).toHaveBeenCalledTimes(2);
      const secondMessage = JSON.parse(send.mock.calls[1][0]);
      expect(secondMessage.type).toBe('request-settings');
    });

    it('does nothing when the socket is not actually open', () => {
      settingsManager.settings.serverCode = 'code1';
      const send = vi.fn();
      const ws = { readyState: WebSocket.CONNECTING, send } as any;

      stateManager.onOpen({ target: ws } as any);

      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('onClose / onError', () => {
    it('onClose marks the game as disconnected and resets permissions', () => {
      gameManager.game.server = true;
      stateManager.updateBlocked = false;
      stateManager.serverVersion = '1.2.3';
      const updateSpy = vi.spyOn(stateManager, 'updatePermissions');

      stateManager.onClose({} as any);

      expect(gameManager.game.server).toBe(false);
      expect(stateManager.updateBlocked).toBe(true);
      expect(stateManager.serverVersion).toBe('');
      expect(stateManager.permissions).toEqual(new Permissions());
      expect(updateSpy).toHaveBeenCalled();
      expect(gameManager.triggerUiChange).toHaveBeenCalledWith(false);
    });

    it('onError marks the game as disconnected and resets permissions', () => {
      gameManager.game.server = true;
      stateManager.updateBlocked = false;

      stateManager.onError({} as any);

      expect(gameManager.game.server).toBe(false);
      expect(stateManager.updateBlocked).toBe(true);
      expect(stateManager.permissions).toEqual(new Permissions());
    });
  });
});

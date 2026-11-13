export type LogEntryType = 'update' | 'undo' | 'redo' | 'automatic';

/**
 * A single entry of the game log. Unlike undo/redo snapshots it never contains game state, so the log can be much longer than the undo history.
 *
 * Entries are bound to the effective game revision (`revision - revisionOffset`), which is also carried by every undo/redo snapshot:
 * - `update`: a change of the game. `revision` is the effective revision of the state *before* the change, i.e. the revision of the undo snapshot taken for it.
 * - `undo`/`redo`: an undo/redo of `length` steps from effective revision `revision` to effective revision `target`. `info` is the info of the (last) affected change.
 * - `automatic`: a change done automatically in background (e.g. auto. clock out). It has no undo snapshot, keeps the redo history and does not change the effective revision.
 */
export class LogEntry {
  type: LogEntryType;
  revision: number;
  info: string[];
  timestamp: number | undefined;
  // undo/redo only
  target: number | undefined;
  length: number | undefined;
  // active party (campaign) and edition when the entry was created
  party: number | undefined;
  edition: string | undefined;
  // received from another client via server sync
  server: boolean;

  constructor(
    type: LogEntryType,
    revision: number,
    info: string[],
    timestamp: number | undefined = Date.now(),
    party: number | undefined = undefined,
    edition: string | undefined = undefined,
    server: boolean = false,
    target: number | undefined = undefined,
    length: number | undefined = undefined
  ) {
    this.type = type;
    this.revision = revision;
    this.info = info;
    this.timestamp = timestamp;
    this.party = party;
    this.edition = edition;
    this.server = server;
    this.target = target;
    this.length = length;
  }
}

/** effective revision of a game (model): the position in the linear undo/redo history */
export function effectiveRevision(model: { revision: number; revisionOffset: number } | undefined): number {
  return (model && (model.revision || 0) - (model.revisionOffset || 0)) || 0;
}

import { DialogRef } from '@angular/cdk/dialog';
import { formatDate, NgClass, SlicePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { effectiveRevision, LogEntry } from 'src/app/game/model/LogEntry';
import { AutoscrollDirective } from 'src/app/ui/helper/autoscroll';
import { InViewportDirective } from 'src/app/ui/helper/in-viewport';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

export type LogRow = {
  current: boolean;
  // undo/redo rows: revision of the snapshot, log rows: revision the change was applied on
  revision: number;
  // log entry describing the change, missing for snapshots without log entry
  entry: LogEntry | undefined;
  // linked undo/redo snapshot, undo restores the state before the change, redo the state after it
  link: { type: 'undo' | 'redo'; index: number } | undefined;
  info: string[];
  // metadata of the log entry (time, campaign, server), html lines
  tooltip: string;
};

@Component({
  imports: [NgClass, SlicePipe, InViewportDirective, AutoscrollDirective, GhsLabelDirective, GhsTooltipDirective, TabClickDirective],
  selector: 'ghs-undo-dialog',
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.scss']
})
export class UndoDialogComponent implements OnInit {
  dialogRef = inject(DialogRef);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  undoOffset: number = 0;
  confirm: string = '';
  undoConfirm = '';
  rows: LogRow[] = [];
  limit: number = 50;
  more: boolean = false;
  allParties: boolean = false;
  multipleParties: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.dialogRef.overlayRef.hostElement.style.zIndex = '999';
    if (this.dialogRef.overlayRef.backdropElement) {
      this.dialogRef.overlayRef.backdropElement.style.zIndex = '999';
    }
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    const stateManager = gameManager.stateManager;
    const history = stateManager.history();
    const currentRevision = effectiveRevision(gameManager.game);
    this.undoOffset =
      stateManager.undos.length > 0 ? currentRevision - effectiveRevision(stateManager.undos[stateManager.undos.length - 1]) - 1 : 0;
    const party = gameManager.game.party ? gameManager.game.party.id : undefined;
    this.multipleParties =
      gameManager.game.parties.length > 1 || stateManager.log.some((entry) => entry.party !== undefined && entry.party !== party);

    const rows: LogRow[] = [];

    // redo stack above the current state, next redo directly above it
    for (let i = stateManager.redos.length - 1; i >= 0; i--) {
      rows.push(
        this.row(history.redo[i], { type: 'redo', index: i }, effectiveRevision(stateManager.redos[stateManager.redos.length - 1 - i]))
      );
    }

    rows.push({ current: true, revision: currentRevision, entry: undefined, link: undefined, info: [], tooltip: '' });

    // undo stack below the current state
    let oldestLinked = stateManager.log.length;
    for (let i = stateManager.undos.length - 1; i >= 0; i--) {
      const entry = history.undo[i];
      if (entry) {
        oldestLinked = Math.min(oldestLinked, stateManager.log.indexOf(entry));
      }
      rows.push(this.row(entry, { type: 'undo', index: i }, effectiveRevision(stateManager.undos[i])));
    }

    // older changes from the log, without undo snapshot (anymore)
    for (let index = oldestLinked - 1; index >= 0; index--) {
      const entry = stateManager.log[index];
      if (
        entry.type !== 'update' ||
        entry.info.length === 0 ||
        history.links.has(entry) ||
        history.undone.has(entry) ||
        (!this.allParties && entry.party !== undefined && entry.party !== party)
      ) {
        continue;
      }
      rows.push(this.row(entry, undefined, entry.revision));
    }

    const limit = Math.max(this.limit, stateManager.redos.length + 1);
    this.more = rows.length > limit;
    this.rows = rows.slice(0, limit);
  }

  private row(entry: LogEntry | undefined, link: { type: 'undo' | 'redo'; index: number } | undefined, revision: number): LogRow {
    return {
      current: false,
      revision,
      entry,
      link,
      info: gameManager.stateManager.displayInfo(entry),
      tooltip: entry ? this.tooltip(entry) : ''
    };
  }

  tooltip(entry: LogEntry): string {
    const lines: string[] = [];
    if (entry.timestamp) {
      lines.push(settingsManager.getLabel('state.log.time', [this.formatTime(entry.timestamp)]));
    }
    if (this.multipleParties && entry.party !== undefined) {
      lines.push(
        settingsManager.getLabel('state.log.party', [
          this.partyName(entry) + (entry.edition ? ' (%data.edition.' + entry.edition + '%)' : '')
        ])
      );
    }
    if (entry.server) {
      lines.push(settingsManager.getLabel('state.log.server'));
    }
    return lines.join('<br>');
  }

  private formatTime(timestamp: number): string {
    try {
      return formatDate(timestamp, 'medium', settingsManager.settings.locale, this.timeZone);
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  }

  partyName(entry: LogEntry): string {
    if (entry.party === undefined) {
      return '';
    }
    const party = gameManager.game.parties.find((party) => party.id === entry.party);
    return (party && party.name) || '%party% ' + entry.party;
  }

  toggleAllParties() {
    this.allParties = !this.allParties;
    this.update();
  }

  loadMore() {
    if (this.more) {
      this.limit += 50;
      this.update();
    }
  }

  disabled(row: LogRow): boolean {
    if (!row.link) {
      return true;
    }
    if (row.link.type === 'undo') {
      return !gameManager.stateManager.undoPermission || (!!this.undoOffset && gameManager.stateManager.gameOffsetWarning);
    }
    return !gameManager.stateManager.redoPermission;
  }

  isConfirm(row: LogRow): boolean {
    return !!row.link && this.undoConfirm === row.link.type + '-' + row.link.index;
  }

  select(row: LogRow) {
    if (!row.link || this.disabled(row)) {
      return;
    }
    const key = row.link.type + '-' + row.link.index;
    if (this.undoConfirm !== key) {
      this.undoConfirm = key;
    } else if (row.link.type === 'undo') {
      this.undoConfirm = '';
      gameManager.stateManager.fixedUndo(gameManager.stateManager.undos.length - row.link.index);
    } else {
      this.undoConfirm = '';
      gameManager.stateManager.fixedRedo(row.link.index + 1);
    }
  }

  cancelConfirm() {
    this.undoConfirm = '';
  }

  clear(type: 'clearUndos' | 'clearRedos' | 'clearLog') {
    if (this.confirm !== type) {
      this.confirm = type;
      return;
    }
    this.confirm = '';
    if (type === 'clearUndos') {
      gameManager.stateManager.clearUndos();
    } else if (type === 'clearRedos') {
      gameManager.stateManager.clearRedos();
    } else {
      gameManager.stateManager.clearLog();
    }
    this.update();
  }
}

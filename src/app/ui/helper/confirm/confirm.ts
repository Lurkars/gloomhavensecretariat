import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, HostListener, Inject } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ghsDialogClosingHelper } from '../Static';

@Component({
  standalone: false,
  selector: 'ghs-confirm-dialog',
  templateUrl: './confirm.html',
  styleUrls: ['./confirm.scss'],
})
export class ConfirmDialogComponent {

  label: string;
  args: (string | number | boolean)[]

  constructor(@Inject(DIALOG_DATA) data: { label: string, args: (string | number | boolean)[] | undefined }, private dialogRef: DialogRef) {
    if (!data.label) {
      this.dialogRef.close();
    }
    this.label = data.label;
    this.args = data.args || [];
  }

  cancel() {
    ghsDialogClosingHelper(this.dialogRef, false);
  }

  confirm() {
    ghsDialogClosingHelper(this.dialogRef, true);
  }

  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
      this.confirm();
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
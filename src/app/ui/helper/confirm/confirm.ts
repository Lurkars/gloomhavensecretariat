import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-confirm-dialog',
  templateUrl: './confirm.html',
  styleUrls: ['./confirm.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  private dialogRef = inject(DialogRef);

  label: string;
  args: (string | number | boolean)[];

  data: { label: string; args: (string | number | boolean)[] | undefined } = inject(DIALOG_DATA);

  constructor() {
    if (!this.data.label) {
      this.dialogRef.close();
    }
    this.label = this.data.label;
    this.args = this.data.args || [];
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

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, HostListener, inject } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

// hint to read calendar sections in the Section Book which are not available in data
@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-week-sections-hint-dialog',
  templateUrl: './week-sections-hint.html',
  styleUrls: ['./week-sections-hint.scss']
})
export class WeekSectionsHintDialogComponent {
  private dialogRef = inject(DialogRef);

  sections: string[] = inject(DIALOG_DATA) || [];

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
      this.close();
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventManualDistributionComponent } from 'src/app/ui/figures/entities-menu/event-manual-distribution/event-manual-distribution';
import { EventManualDistributionHelper } from 'src/app/ui/figures/entities-menu/helpers/event-manual-distribution';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  imports: [NgClass, EventManualDistributionComponent, GhsLabelDirective, TabClickDirective],
  selector: 'ghs-event-manual-distribution-dialog',
  templateUrl: './event-manual-distribution-dialog.html',
  styleUrls: ['./event-manual-distribution-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventManualDistributionDialogComponent {
  private dialogRef = inject(DialogRef);

  settingsManager: SettingsManager = settingsManager;
  private data = inject<{ helper: EventManualDistributionHelper; onApplied?: () => void }>(DIALOG_DATA);
  helper: EventManualDistributionHelper = this.data.helper;

  onApplied() {
    this.data.onApplied?.();
    ghsDialogClosingHelper(this.dialogRef);
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { TrialCardComponent } from 'src/app/ui/figures/trials/trial-card';

@Component({
  imports: [NgClass, TrialCardComponent],
  selector: 'ghs-trial-dialog',
  templateUrl: './trial-dialog.html',
  styleUrls: ['./trial-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrialDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  opened: boolean = false;

  data: { edition: string; trial: number } = inject(DIALOG_DATA);

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(
      () => {
        this.dialogRef.close();
      },
      settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
    );
  }
}

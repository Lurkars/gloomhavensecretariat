import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';
import { ChallengeCardComponent } from 'src/app/ui/figures/challenges/challenge-card';

@Component({
  imports: [NgClass, ChallengeCardComponent],
  selector: 'ghs-challenge-dialog',
  templateUrl: './challenge-dialog.html',
  styleUrls: ['./challenge-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeDialogComponent implements OnInit {
  opened: boolean = false;

  card: ChallengeCard = inject(DIALOG_DATA);

  constructor(private dialogRef: DialogRef) {}

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

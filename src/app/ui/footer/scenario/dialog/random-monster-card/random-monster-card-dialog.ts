import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { RandomMonsterCardComponent } from 'src/app/ui/footer/scenario/dialog/random-monster-card/random-monster-card';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, PointerInputDirective, RandomMonsterCardComponent],
  selector: 'ghs-random-monster-card-dialog',
  templateUrl: './random-monster-card-dialog.html',
  styleUrls: ['./random-monster-card-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RandomMonsterCardDialogComponent implements OnInit {
  opened: boolean = false;

  gameManager: GameManager = gameManager;

  section: ScenarioData = inject(DIALOG_DATA);

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

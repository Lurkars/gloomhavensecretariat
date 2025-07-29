import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';

@Component({
  standalone: false,
  selector: 'ghs-random-monster-card-dialog',
  templateUrl: './random-monster-card-dialog.html',
  styleUrls: ['./random-monster-card-dialog.scss'],
})
export class RandomMonsterCardDialogComponent implements OnInit {

  section: ScenarioData;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) section: ScenarioData, private dialogRef: DialogRef) {
    this.section = section;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      this.dialogRef.close();
    }, settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0);
  }
}
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, forwardRef, inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterRpgActionsComponent } from 'src/app/ui/figures/monster/cards/rpg-actions';

@Component({
  imports: [NgClass, forwardRef(() => MonsterRpgActionsComponent)],
  selector: 'ghs-monster-rpg-actions-dialog',
  templateUrl: './rpg-actions-dialog.html',
  styleUrls: ['./rpg-actions-dialog.scss']
})
export class MonsterRpgActionsDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  monster: Monster = inject(DIALOG_DATA);
  opened: boolean = false;

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => this.dialogRef.close(), settingsManager.settings.animations ? 150 * settingsManager.settings.animationSpeed : 0);
  }
}

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { PersonalQuestCardComponent } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-card';

@Component({
  imports: [NgClass, PersonalQuestCardComponent],
  selector: 'ghs-personal-quest-view-dialog',
  templateUrl: './personal-quest-view-dialog.html',
  styleUrls: ['./personal-quest-view-dialog.scss']
})
export class PersonalQuestViewDialog implements OnInit {
  private dialogRef = inject(DialogRef);

  personalQuest: PersonalQuest = inject(DIALOG_DATA);

  opened: boolean = false;

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

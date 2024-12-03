import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';

@Component({
	standalone: false,
  selector: 'ghs-ability-dialog',
  templateUrl: './ability-dialog.html',
  styleUrls: ['./ability-dialog.scss'],
})
export class AbilityDialogComponent implements OnInit {

  ability: Ability;
  monster: Monster | undefined;
  character: Character | undefined;
  relative: boolean;
  interactiveAbilities: boolean;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) data: { ability: Ability, monster: Monster, character: Character, relative: boolean, interactive: boolean }, private dialogRef: DialogRef) {
    this.ability = data.ability;
    this.monster = data.monster || undefined;
    this.character = data.character || undefined;
    this.relative = data.relative;
    this.interactiveAbilities = data.interactive;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      this.dialogRef.close();
    }, settingsManager.settings.animations ? 1000 : 0);
  }
}
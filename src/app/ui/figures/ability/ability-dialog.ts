import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityComponent } from 'src/app/ui/figures/ability/ability';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, PointerInputDirective, AbilityComponent],
  selector: 'ghs-ability-dialog',
  templateUrl: './ability-dialog.html',
  styleUrls: ['./ability-dialog.scss']
})
export class AbilityDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  ability: Ability | undefined;
  secondAbility: Ability | undefined;
  monster: Monster | undefined;
  character: Character | undefined;
  relative: boolean;
  interactiveAbilities: boolean;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  data: { ability: Ability | undefined; monster: undefined; character: Character | undefined; relative: boolean; interactive: boolean } =
    inject(DIALOG_DATA);

  constructor() {
    this.ability = this.data.ability;
    this.monster = this.data.monster || undefined;
    this.character = this.data.character || undefined;
    this.relative = this.data.relative;
    this.interactiveAbilities = this.data.interactive;

    if (!!this.monster && !this.ability) {
      this.ability = gameManager.monsterManager.getAbility(this.monster);
      if (gameManager.monsterManager.hasBottomActions(this.monster)) {
        this.secondAbility = this.ability;
        this.ability = gameManager.monsterManager.getAbility(this.monster, true);
      }
    }

    if (!this.ability) {
      this.dialogRef.close();
    }
  }

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

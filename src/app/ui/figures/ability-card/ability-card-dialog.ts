import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, PointerInputDirective, AbilityCardComponent],
  selector: 'ghs-ability-card-dialog',
  templateUrl: './ability-card-dialog.html',
  styleUrls: ['./ability-card-dialog.scss']
})
export class AbilityCardDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  abilityCard: AbilityCard | undefined;
  secondAbilityCard: AbilityCard | undefined;
  monster: Monster | undefined;
  character: Character | undefined;
  relative: boolean;
  interactiveAbilities: boolean;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  data: {
    abilityCard: AbilityCard | undefined;
    monster: undefined;
    character: Character | undefined;
    relative: boolean;
    interactive: boolean;
  } = inject(DIALOG_DATA);

  constructor() {
    this.abilityCard = this.data.abilityCard;
    this.monster = this.data.monster || undefined;
    this.character = this.data.character || undefined;
    this.relative = this.data.relative;
    this.interactiveAbilities = this.data.interactive;

    if (!!this.monster && !this.abilityCard) {
      this.abilityCard = gameManager.monsterManager.getAbilityCard(this.monster);
      if (gameManager.monsterManager.hasBottomActions(this.monster)) {
        this.secondAbilityCard = this.abilityCard;
        this.abilityCard = gameManager.monsterManager.getAbilityCard(this.monster, true);
      }
    }

    if (!this.abilityCard) {
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

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-additional-am-select-dialog',
  templateUrl: './additional-am-select.html',
  styleUrls: ['./additional-am-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdditionalAMSelectDialogComponent {
  dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;
  selected: number = 0;
  characters: Character[];
  type: AttackModifierType;

  data: { characters: Character[]; type: AttackModifierType } = inject(DIALOG_DATA);

  constructor() {
    this.characters = this.data.characters;
    this.type = this.data.type;
  }

  toggleSelect(index: number) {
    if (this.selected === index) {
      this.selected = -1;
    } else {
      this.selected = index;
    }
  }

  close(result: number | undefined = undefined) {
    ghsDialogClosingHelper(this.dialogRef, result);
  }
}

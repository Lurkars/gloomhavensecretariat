import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Loot } from 'src/app/game/model/data/Loot';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-loot-apply-dialog',
  templateUrl: './loot-apply-dialog.html',
  styleUrls: ['./loot-apply-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LootApplyDialogComponent {
  gameManager: GameManager = gameManager;
  characters: Character[] = [];
  selected: string;
  edition: string;
  loot: Loot;
  lootValue: string;
  edit: boolean = false;

  data: { loot: Loot; selected: string | undefined; edit: boolean } = inject(DIALOG_DATA);

  constructor(public dialogRef: DialogRef) {
    this.loot = this.data.loot;
    this.lootValue = '' + gameManager.lootManager.getValue(this.loot);
    this.selected = this.data.selected || '';
    this.edit = this.data.edit || false;
    this.characters = gameManager.game.figures
      .filter((figure) => figure instanceof Character && !figure.absent && gameManager.entityManager.isAlive(figure))
      .map((figure) => figure as Character);
    this.edition = this.characters.find((character) => character.name == this.selected)?.edition || '';
  }

  toggleSelect(name: string) {
    if (this.selected == name) {
      this.selected = '';
      if (this.data.selected) {
        this.edition = this.characters.find((character) => character.name == this.data.selected)?.edition || '';
      }
    } else {
      this.selected = name;
      this.edition = this.characters.find((character) => character.name == this.selected)?.edition || '';
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef, this.selected);
  }
}

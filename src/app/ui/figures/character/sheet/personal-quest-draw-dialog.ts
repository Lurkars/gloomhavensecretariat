import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { PersonalQuestCardComponent } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-card';
import { PersonalQuestViewDialog } from 'src/app/ui/figures/character/sheet/personal-quest-card/personal-quest-view-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [GhsLabelDirective, GhsTooltipDirective, NgClass, PointerInputDirective, PersonalQuestCardComponent],
  selector: 'ghs-personal-quest-draw-dialog',
  templateUrl: 'personal-quest-draw-dialog.html',
  styleUrls: ['./personal-quest-draw-dialog.scss']
})
export class PersonalQuestDrawDialog {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  character: Character = inject(DIALOG_DATA);
  drawnCards: PersonalQuest[] = [];
  selected: number = -1;

  constructor() {
    this.draw();
  }

  draw() {
    const pool = gameManager.personalQuestManager.availablePersonalQuests(this.character.edition);
    const drawn: PersonalQuest[] = [];
    for (let i = 0; i < 2 && pool.length > 0; i++) {
      const index = Math.floor(Math.random() * pool.length);
      drawn.push(pool.splice(index, 1)[0]);
    }
    this.drawnCards = drawn.sort((a, b) =>
      a.altId && b.altId
        ? a.altId.localeCompare(b.altId, undefined, { numeric: true })
        : a.cardId.localeCompare(b.cardId, undefined, { numeric: true })
    );
    this.selected = -1;
  }

  select(index: number) {
    this.selected = this.selected === index ? -1 : index;
  }

  show(personalQuest: PersonalQuest) {
    this.dialog.open(PersonalQuestViewDialog, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: personalQuest
    });
  }

  chooseSelected() {
    if (this.selected !== -1) {
      ghsDialogClosingHelper(this.dialogRef, this.drawnCards[this.selected].cardId);
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

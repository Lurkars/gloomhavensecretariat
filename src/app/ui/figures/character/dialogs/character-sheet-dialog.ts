import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, ViewChild } from "@angular/core";
import { Character } from "src/app/game/model/Character";
import { CharacterSheetComponent } from "../sheet/character-sheet";


@Component({
  selector: 'ghs-character-sheet-dialog',
  templateUrl: 'character-sheet-dialog.html',
  styleUrls: ['./character-sheet-dialog.scss']
})
export class CharacterSheetDialog {

  @ViewChild('characterSheet') characterSheet!: CharacterSheetComponent;

  constructor(@Inject(DIALOG_DATA) public data: { character: Character, viewOnly: boolean, forceEdit: boolean }, public dialogRef: DialogRef) {

    this.dialogRef.closed.subscribe({
      next: () => {
        this.characterSheet.applyValues();
      }
    });
  }
}
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterSheetComponent } from 'src/app/ui/figures/character/sheet/character-sheet';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsTooltipDirective, PointerInputDirective, CharacterSheetComponent],
  selector: 'ghs-character-sheet-dialog',
  templateUrl: 'character-sheet-dialog.html',
  styleUrls: ['./character-sheet-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterSheetDialog {
  dialogRef = inject(DialogRef);

  @ViewChild('characterSheet') characterSheet!: CharacterSheetComponent;

  settingsManager: SettingsManager = settingsManager;

  data: { character: Character; viewOnly: boolean; forceEdit: boolean } = inject(DIALOG_DATA);

  constructor() {
    this.dialogRef.closed.subscribe({
      next: () => {
        this.characterSheet.applyValues();
      }
    });
  }
}

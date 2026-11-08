import { DialogRef } from '@angular/cdk/dialog';
import { Directive, input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Directive()
export abstract class CharacterSheetSection {
  readonly inputCharacter = input.required<Character>({ alias: 'character' });
  get character(): Character {
    return this.inputCharacter();
  }

  readonly editable = input<boolean>(true);
  readonly forceEdit = input<boolean>(false);
  readonly dialogRef = input<DialogRef>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  get characterName(): string {
    return gameManager.characterManager.characterName(this.character, true, true);
  }

  get locked(): boolean {
    return (!this.forceEdit() && !this.editable()) || settingsManager.settings.characterSheetLocked;
  }

  closeDialog() {
    const dialogRef = this.dialogRef();
    if (dialogRef) {
      ghsDialogClosingHelper(dialogRef);
    }
  }
}

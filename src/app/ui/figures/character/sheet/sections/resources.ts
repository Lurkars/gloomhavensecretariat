import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { herbResourceLootTypes, LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { CharacterMoveResourcesDialog } from 'src/app/ui/figures/character/sheet/move-resources';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective],
  selector: 'ghs-character-sheet-resources',
  templateUrl: 'resources.html',
  styleUrls: ['../../../sheet.scss', './resources.scss']
})
export class CharacterSheetResourcesComponent extends CharacterSheetSection {
  private dialog = inject(Dialog);

  resourceGroups: { name: string; types: LootType[] }[] = [
    { name: 'materials', types: materialResourceLootTypes },
    { name: 'herbs', types: herbResourceLootTypes }
  ];

  setResource(type: LootType, event: any) {
    const value = Math.max(0, Math.floor(+event.target.value));
    if (!settingsManager.settings.fhShareResources && gameManager.characterManager.canSetResource(type, value)) {
      event.target.value = value;
      gameManager.stateManager.before('setResource', this.characterName, 'game.loot.' + type, value);
      gameManager.characterManager.setResource(this.character, type, value);
      gameManager.stateManager.after();
    }
  }

  moveResources() {
    if (settingsManager.settings.fhShareResources) {
      const dialogRef = this.dialogRef();
      if (dialogRef) {
        dialogRef.close();
      }
      this.dialog.open(PartySheetDialogComponent, {
        panelClass: ['dialog-invert']
      });
    } else {
      this.dialog.open(CharacterMoveResourcesDialog, {
        panelClass: ['dialog'],
        data: { character: this.character }
      });
    }
  }
}

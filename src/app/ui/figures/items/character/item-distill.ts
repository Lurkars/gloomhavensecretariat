import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, ItemComponent],
  selector: 'ghs-item-distill-dialog',
  templateUrl: './item-distill.html',
  styleUrls: ['./item-distill.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDistillDialogComponent {
  private dialogRef = inject(DialogRef);

  availableResources: LootType[] = [];
  selectedResource: LootType | undefined;
  character: Character;
  item: ItemData;

  data: { character: Character; item: ItemData } = inject(DIALOG_DATA);

  constructor() {
    this.character = this.data.character;
    this.item = this.data.item;
    if (!gameManager.itemManager.canDistill(this.item)) {
      this.dialogRef.close();
    } else if (this.item.resourcesAny && this.item.resourcesAny.length) {
      this.availableResources = herbResourceLootTypes;
    } else {
      this.availableResources = Object.keys(this.item.resources).map((resource) => resource as LootType);
    }
  }

  toggleSelected(resource: LootType) {
    if (this.selectedResource == resource) {
      this.selectedResource = undefined;
    } else {
      this.selectedResource = resource;
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  distill() {
    if (this.selectedResource) {
      gameManager.stateManager.before(
        'distillItem',
        gameManager.characterManager.characterName(this.character, true, true),
        this.item.id,
        this.item.edition
      );
      gameManager.itemManager.removeItem(this.item, this.character);
      this.character.progress.loot[this.selectedResource] = (this.character.progress.loot[this.selectedResource] || 0) + 1;
      gameManager.stateManager.after();
      ghsDialogClosingHelper(this.dialogRef);
    }
  }
}

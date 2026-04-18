import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, TrackUUIDPipe, ItemComponent],
  selector: 'ghs-item-share-dialog',
  templateUrl: './item-share.html',
  styleUrls: ['./item-share.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemShareDialogComponent {
  private dialogRef = inject(DialogRef);

  character: Character;
  characters: Character[] = [];
  selected: Character | undefined;
  item: ItemData;

  gameManager: GameManager = gameManager;

  data: { character: Character; item: ItemData } = inject(DIALOG_DATA);

  constructor() {
    this.character = this.data.character;
    this.item = this.data.item;
    this.characters = gameManager.game.figures
      .filter((figure) => figure instanceof Character && figure != this.character && !gameManager.itemManager.owned(this.item, figure))
      .map((figure) => figure as Character);
    if (!this.characters.length) {
      this.dialogRef.close();
    }
  }

  toggleSelected(character: Character) {
    if (this.selected == character) {
      this.selected = undefined;
    } else {
      this.selected = character;
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  apply() {
    if (this.selected) {
      gameManager.stateManager.before(
        'shareItem',
        gameManager.characterManager.characterName(this.character, true, true),
        gameManager.characterManager.characterName(this.selected, true, true),
        this.item.id,
        this.item.edition
      );
      gameManager.itemManager.removeItem(this.item, this.character);
      gameManager.itemManager.addItem(this.item, this.selected);
      gameManager.stateManager.after();
      ghsDialogClosingHelper(this.dialogRef);
    }
  }
}

import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { GameState } from 'src/app/game/model/Game';
import { CharacterItemComponent } from 'src/app/ui/figures/items/character/item-character';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    FormsModule,
    GhsLabelDirective,
    GhsTooltipDirective,
    forwardRef(() => PointerInputDirective),
    TrackUUIDPipe,
    CharacterItemComponent
  ],
  selector: 'ghs-items-character-dialog',
  templateUrl: './items-character-dialog.html',
  styleUrls: ['./items-character-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsCharacterDialogComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  setup: boolean = false;
  onlyEquipped: boolean = false;
  items: ItemData[] = [];
  ItemFlags = ItemFlags;
  GameState = GameState;

  character: Character = inject(DIALOG_DATA);

  constructor() {
    this.setup = gameManager.game.state === GameState.draw && gameManager.roundManager.firstRound;
    this.onlyEquipped = !this.setup;
    this.update();
  }

  sortItemData(a: ItemData, b: ItemData) {
    if (!this.setup) {
      if (this.equipped(a) && !this.equipped(b)) {
        return -1;
      } else if (this.equipped(b) && !this.equipped(a)) {
        return 1;
      }
    }

    if (a.slot && !b.slot) {
      return -1;
    } else if (b.slot && !a.slot) {
      return 1;
    }

    if (a.slot && b.slot) {
      return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
    }

    return 0;
  }

  update() {
    this.items = gameManager.bbRules()
      ? gameManager.itemManager.getItems('bb')
      : this.character.progress.items
          .map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true))
          .filter((itemData) => itemData)
          .map((itemData) => itemData as ItemData)
          .sort((a, b) => this.sortItemData(a, b));

    if (this.onlyEquipped) {
      this.items = this.items.filter((itemData) => this.equipped(itemData));
    }
  }

  equipped(itemData: ItemData): AdditionalIdentifier | undefined {
    return this.character.progress.equippedItems.find(
      (identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition
    );
  }

  countFlag(itemData: ItemData, flag: string): number {
    const equipped = this.equipped(itemData);
    if (equipped) {
      return (equipped.tags && equipped.tags.filter((tag) => tag === flag).length) || 0;
    }
    return 0;
  }

  openShop() {
    this.dialogRef.close();
    this.dialog.open(ItemsDialogComponent, {
      panelClass: ['dialog'],
      data: { edition: gameManager.game.edition, select: this.character, affordable: true }
    });
  }

  openItemDialog(item: ItemData) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      data: { item: item, character: this.character, setup: this.setup }
    });
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { LootComponent } from 'src/app/ui/figures/loot/loot-card';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, TrackUUIDPipe, LootComponent],
  selector: 'ghs-character-loot-cards',
  templateUrl: 'loot-cards.html',
  styleUrls: ['./loot-cards.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterLootCardsDialog {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  lootCards: Loot[] = [];
  sorted: boolean = false;

  character: Character = inject(DIALOG_DATA);

  constructor() {
    if (this.character.lootCards) {
      this.character.lootCards.forEach((index) => this.lootCards.push(gameManager.game.lootDeck.cards[index]));
    }
  }

  sort() {
    if (this.sorted) {
      this.sorted = false;
      this.lootCards = [];
      if (this.character.lootCards) {
        this.character.lootCards.forEach((index) => this.lootCards.push(gameManager.game.lootDeck.cards[index]));
      }
    } else {
      this.sorted = true;
      this.lootCards.sort((a, b) => a.cardId - b.cardId);
    }
  }

  randomItem(loot: Loot): ItemData | undefined {
    if (loot.type === LootType.random_item) {
      const itemIdentifier = this.character.progress.equippedItems.find((value) => value.marker === 'loot-random-item');
      if (itemIdentifier) {
        const itemData = gameManager.itemManager.getItem(itemIdentifier.name, itemIdentifier.edition, true);
        return itemData;
      }
    }
    return undefined;
  }

  randomItemDialog(loot: Loot) {
    const itemData = this.randomItem(loot);
    if (itemData) {
      this.dialog.open(ItemDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: { item: itemData }
      });
    }
  }
}

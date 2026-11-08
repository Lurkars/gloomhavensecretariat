import { NgClass } from '@angular/common';
import { Component, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-party-campaign-items',
  templateUrl: 'campaign-items.html',
  styleUrls: ['../../../sheet.scss', './campaign-items.scss']
})
export class PartyCampaignItemsComponent extends PartySheetSection {
  readonly itemIndex = viewChild.required<ElementRef>('itemIndex');

  items: ItemData[] = [];
  itemIdentifier: CountIdentifier[] = [];
  itemEdition: string = '';
  lastEdition: string | undefined;

  override update(): void {
    if (this.lastEdition !== this.edition()) {
      this.lastEdition = this.edition();
      this.itemEdition = this.edition();
    }

    this.itemIdentifier = this.party.unlockedItems
      .filter((identifier) => !this.itemEdition || identifier.edition === this.itemEdition)
      .sort((a, b) => {
        if (!this.edition() && a.edition !== b.edition) {
          return gameManager.editions().indexOf(a.edition) - gameManager.editions().indexOf(b.edition);
        }

        return +a.name - +b.name;
      });

    this.items = this.itemIdentifier
      .map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true))
      .filter((i) => !!i);
  }

  addItem(indexElement: HTMLInputElement, edition: string) {
    const itemId: string = indexElement.value;
    if (itemId && edition) {
      if (this.hasItem(itemId, edition)) {
        indexElement.classList.add('warning');
      } else {
        indexElement.classList.add('error');
        const itemData = gameManager.itemManager.getItems(edition, true).find((itemData) => itemId === '' + itemData.id);
        if (itemData) {
          gameManager.stateManager.before('addUnlockedItem', edition, itemId, itemData.name);
          this.party.unlockedItems = this.party.unlockedItems || [];
          this.party.unlockedItems.push(new CountIdentifier(itemId, edition));
          this.itemIndex().nativeElement.value = '';
          indexElement.classList.remove('error');
          gameManager.stateManager.after();
          this.update();
        }
      }
    }
  }
  hasItem(item: string, edition: string): boolean {
    return (
      this.party.unlockedItems && this.party.unlockedItems.some((identifier) => identifier.name === item && identifier.edition === edition)
    );
  }
  removeItem(item: ItemData) {
    const identifier = this.party.unlockedItems.find(
      (identifier) => identifier.name === '' + item.id && identifier.edition === item.edition
    );
    if (identifier) {
      gameManager.stateManager.before('removeUnlockedItem', item.edition, item.id, item.name);
      this.party.unlockedItems.splice(this.party.unlockedItems.indexOf(identifier), 1);
      gameManager.stateManager.after();
      this.update();
    }
  }
  openItem(item: ItemData) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { item: item }
    });
  }
  incItemCount(item: ItemData, itemIdentifier: CountIdentifier) {
    gameManager.stateManager.before('updateUnlockedItemCount', item.edition, item.id, item.name);
    if (itemIdentifier.count < 0) {
      itemIdentifier.count = 1;
    } else {
      itemIdentifier.count += 1;
      if (itemIdentifier.count >= item.count) {
        itemIdentifier.count = -1;
      }
    }
    gameManager.stateManager.after();
  }
}

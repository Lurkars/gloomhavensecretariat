import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, HeaderComponent, ItemComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-items-cards-tool',
  templateUrl: './items-cards-tool.html',
  styleUrls: ['./items-cards-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsCardsToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  items: ItemData[] = [];
  edition: string | undefined;
  comparisonEdition: string | undefined;
  comparisonAItem: ItemData[] = [];
  comparisonBItem: ItemData[] = [];
  filter: string = '';

  private destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        let update = false;
        if (queryParams['e']) {
          this.edition = queryParams['e'];
          if (this.edition && !gameManager.editions(true).includes(this.edition)) {
            this.edition = undefined;
          }
          update = true;
        }
        if (queryParams['c']) {
          this.comparisonEdition = queryParams['c'];
          if (this.comparisonEdition && !gameManager.editions(true).includes(this.comparisonEdition)) {
            this.comparisonEdition = undefined;
          }
          update = true;
        }

        if (queryParams['f']) {
          this.filter = queryParams['f'];
          update = true;
        }

        if (update) {
          this.update();
        }
      }
    });
  }

  update() {
    this.items = [];
    if (this.edition) {
      this.items = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => this.applyFilter(itemData));
    }

    if (this.edition && this.comparisonEdition) {
      this.comparisonAItem = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => this.applyFilter(itemData));
      this.comparisonBItem = gameManager.itemManager
        .getItems(this.comparisonEdition, true)
        .filter((itemData) => this.applyFilter(itemData));

      this.items = [...this.comparisonAItem, ...this.comparisonBItem]
        .filter(
          (item) =>
            this.comparisonAItem.find((other) => other.name.replaceAll('Minor ', '') == item.name.replaceAll('Minor ', '')) != undefined &&
            this.comparisonBItem.find((other) => other.name.replaceAll('Minor ', '') == item.name.replaceAll('Minor ', '')) != undefined
        )
        .sort((a, b) => (a.name.replaceAll('Minor ', '') < b.name.replaceAll('Minor ', '') ? -1 : 1));
    }
  }

  applyFilter(itemData: ItemData): boolean {
    return (
      !this.filter ||
      ('' + itemData.id).includes(this.filter) ||
      itemData.name.toLowerCase().includes(this.filter.toLowerCase()) ||
      settingsManager
        .getLabel('data.items.' + itemData.edition + '-' + itemData.id)
        .toLowerCase()
        .includes(this.filter.toLowerCase())
    );
  }

  updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { e: this.edition || undefined, c: this.comparisonEdition || undefined, f: this.filter || undefined },
      queryParamsHandling: 'merge'
    });
  }
}

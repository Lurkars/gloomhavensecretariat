import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ItemData } from "src/app/game/model/data/ItemData";
import { environment } from "src/environments/environment";

@Component({
  standalone: false,
  selector: 'ghs-items-cards-tool',
  templateUrl: './items-cards-tool.html',
  styleUrls: ['./items-cards-tool.scss']
})
export class ItemsCardsToolComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  items: ItemData[] = [];
  edition: string | undefined;
  comparisonEdition: string | undefined;
  comparisonAItem: ItemData[] = [];
  comparisonBItem: ItemData[] = [];
  filter: string = "";

  constructor(private route: ActivatedRoute, private router: Router) { }

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.subscribe({
      next: (queryParams) => {
        let update = false;
        if (queryParams['e']) {
          this.edition = queryParams['e'];
          if (this.edition && !gameManager.editions(true).includes(this.edition)) {
            this.edition == undefined;
          }
          update = true;
        }
        if (queryParams['c']) {
          this.comparisonEdition = queryParams['c'];
          if (this.comparisonEdition && !gameManager.editions(true).includes(this.comparisonEdition)) {
            this.comparisonEdition == undefined;
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
    })
  }


  update() {
    this.items = [];
    if (this.edition) {
      this.items = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => this.applyFilter(itemData));
    }

    if (this.edition && this.comparisonEdition) {
      this.comparisonAItem = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => this.applyFilter(itemData));
      this.comparisonBItem = gameManager.itemManager.getItems(this.comparisonEdition, true).filter((itemData) => this.applyFilter(itemData));

      this.items = [...this.comparisonAItem, ...this.comparisonBItem].filter((item) => this.comparisonAItem.find((other) => other.name.replaceAll('Minor ', '') == item.name.replaceAll('Minor ', '')) != undefined && this.comparisonBItem.find((other) => other.name.replaceAll('Minor ', '') == item.name.replaceAll('Minor ', '')) != undefined).sort((a, b) => a.name.replaceAll('Minor ', '') < b.name.replaceAll('Minor ', '') ? -1 : 1);
    }
  }

  applyFilter(itemData: ItemData): boolean {
    return !this.filter || ('' + itemData.id).includes(this.filter) || itemData.name.toLowerCase().includes(this.filter.toLowerCase()) || settingsManager.getLabel('data.items.' + itemData.edition + '-' + itemData.id).toLowerCase().includes(this.filter.toLowerCase());
  }

  updateQueryParams() {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { e: this.edition || undefined, c: this.comparisonEdition || undefined, f: this.filter || undefined },
        queryParamsHandling: 'merge'
      });
  }

}

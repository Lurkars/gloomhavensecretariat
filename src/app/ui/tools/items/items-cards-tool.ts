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
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition == undefined;
          }
          update = true;
        }

        if (queryParams['filter']) {
          this.filter = queryParams['filter'];
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
      this.items = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => !this.filter || ('' + itemData.id).includes(this.filter));
    }
  }

  updateQueryParams() {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined, filter: this.filter || undefined },
        queryParamsHandling: 'merge'
      });
  }

}

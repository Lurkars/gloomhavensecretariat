import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { environment } from "src/environments/environment";
import { EventCard } from "src/app/game/model/data/EventCard";

@Component({
	standalone: false,
  selector: 'ghs-event-cards-tool',
  templateUrl: './event-cards-tool.html',
  styleUrls: ['./event-cards-tool.scss']
})
export class EventCardsToolComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  events: EventCard[] = [];
  edition: string | undefined;
  type: string = "";
  selected: number = -1;

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
          if (this.edition && gameManager.editions(true).indexOf(this.edition) == -1) {
            this.edition == undefined;
          }
          update = true;
        }
        if (queryParams['type']) {
          this.type = typeof queryParams['type'] === 'string' ? [queryParams['type']] : queryParams['type'];
          update = true;
        }
        if (queryParams['selected']) {
          this.selected = typeof queryParams['selected'] === 'string' ? [queryParams['selected']] : queryParams['selected'];
        }
        if (update) {
          this.update();
        }
      }
    })
  }

  update() {
    this.events = [];
    if (this.edition) {
      this.events = gameManager.eventCardManager.getEventCardsForEdition(this.type, this.edition);
    }
  }

  updateQueryParams() {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined, type: this.type || undefined, selected: this.selected || undefined },
        queryParamsHandling: 'merge'
      });
  }

}

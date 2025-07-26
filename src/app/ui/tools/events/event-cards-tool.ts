import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard } from "src/app/game/model/data/EventCard";
import { environment } from "src/environments/environment";

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
  types: string[] = [];
  type: string = "";
  selected: number = -1;
  iterator: number = -1;
  spoiler: boolean = false;
  debug: boolean = true;

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
          this.type = queryParams['type'];
          update = true;
        }
        if (queryParams['selected'] != undefined) {
          this.selected = +queryParams['selected'];
        }
        if (queryParams['iterator']) {
          this.iterator = +queryParams['iterator'];
        }
        if (update) {
          this.update();
        }
      }
    })
  }

  changeIterator(value: number) {
    this.iterator += value;
    this.update();
    this.updateQueryParams();
  }

  update() {
    this.events = [];
    if (this.edition) {
      this.types = gameManager.eventCardManager.getEventTypesForEdition(this.edition, false);
      if (!this.type || this.types.indexOf(this.type) == -1) {
        this.type = this.types[0];
      }
      this.events = gameManager.eventCardManager.getEventCardsForEdition(this.edition, this.type, false).filter((e, i) => this.iterator == -1 || this.iterator == i);
    }
  }

  updateQueryParams() {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined, type: this.type || undefined, selected: this.selected, iterator: this.iterator != -1 ? this.iterator : undefined },
        queryParamsHandling: 'merge'
      });
  }

}

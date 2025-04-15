import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { environment } from "src/environments/environment";

@Component({
  standalone: false,
  selector: 'ghs-random-monster-cards-tool',
  templateUrl: './random-monster-cards-tool.html',
  styleUrls: ['./random-monster-cards-tool.scss']
})
export class RandomMonsterCardsToolComponent implements OnInit {

  gameManager: GameManager = gameManager;
  sections: ScenarioData[] = [];
  edition: string | undefined;

  constructor(private route: ActivatedRoute, private router: Router) { }

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(true).indexOf(this.edition) == -1) {
            this.edition == undefined;
          }
          this.update();
        }
      }
    })
  }

  update() {
    this.sections = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
    if (editionData && editionData.sections) {
      this.sections = editionData.sections.filter((sectionData) => sectionData.group == 'randomMonsterCard').sort((a, b) => a.name < b.name ? -1 : 1);
    }

  }

  updateQueryParams() {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined },
        queryParamsHandling: 'merge'
      });
  }

}

import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { TreasureData } from "src/app/game/model/data/RoomData";
import { environment } from "src/environments/environment";

@Component({
	standalone: false,
  selector: 'ghs-treasures-tool',
  templateUrl: './treasures-tool.html',
  styleUrls: ['./treasures-tool.scss']
})
export class TreasuresToolComponent implements OnInit {

  gameManager: GameManager = gameManager;
  treasures: TreasureData[] = [];
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
    this.treasures = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
    if (editionData && editionData.treasures) {
      editionData.treasures.forEach((treasureString, index) => {
        this.treasures.push(new TreasureData(treasureString, index + 1 + (editionData.treasureOffset || 0)));
      })
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

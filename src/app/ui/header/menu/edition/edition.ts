import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-edition-menu',
  templateUrl: 'edition.html',
  styleUrls: ['../menu.scss', './edition.scss']
})
export class EditionMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  async setEdition(edition: string | undefined = undefined) {
    await gameManager.stateManager.before("setEdition", "data.edition." + edition);
    if (edition == 'fh') {
      settingsManager.setFhStyle(true);
    } else {
      settingsManager.setFhStyle(false);
    }
    gameManager.game.edition = edition;
    await gameManager.stateManager.after();
  }

  async toggleCampaignMode() {
    await gameManager.stateManager.before(gameManager.game.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
    gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
    await gameManager.stateManager.after();
  }
}
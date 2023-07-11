import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";

@Component({
  selector: 'ghs-edition-menu',
  templateUrl: 'edition.html',
  styleUrls: ['../menu.scss', './edition.scss']
})
export class EditionMenuComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  conditions: Condition[] = [];
  editionConditions: ConditionName[] = [];

  ngOnInit(): void {
    this.conditions = Object.values(ConditionName).map((name) => new Condition(name)).filter((condition) => condition.types.indexOf(ConditionType.hidden) == -1);
    this.editionConditions = gameManager.conditions(gameManager.game.edition, true).map((condition) => condition.name);
  }

  setEdition(edition: string | undefined = undefined) {
    gameManager.stateManager.before("setEdition", "data.edition." + edition);
    if (edition == 'fh') {
      settingsManager.setFhStyle(true);
    } else {
      settingsManager.setFhStyle(false);
    }
    gameManager.game.edition = edition;
    this.editionConditions = gameManager.conditions(gameManager.game.edition, true).map((condition) => condition.name);
    gameManager.stateManager.after();
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(gameManager.game.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
    gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
    gameManager.stateManager.after();
  }

  toggleCondition(condition: ConditionName) {
    gameManager.stateManager.before(gameManager.game.conditions.indexOf(condition) == -1 ? 'addGameCondition' : 'removeGameCondition', condition);
    if (gameManager.game.conditions.indexOf(condition) == -1) {
      gameManager.game.conditions.push(condition);
    } else {
      gameManager.game.conditions = gameManager.game.conditions.filter((conditionName) => condition != conditionName);
    }
    gameManager.stateManager.after();
  }
}
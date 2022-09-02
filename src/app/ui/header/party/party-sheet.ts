import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { GameScenarioModel, ScenarioData } from "src/app/game/model/data/ScenarioData";

import { Party } from "src/app/game/model/Party";

import { PopupComponent } from "src/app/ui/popup/popup";

@Component({
  selector: 'ghs-party-sheet',
  templateUrl: 'party-sheet.html',
  styleUrls: [ '../../popup/popup.scss', './party-sheet.scss' ]
})
export class PartySheetDialog extends PopupComponent {

  gameManager: GameManager = gameManager;
  party: Party = new Party();
  prosperitySteps = [ 3, 8, 14, 21, 29, 38, 49, 63 ];
  priceModifier: number = 0;
  campaign: boolean = false;

  scenarioEditions: string[] = [];
  scenarios: Record<string, ScenarioData[]> = {};

  constructor() {
    super();
    gameManager.uiChange.subscribe({
      next: () => {
        this.party = gameManager.game.party;
        if (this.party.reputation >= 0) {
          this.priceModifier = Math.ceil((this.party.reputation - 2) / 4) * -1;
        } else {
          this.priceModifier = Math.floor((this.party.reputation + 2) / 4) * -1;
        }
      }
    })
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(this.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
    this.party.campaignMode = !this.party.campaignMode;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
    this.updateScenarios();
  }

  setName(event: any) {
    if (this.party.name != event.target.value) {
      gameManager.stateManager.before("setPartyName", event.target.value);
      this.party.name = event.target.value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setLocation(event: any) {
    if (this.party.location != event.target.value) {
      gameManager.stateManager.before("setPartyLocation", event.target.value);;
      this.party.location = event.target.value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setNotes(event: any) {
    if (this.party.notes != event.target.value) {
      gameManager.stateManager.before("setPartyNotes", event.target.value);
      this.party.notes = event.target.value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setAchievements(event: any) {
    if (this.party.achievements != event.target.value) {
      gameManager.stateManager.before("setPartyAchievements", event.target.value);
      this.party.achievements = event.target.value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setGlobalAchievements(event: any) {
    if (this.party.globalAchievements != event.target.value) {
      gameManager.stateManager.before("setGlobalAchievements", event.target.value);
      this.party.globalAchievements = event.target.value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setReputation(value: number) {
    if (this.party.reputation != value) {
      gameManager.stateManager.before("setPartyReputation", "" + value);
      if (value > 20) {
        value = 20
      } else if (value < -20) {
        value = -20;
      }
      this.party.reputation = value;
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  setProsperity(value: number) {
    if (this.party.prosperity != value) {
      gameManager.stateManager.before("setPartyProsperity", "" + value);
      if (value > 64) {
        value = 64
      } else if (value < 0) {
        value = 0;
      }
      if (this.party.prosperity == value) {
        this.party.prosperity--;
      } else {
        this.party.prosperity = value;
      }
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
  }

  exportParty() {
    const downloadButton = document.createElement('a');
    downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.party)));
    downloadButton.setAttribute('download', (this.party.name ? this.party.name + "_" : "") + "party-sheet.json");
    document.body.appendChild(downloadButton);
    downloadButton.click();
    document.body.removeChild(downloadButton);
  }

  importParty(event: any) {
    const parent = event.target.parentElement;
    parent.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        gameManager.stateManager.before("importParty");
        gameManager.game.party = Object.assign(new Party(), JSON.parse(event.target.result));
        if (!this.gameManager.game.party) {
          parent.classList.add("error");
        } else {
          this.party = gameManager.game.party;
        }
        gameManager.stateManager.after();
      });

      reader.readAsText(event.target.files[ 0 ]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add("error");
    }
  }

  countFinished(scenarioData: ScenarioData): number {
    return this.party.scenarios.filter((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group).length;
  }

  isManual(scenarioData: ScenarioData): boolean {
    return this.party.manualScenarios.find((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group) != undefined;
  }

  blocked(scenarioData: ScenarioData): boolean {
    return gameManager.scenarioManager.isBlocked(scenarioData);
  }

  addSuccess(scenarioData: ScenarioData) {
    gameManager.stateManager.before("finishScenario.success", ...gameManager.scenarioManager.scenarioUndoArgs(scenarioData));
    this.party.scenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
    gameManager.game.party = this.party;
    gameManager.stateManager.after();

    this.updateScenarios();
  }

  removeSuccess(scenarioData: ScenarioData) {
    const value = this.party.scenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("finishScenario.remove", ...gameManager.scenarioManager.scenarioUndoArgs(scenarioData));
      this.party.scenarios.splice(this.party.scenarios.indexOf(value), 1);
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
    this.updateScenarios();
  }

  removeManual(scenarioData: ScenarioData) {
    const value = this.party.manualScenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("removeManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(scenarioData));
      this.party.manualScenarios.splice(this.party.manualScenarios.indexOf(value), 1);
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
    this.updateScenarios();
  }

  maxScenario(scenarios: ScenarioData[]) {
    return Math.max(...scenarios.map((scnearioData) => scnearioData.index.length));
  }

  updateScenarios(): void {
    const editions = gameManager.game.edition && [ gameManager.game.edition ] || gameManager.editions();
    this.scenarioEditions = [];
    editions.forEach((edition) => {
      let scenarioData = gameManager.scenarioManager.scenarioData(edition);
      if (scenarioData.length > 0) {
        this.scenarios[ edition ] = scenarioData.sort((a, b) => {
          if (a.group && !b.group) {
            return 1;
          } else if (!a.group && b.group) {
            return -1;
          } else if (a.group && b.group) {
            return a.group < b.group ? -1 : 1;
          }

          if (!isNaN(+a.index) && !isNaN(+b.index)) {
            return +a.index - +b.index;
          }

          return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
        });
        this.scenarioEditions.push(edition);
      }
    });
  }

  override open(): void {
    this.updateScenarios();
    super.open();
  }
}
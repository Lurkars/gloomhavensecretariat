import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { GameScenarioModel, ScenarioData } from "src/app/game/model/data/ScenarioData";

import { Party } from "src/app/game/model/Party";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
  selector: 'ghs-party-sheet',
  templateUrl: 'party-sheet.html',
  styleUrls: [ './party-sheet.scss' ]
})
export class PartySheetComponent {

  gameManager: GameManager = gameManager;

  constructor(private dialog: Dialog) { }

  open(): void {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: 'dialog-invert'
    });
  }
}



@Component({
  selector: 'ghs-party-sheet-dialog',
  templateUrl: 'party-sheet-dialog.html',
  styleUrls: [ './party-sheet-dialog.scss' ]
})
export class PartySheetDialogComponent {

  gameManager: GameManager = gameManager;
  party: Party = new Party();
  prosperitySteps = [ 3, 8, 14, 21, 29, 38, 49, 63 ];
  priceModifier: number = 0;
  campaign: boolean = false;
  edition: string | undefined;
  doubleClickAddSuccess: any = null;

  scenarioEditions: string[] = [];
  scenarios: Record<string, ScenarioData[]> = {};

  constructor() {
    this.edition = gameManager.game.edition;
    console.log(this.edition);
    this.updateScenarios();
    this.party = gameManager.game.party;
    if (this.party.reputation >= 0) {
      this.priceModifier = Math.ceil((this.party.reputation - 2) / 4) * -1;
    } else {
      this.priceModifier = Math.floor((this.party.reputation + 2) / 4) * -1;
    }
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

  setDonations(value: number) {
    if (this.party.donations == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyDonations", "" + value);
    this.party.donations = value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setProsperity(value: number) {
    if (this.party.prosperity == value) {
      value--;
    }
    if (value > 64) {
      value = 64
    } else if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyProsperity", "" + value);
    this.party.prosperity = value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
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
    if (!this.blocked(scenarioData) || this.doubleClickAddSuccess) {
      clearTimeout(this.doubleClickAddSuccess);
      this.doubleClickAddSuccess = null;
      this.addSuccessIntern(scenarioData);
    } else {
      this.doubleClickAddSuccess = setTimeout(() => {
        if (this.doubleClickAddSuccess) {
          this.doubleClickAddSuccess = null;
        }
      }, 200)
    }
  }

  addSuccessIntern(scenarioData: ScenarioData) {
    gameManager.stateManager.before("finishScenario.success", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
    this.party.scenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
    gameManager.game.party = this.party;
    gameManager.stateManager.after();

    this.updateScenarios();
  }

  removeSuccess(scenarioData: ScenarioData) {
    const value = this.party.scenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("finishScenario.remove", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      this.party.scenarios.splice(this.party.scenarios.indexOf(value), 1);
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
    this.updateScenarios();
  }

  removeManual(scenarioData: ScenarioData) {
    const value = this.party.manualScenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("removeManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      this.party.manualScenarios.splice(this.party.manualScenarios.indexOf(value), 1);
      gameManager.game.party = this.party;
      gameManager.stateManager.after();
    }
    this.updateScenarios();
  }

  maxScenario(scenarios: ScenarioData[]) {
    return Math.max(...scenarios.map((scnearioData) => scnearioData.index.length));
  }

  changeEdition(event: any) {
    this.edition = event.target.value != 'undefined' && event.target.value || undefined;
    if (this.party.campaignMode) {
      gameManager.stateManager.before("setEdition", "data.edition." + this.edition);
      gameManager.game.edition = this.edition;
      gameManager.stateManager.after();
    }
    this.updateScenarios();
  }

  updateScenarios(): void {
    const editions = this.edition && [ this.edition ] || gameManager.editions();
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
}
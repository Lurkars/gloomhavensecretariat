import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";

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
  }

  setName(event: any) {
    gameManager.stateManager.before("setPartyName", event.target.value);
    this.party.name = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setLocation(event: any) {
    gameManager.stateManager.before("setPartyLocation", event.target.value);;
    this.party.location = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setNotes(event: any) {
    gameManager.stateManager.before("setPartyNotes", event.target.value);
    this.party.notes = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setAchievements(event: any) {
    gameManager.stateManager.before("setPartyAchievements", event.target.value);
    this.party.achievements = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setReputation(value: number) {
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

  setProsperity(value: number) {
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

}
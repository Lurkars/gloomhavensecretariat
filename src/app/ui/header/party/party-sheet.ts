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

  constructor() {
    super();
    gameManager.uiChange.subscribe({
      next: () => {
        this.party = gameManager.game.party || new Party();
      }
    })
  }

  setName(event: any) {
    gameManager.stateManager.before();
    this.party.name = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setLocation(event: any) {
    gameManager.stateManager.before();
    this.party.location = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setNotes(event: any) {
    gameManager.stateManager.before();
    this.party.notes = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setAchievements(event: any) {
    gameManager.stateManager.before();
    this.party.achievements = event.target.value;
    gameManager.game.party = this.party;
    gameManager.stateManager.after();
  }

  setReputation(value: number) {
    gameManager.stateManager.before();
    if (value > 20) {
      value = 20
    } else if (value < -20) {
      value = -20;
    }
    this.party.reputation = value;
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
        gameManager.stateManager.before();
        gameManager.game.party = Object.assign(new Party(), JSON.parse(event.target.result));
        if (!this.gameManager.game.party) {
          parent.classList.add("error");
        } else {
          this.party = gameManager.game.party || new Party();
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
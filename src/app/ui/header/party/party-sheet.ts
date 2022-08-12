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

}
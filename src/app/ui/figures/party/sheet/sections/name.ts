import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Party } from 'src/app/game/model/Party';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { PartySheetSelectComponent } from 'src/app/ui/figures/party/sheet/sections/party-select';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective, PartySheetSelectComponent],
  selector: 'ghs-party-sheet-name',
  templateUrl: 'name.html',
  styleUrls: ['../../../sheet.scss', './name.scss']
})
export class PartySheetNameComponent extends PartySheetSection {
  setName(event: any) {
    if (this.party.name !== event.target.value) {
      gameManager.stateManager.before('setPartyName', event.target.value);
      this.party.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

  removeParty() {
    if (gameManager.game.parties.length > 1) {
      gameManager.stateManager.before('removeParty', this.party.name || '%party% ' + this.party.id);
      gameManager.game.parties.splice(gameManager.game.parties.indexOf(this.party), 1);
      gameManager.changeParty(gameManager.game.parties[0]);
      gameManager.stateManager.after();
    }
  }

  newParty() {
    const party = new Party();
    gameManager.stateManager.before('addParty', party.name || '%party% ' + party.id);
    let id = 0;
    while (gameManager.game.parties.some((party) => party.id === id)) {
      id++;
    }
    party.id = id;
    gameManager.game.parties.push(party);
    gameManager.changeParty(party);
    gameManager.stateManager.after();
  }
}

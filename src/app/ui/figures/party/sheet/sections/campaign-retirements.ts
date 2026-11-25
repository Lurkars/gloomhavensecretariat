import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { GameCharacterModel } from 'src/app/game/model/Character';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { openCharacterSheet } from 'src/app/ui/figures/party/sheet/sections/campaign-players';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-party-campaign-retirements',
  templateUrl: 'campaign-retirements.html',
  styleUrls: ['../../../sheet.scss', './campaign-retirements.scss']
})
export class PartyCampaignRetirementsComponent extends PartySheetSection {
  openCharacterSheet(characterModel: GameCharacterModel, viewOnly: boolean = true) {
    openCharacterSheet(this.dialog, characterModel, viewOnly);
  }

  characterPerks(characterModel: GameCharacterModel): number {
    if (characterModel.progress && characterModel.progress.perks && characterModel.progress.perks.length > 0) {
      return characterModel.progress.perks.reduce((a, b) => a + b);
    }

    return 0;
  }
  setPlayerNumber(characterModel: GameCharacterModel, event: any) {
    const number = +event.target.value;
    if (gameManager.retirementManager.canSetModelPlayerNumber(characterModel, number)) {
      gameManager.stateManager.before('setPlayerNumber', 'data.character.' + characterModel.edition + '.' + characterModel.name, number);
      gameManager.retirementManager.setModelPlayerNumber(characterModel, number);
      gameManager.stateManager.after();
    }
  }
  reactivateCharacter(characterModel: GameCharacterModel) {
    if (gameManager.retirementManager.reactivatable(characterModel)) {
      gameManager.stateManager.before('unsetRetired', 'data.character.' + characterModel.edition + '.' + characterModel.name);
      gameManager.retirementManager.reactivateCharacter(characterModel);
      gameManager.stateManager.after();
    }
  }
}

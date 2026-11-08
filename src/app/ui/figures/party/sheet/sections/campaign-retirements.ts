import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';
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
    if (!isNaN(+event.target.value) && characterModel.number !== +event.target.value && +event.target.value > 0) {
      gameManager.stateManager.before(
        'setPlayerNumber',
        'data.character.' + characterModel.edition + '.' + characterModel.name,
        event.target.value
      );
      characterModel.number = +event.target.value;
      gameManager.stateManager.after();
    }
  }
  reactivateCharacter(characterModel: GameCharacterModel) {
    if (
      !gameManager.game.figures.find(
        (figure) => figure instanceof Character && figure.name === characterModel.name && figure.edition === characterModel.edition
      ) &&
      !gameManager.game.party.availableCharacters.find(
        (availableCharacter) => availableCharacter.name === characterModel.name && availableCharacter.edition === characterModel.edition
      )
    ) {
      gameManager.stateManager.before('unsetRetired', 'data.character.' + characterModel.edition + '.' + characterModel.name);
      const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
      character.fromModel(characterModel);
      character.progress.retired = false;
      character.progress.personalQuestProgress = [];
      gameManager.game.figures.push(character);
      this.party.retirements.splice(this.party.retirements.indexOf(characterModel), 1);
      gameManager.stateManager.after();
    }
  }
}

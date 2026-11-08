import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';
import { BattleGoalSetupDialog } from 'src/app/ui/figures/battlegoal/setup/battlegoal-setup';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { EventCardDeckComponent } from 'src/app/ui/figures/event/deck/event-card-deck';
import { PersonalQuestSetupDialog } from 'src/app/ui/figures/party/personal-quests/personal-quest-setup';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export function openCharacterSheet(dialog: any, characterModel: GameCharacterModel, viewOnly: boolean = true) {
  const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
  character.fromModel(characterModel);
  dialog
    .open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: character, viewOnly: viewOnly }
    })
    .closed.subscribe({
      next: () => {
        if (
          characterModel.progress &&
          JSON.stringify(characterModel.progress.enhancements) !== JSON.stringify(character.progress.enhancements)
        ) {
          gameManager.stateManager.before(
            'changeRetiredCharacterEnhancements',
            gameManager.characterManager.characterName(character, true, true)
          );
          characterModel.progress.enhancements = character.progress.enhancements;
          const current = gameManager.game.figures.find(
            (figure) => figure instanceof Character && figure.edition === character.edition && figure.name === character.name
          ) as Character;
          if (current) {
            gameManager.characterManager.previousEnhancements(current, gameManager.enhancementsManager.temporary);
          }
          gameManager.stateManager.after();
        }
      }
    });
}

@Component({
  imports: [GhsLabelDirective, GhsRangePipe, GhsTooltipDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-party-campaign-players',
  templateUrl: 'campaign-players.html',
  styleUrls: ['../../../sheet.scss', './campaign-players.scss']
})
export class PartyCampaignPlayersComponent extends PartySheetSection {
  availableCharacters: GameCharacterModel[][] = [];

  override update(): void {
    this.availableCharacters = [];
    this.party.availableCharacters.forEach((characterModel) => {
      this.availableCharacters[characterModel.number - 1] = this.availableCharacters[characterModel.number - 1] || [];
      this.availableCharacters[characterModel.number - 1].push(characterModel);
    });
  }

  openCharacterSheet(characterModel: GameCharacterModel, viewOnly: boolean = true) {
    openCharacterSheet(this.dialog, characterModel, viewOnly);
  }

  changePlayer(event: any, index: number) {
    gameManager.stateManager.before('setPlayer', event.target.value, index + 1);
    this.party.players[index] = event.target.value;
    gameManager.stateManager.after();
  }
  removePlayer(index: number) {
    gameManager.stateManager.before('removePlayer', this.party.players[index], index + 1);
    this.party.players.splice(index, 1);
    gameManager.stateManager.after();
  }
  replayCharacter(characterModel: GameCharacterModel) {
    const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
    character.fromModel(characterModel);
    gameManager.stateManager.before(
      'characterReplay',
      gameManager.characterManager.characterName(character, true, true),
      this.party.players[characterModel.number - 1] ? this.party.players[characterModel.number - 1] : '' + characterModel.number
    );
    gameManager.game.party.availableCharacters = gameManager.game.party.availableCharacters.filter(
      (availableCharacter) =>
        availableCharacter.name !== character.name ||
        availableCharacter.edition !== character.edition ||
        availableCharacter.number !== character.number
    );
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character && figure.number === character.number) {
        gameManager.game.party.availableCharacters.push(figure.toModel());
        gameManager.characterManager.removeCharacter(figure);
      }
    });
    gameManager.game.figures.push(character);
    gameManager.stateManager.after();
    this.update();
  }
  setupEvents(type: string = '') {
    this.dialog.open(EventCardDeckComponent, {
      panelClass: ['dialog'],
      data: {
        type: type,
        edition: gameManager.game.edition || gameManager.currentEdition(),
        setup: true
      }
    });
  }
  battleGoalSetup() {
    this.dialog.open(BattleGoalSetupDialog, {
      panelClass: ['dialog']
    });
  }
  personalQuestSetup() {
    this.dialog.open(PersonalQuestSetupDialog, {
      panelClass: ['dialog'],
      data: { edition: this.edition() }
    });
  }
}

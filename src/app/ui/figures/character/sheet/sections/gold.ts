import { NgClass } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-gold',
  templateUrl: 'gold.html',
  styleUrls: ['../../../sheet.scss', './gold.scss']
})
export class CharacterSheetGoldComponent extends CharacterSheetSection implements OnInit {
  readonly fh = input<boolean>(false);

  donations: boolean | 'fh' = false;
  goldTimeout: any = null;

  ngOnInit(): void {
    this.donations =
      !gameManager.fhRules(false) && !gameManager.editionRules('jotl') && !gameManager.attackModifierManager.isRpgCharacter(this.character);
    if (
      this.fh() &&
      gameManager.fhRules(false) &&
      gameManager.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'temple' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
      )
    ) {
      this.donations = 'fh';
    }
  }

  get donationPrice(): number {
    return this.donations === 'fh' ? 5 : 10;
  }

  setGold(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.gold !== +event.target.value) {
      if (this.goldTimeout) {
        clearTimeout(this.goldTimeout);
        this.goldTimeout = null;
      }
      this.goldTimeout = setTimeout(() => {
        gameManager.stateManager.before('setGold', this.characterName, event.target.value);
        this.character.progress.gold = +event.target.value;
        gameManager.stateManager.after();
        this.goldTimeout = null;
      }, 500);
    }
  }

  donate() {
    if (gameManager.game.round < 1 && this.character.progress.gold > this.donationPrice - 1) {
      gameManager.stateManager.before('donate', this.characterName);
      this.character.progress.donations += 1;
      this.character.donations += 1;
      gameManager.game.party.donations += 1;
      this.character.progress.gold -= this.donationPrice;
      gameManager.stateManager.after();
      gameManager.personalQuestManager.trackPersonalQuestProgress(this.character, PersonalQuestAutotrackType.donations);
      gameManager.personalQuestManager.trackPersonalQuestProgress(this.character, PersonalQuestAutotrackType.donatedGold);
    }
  }
}

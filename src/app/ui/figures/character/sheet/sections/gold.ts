import { NgClass } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    const available = gameManager.characterManager.donationsAvailable(this.character);
    this.donations = available && gameManager.fhRules(false) ? (this.fh() ? 'fh' : false) : available;
  }

  get donationPrice(): number {
    return gameManager.characterManager.donationCosts();
  }

  setGold(event: any) {
    if (isNaN(+event.target.value)) {
      return;
    }
    const value = Math.max(0, +event.target.value);
    event.target.value = value;
    if (this.character.progress.gold !== value) {
      if (this.goldTimeout) {
        clearTimeout(this.goldTimeout);
        this.goldTimeout = null;
      }
      this.goldTimeout = setTimeout(() => {
        gameManager.stateManager.before('setGold', this.characterName, value);
        this.character.progress.gold = value;
        gameManager.stateManager.after();
        this.goldTimeout = null;
      }, 500);
    }
  }

  donate() {
    if (gameManager.characterManager.canDonate(this.character)) {
      gameManager.stateManager.before('donate', this.characterName);
      gameManager.characterManager.donate(this.character);
      gameManager.stateManager.after();
    }
  }
}

import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsRangePipe],
  selector: 'ghs-character-sheet-battle-goals',
  templateUrl: 'battle-goals.html',
  styleUrls: ['../../../sheet.scss', './battle-goals.scss']
})
export class CharacterSheetBattleGoalsComponent extends CharacterSheetSection {
  readonly checkmark = input<'check' | 'checkmark'>('check');

  setBattleGoals(battleGoals: number) {
    if (this.character.progress.battleGoals === battleGoals) {
      battleGoals--;
    }
    battleGoals = Math.min(18, Math.max(0, battleGoals));
    if (this.character.progress.battleGoals !== battleGoals) {
      gameManager.stateManager.before('setBG', this.characterName, battleGoals);
      this.character.progress.battleGoals = battleGoals;
      gameManager.stateManager.after();
    }
  }
}

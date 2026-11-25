import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { CHARACTER_MAX_BATTLE_GOALS } from 'src/app/game/businesslogic/CharacterManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    battleGoals = Math.min(CHARACTER_MAX_BATTLE_GOALS, Math.max(0, battleGoals));
    if (
      this.character.progress.battleGoals !== battleGoals &&
      gameManager.characterManager.canSetProgressValue(this.character, 'battleGoals', battleGoals)
    ) {
      gameManager.stateManager.before('setBG', this.characterName, battleGoals);
      gameManager.characterManager.setProgressValue(this.character, 'battleGoals', battleGoals);
      gameManager.stateManager.after();
    }
  }
}

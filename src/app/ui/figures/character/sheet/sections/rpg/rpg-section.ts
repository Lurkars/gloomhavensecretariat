import { Directive, inject, OnInit } from '@angular/core';
import { RpgValue } from 'src/app/game/businesslogic/CharacterRpgManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { RpgProgress } from 'src/app/game/model/CharacterProgress';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';

@Directive()
export abstract class RpgSheetSection extends CharacterSheetSection implements OnInit {
  private ghsManager = inject(GhsManager);

  rpg: RpgProgress = new RpgProgress();

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.rpg = gameManager.characterRpgManager.rpgProgress(this.character.progress.rpg);
  }

  change(label: string, path: string, value: RpgValue, labelValue: RpgValue = value) {
    if (this.locked || !gameManager.characterRpgManager.canSetRpgValue(this.character, path, value)) {
      return;
    }
    gameManager.stateManager.before('setRpgSheet', this.characterName, 'character.progress.rpg.' + label, '' + labelValue);
    gameManager.characterRpgManager.setRpgValue(this.character, path, value);
    gameManager.stateManager.after();
  }
}

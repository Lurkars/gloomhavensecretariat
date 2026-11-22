import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { GameState } from 'src/app/game/model/Game';
import { PerkLabelComponent } from 'src/app/ui/figures/attackmodifier/perk/label';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, PointerInputDirective, TrackUUIDPipe, PerkLabelComponent],
  selector: 'ghs-character-sheet-perks',
  templateUrl: 'perks.html',
  styleUrls: ['../../../sheet.scss', './perks.scss']
})
export class CharacterSheetPerksComponent extends CharacterSheetSection implements OnInit {
  private ghsManager = inject(GhsManager);

  GameState = GameState;
  availablePerks: number = 0;

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.availablePerks = gameManager.characterManager.availablePerks(this.character);
  }

  togglePerk(index: number, force: boolean = false) {
    let value = this.character.progress.perks[index] + 1;
    if (value > this.character.perks[index].count) {
      value = 0;
    }

    if (!force && this.availablePerks === 0 && value !== 0 && this.character.progress.perks[index]) {
      value = this.character.progress.perks[index] - 1;
    }

    const disabled: boolean =
      gameManager.game.state !== GameState.draw ||
      gameManager.game.round > 0 ||
      (this.availablePerks === 0 && !this.character.progress.perks[index]);

    if (!force && disabled && value > 1) {
      value = 0;
    }

    this.addPerk(index, value, force);
  }

  addPerk(index: number, value: number, force: boolean = false) {
    const disabled: boolean =
      (!this.forceEdit() && (gameManager.game.state !== GameState.draw || gameManager.game.round > 0)) ||
      (this.character.progress.perks[index] < value && this.availablePerks < value - this.character.progress.perks[index]);

    if (!disabled || (force && !settingsManager.settings.characterSheetLocked && this.editable())) {
      gameManager.stateManager.before('setPerk', this.characterName, index, value);
      gameManager.characterManager.setPerk(
        this.character,
        index,
        this.character.progress.perks[index] && this.character.progress.perks[index] === value
          ? this.character.progress.perks[index] - 1
          : value
      );
      gameManager.stateManager.after();
    }
  }
}

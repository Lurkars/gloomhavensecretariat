import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
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
      const lowerShacklesHP =
        this.character.name === 'shackles' && this.character.edition === 'fh' && index === 11 && this.character.progress.perks[index] === 2;
      if (this.character.progress.perks[index] && this.character.progress.perks[index] === value) {
        this.character.progress.perks[index]--;
      } else {
        this.character.progress.perks[index] = value;
      }

      const perk = this.character.perks[index];
      if (perk.monsterDeck) {
        gameManager.game.monsterAttackModifierDeck = gameManager.attackModifierManager.buildMonsterAttackModifierDeck();
        gameManager.attackModifierManager.shuffleModifiers(gameManager.game.monsterAttackModifierDeck);
      } else {
        gameManager.attackModifierManager.mergeAttackModifierDeck(
          this.character.attackModifierDeck,
          gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character)
        );
        gameManager.attackModifierManager.shuffleModifiers(this.character.attackModifierDeck);

        if (this.character.name === 'shackles' && this.character.edition === 'fh' && index === 11) {
          if (this.character.progress.perks[index] === 2) {
            this.character.maxHealth += 5;
          } else if (lowerShacklesHP) {
            this.character.maxHealth -= 5;
          }
          this.character.health = this.character.maxHealth;
        }
      }

      gameManager.stateManager.after();
    }
  }
}

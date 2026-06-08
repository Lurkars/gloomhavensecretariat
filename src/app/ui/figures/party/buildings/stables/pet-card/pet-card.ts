import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { PetCard } from 'src/app/game/model/data/PetCard';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [ActionComponent, CardRevealDirective, GhsLabelDirective, NgClass, PointerInputDirective],
  selector: 'ghs-pet-card',
  templateUrl: './pet-card.html',
  styleUrls: ['./pet-card.scss']
})
export class PetCardComponent {
  readonly inputPetCard = input.required<PetCard>({ alias: 'petCard' });
  get petCard(): PetCard {
    return this.inputPetCard();
  }

  readonly flipped = input<boolean>(false);
  readonly reveal = input<boolean>(false);
  readonly name = input<string>('');
  readonly revealed = output<void>();

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
}

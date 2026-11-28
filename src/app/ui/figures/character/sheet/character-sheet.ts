import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { AbilityCardsDialogComponent } from 'src/app/ui/figures/character/abilities/ability-cards-dialog';
import { CharacterSheetFhComponent } from 'src/app/ui/figures/character/sheet/layouts/fh-sheet';
import { CharacterSheetGhComponent } from 'src/app/ui/figures/character/sheet/layouts/gh-sheet';
import { CharacterSheetRpgComponent } from 'src/app/ui/figures/character/sheet/layouts/rpg-sheet';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';

export type CharacterSheetType = 'gh' | 'fh' | 'rpg';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, CharacterSheetGhComponent, CharacterSheetFhComponent, CharacterSheetRpgComponent],
  selector: 'ghs-character-sheet',
  templateUrl: 'character-sheet.html',
  styleUrls: ['./character-sheet.scss']
})
export class CharacterSheetComponent extends CharacterSheetSection implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  sheet: CharacterSheetType = 'gh';
  gh2e: boolean = false;
  cs: boolean = false;
  hasAbilities: boolean = false;

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => {});
  }

  ngOnInit(): void {
    if (gameManager.characterRpgManager.isRpgCharacter(this.character)) {
      this.sheet = 'rpg';
    } else {
      this.sheet = gameManager.fhRules(true) ? 'fh' : 'gh';
      this.updateVariants();
    }

    this.hasAbilities = gameManager.editionManager.deckData(this.character, true).abilities.length > 0;
  }

  updateVariants() {
    this.gh2e = this.sheet === 'fh' && !gameManager.fhRules() && gameManager.fhRules(true);
    this.cs = this.sheet === 'gh' && gameManager.editionManager.isEditionRelevant(this.character.edition, 'cs');
  }

  toggleFhSheet() {
    this.sheet = this.sheet === 'fh' ? 'gh' : 'fh';
    this.updateVariants();
  }

  openAbilityCards() {
    this.dialog.open(AbilityCardsDialogComponent, {
      panelClass: ['dialog'],
      data: { character: this.character, view: 'deck' }
    });
  }
}

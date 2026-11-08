import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { CharacterProgress } from 'src/app/game/model/CharacterProgress';
import { LootType } from 'src/app/game/model/data/Loot';
import { AbilityCardsDialogComponent } from 'src/app/ui/figures/character/sheet/abilities/ability-cards-dialog';
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
    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    this.character.progress.perks = this.character.progress.perks || [];
    for (let i = 0; i < 15; i++) {
      if (!this.character.progress.perks[i]) {
        this.character.progress.perks[i] = 0;
      }
    }

    if (gameManager.attackModifierManager.isRpgCharacter(this.character)) {
      this.sheet = 'rpg';
    } else {
      this.sheet = gameManager.fhRules(true) ? 'fh' : 'gh';
      this.updateVariants();
    }

    if (gameManager.fhRules(false)) {
      for (const value in LootType) {
        const lootType: LootType = value as LootType;
        this.character.progress.loot[lootType] = this.character.progress.loot[lootType] || 0;
      }
    }

    if (this.character.progress.experience < gameManager.characterManager.xpMap[this.character.level - 1]) {
      this.character.progress.experience = gameManager.characterManager.xpMap[this.character.level - 1];
    }

    this.hasAbilities = gameManager.deckData(this.character, true).abilities.length > 0;
  }

  updateVariants() {
    this.gh2e = this.sheet === 'fh' && !gameManager.fhRules() && gameManager.fhRules(true);
    this.cs = this.sheet === 'gh' && gameManager.isEditionRelevant(this.character.edition, 'cs');
  }

  toggleFhSheet() {
    this.sheet = this.sheet === 'fh' ? 'gh' : 'fh';
    this.updateVariants();
  }

  openAbilityCards() {
    this.dialog.open(AbilityCardsDialogComponent, {
      panelClass: ['dialog'],
      data: { character: this.character }
    });
  }
}

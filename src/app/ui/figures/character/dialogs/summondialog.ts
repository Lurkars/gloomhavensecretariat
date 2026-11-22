import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { SummonColor } from 'src/app/game/model/Summon';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, TrackUUIDPipe],
  selector: 'ghs-character-summondialog',
  templateUrl: 'summondialog.html',
  styleUrls: ['./summondialog.scss']
})
export class CharacterSummonDialog {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  summonColors: SummonColor[] = Object.values(SummonColor).filter(
    (summonColor) => summonColor !== SummonColor.custom && summonColor !== SummonColor.fh
  );
  summonColor: SummonColor = SummonColor.blue;
  summonNumber: number | undefined;
  summonName: string = '';
  summonFilter: string;
  fhSummon: boolean = false;
  rpg: boolean = false;
  summonData: SummonData[] = [];
  summonNumbers: number[] = [];
  showAll: boolean = false;

  character: Character = inject(DIALOG_DATA);

  constructor() {
    this.summonFilter = '';
    this.rpg = gameManager.attackModifierManager.isRpgCharacter(this.character);
    // RPG uses numbered summons like FH
    this.fhSummon = gameManager.isEditionRelevant(this.character.edition, 'fh') || this.rpg;
    if (this.fhSummon) {
      this.summonColor = SummonColor.fh;
    }

    this.updateSummonData();

    if (!this.fhSummon) {
      this.summonNumber = 1;
      for (let i = 2; i < 9; i++) {
        if (
          this.summonData.filter((summonData) => this.available(summonData, i)) >
          this.summonData.filter((summonData) => this.available(summonData, i - 1))
        ) {
          this.summonNumber = i;
        }
      }
    }
  }

  pickNumber(number: number) {
    if (this.summonNumber === number) {
      this.summonNumber = undefined;
    } else {
      this.summonNumber = number;
    }
  }

  selectColor(color: SummonColor) {
    this.summonColor = color;
  }

  available(summonData: SummonData, number: number): boolean {
    return gameManager.characterManager.summonAvailable(this.character, summonData, number, this.summonColor);
  }

  customDisabled() {
    return this.character.summons.some(
      (summon) =>
        gameManager.entityManager.isAlive(summon) &&
        summon.name === this.summonName &&
        summon.number === this.summonNumber &&
        summon.color === this.summonColor
    );
  }

  showLevel(summonData: SummonData): boolean {
    return this.summonData.some(
      (other) => other.name === summonData.name && other.cardId !== summonData.cardId && summonData.level !== other.level
    );
  }

  updateSummonData() {
    const summons: SummonData[] = [];
    summons.push(...this.character.availableSummons.filter((summonData) => !summonData.level || summonData.level <= this.character.level));

    // TODO: items not implemented for RPG yet
    if (this.rpg) {
      // no item summons
    } else if (settingsManager.settings.characterItems) {
      if (this.character.progress && this.character.progress.items) {
        for (const itemIdentifier of this.character.progress.items) {
          const item = gameManager.itemManager.getItem(itemIdentifier.name, itemIdentifier.edition, true);
          if (item && item.summon) {
            if (!item.summon.name) {
              item.summon.name = item.name;
            }
            if (!item.summon.count) {
              item.summon.count = 1;
            }
            summons.push(item.summon);
          }
        }
      }
    } else {
      for (const edition of gameManager.relevantEditions()) {
        gameManager.itemManager
          .getItems(edition, true)
          .filter((itemData) => itemData.summon)
          .forEach((itemData) => {
            if (itemData.summon) {
              summons.push(itemData.summon);
            }
          });
      }
    }

    this.summonData = summons.filter((summonData) => !this.summonFilter || summonData.cardId === this.summonFilter);

    this.summonData.forEach((summonData, index) => {
      this.summonNumbers[index] = -1;
      const maxNumber = Math.max(8, summonData.count || 1);
      for (let i = 1; i <= maxNumber; i++) {
        if (this.available(summonData, i) && this.summonNumbers[index] === -1) {
          this.summonNumbers[index] = i;
        }
      }
    });
  }

  setSummonName(event: any) {
    this.summonName = event.target.value;
  }

  addCustomSummon() {
    if (this.summonNumber) {
      gameManager.stateManager.before(
        'addCustomSummon',
        gameManager.characterManager.characterName(this.character, true, true),
        this.summonNumber,
        this.summonColor
      );
      gameManager.characterManager.addCustomSummon(this.character, this.summonName, this.summonNumber, this.summonColor);
      ghsDialogClosingHelper(this.dialogRef);
      gameManager.stateManager.after();
      this.updateSummonData();
    }
  }

  addSummon(summonData: SummonData) {
    const index = this.summonData.indexOf(summonData);
    if (index !== -1) {
      gameManager.stateManager.before(
        'addSummon',
        gameManager.characterManager.characterName(this.character, true, true),
        'data.summon.' + summonData.name
      );
      const summon = gameManager.characterManager.addSummonFromData(
        this.character,
        summonData,
        this.summonNumber || this.summonNumbers[index],
        this.summonColor
      );

      if (summon.trap) {
        ghsDialogClosingHelper(this.dialogRef);
        this.dialog.open(EntitiesMenuDialogComponent, {
          panelClass: ['dialog'],
          data: {
            entity: summon,
            figure: this.character
          }
        });
      }

      if (
        !summonData.count ||
        this.character.summons.filter((summon) => summon.name === summonData.name && summon.cardId === summonData.cardId).length ==
          summonData.count
      ) {
        ghsDialogClosingHelper(this.dialogRef);
      } else {
        this.summonFilter = summonData.cardId;
        if (this.summonNumber) {
          if (!this.fhSummon) {
            this.summonNumber++;
            if (this.summonNumber > (this.fhSummon ? 8 : 4)) {
              this.summonNumber = 1;
            }
          } else {
            this.summonNumber = undefined;
          }
        }
      }
      gameManager.stateManager.after();
      this.updateSummonData();
    }
  }
}

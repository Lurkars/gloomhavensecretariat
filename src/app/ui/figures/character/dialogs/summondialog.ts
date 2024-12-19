import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { SummonData } from "src/app/game/model/data/SummonData";
import { Summon, SummonColor, SummonState } from "src/app/game/model/Summon";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { v4 as uuidv4 } from 'uuid';

@Component({
  standalone: false,
  selector: 'ghs-character-summondialog',
  templateUrl: 'summondialog.html',
  styleUrls: ['./summondialog.scss']
})
export class CharacterSummonDialog {

  gameManager: GameManager = gameManager;
  summonColors: SummonColor[] = Object.values(SummonColor).filter((summonColor) => summonColor != SummonColor.custom && summonColor != SummonColor.fh);
  summonColor: SummonColor = SummonColor.blue;
  summonNumber: number | undefined;
  summonName: string = "";
  summonFilter: string;
  fhSummon: boolean = false;
  summonData: SummonData[] = [];
  summonNumbers: number[] = [];
  showAll: boolean = false;

  constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef) {
    this.summonFilter = "";
    this.fhSummon = this.character.edition === 'fh' || gameManager.editionExtensions(this.character.edition).indexOf('fh') != -1;
    if (this.fhSummon) {
      this.summonColor = SummonColor.fh;
    }

    this.updateSummonData();

    if (!this.fhSummon) {
      this.summonNumber = 1;
      for (let i = 2; i < 9; i++) {
        if (this.summonData.filter((summonData) => this.available(summonData, i)) > this.summonData.filter((summonData) => this.available(summonData, i - 1))) {
          this.summonNumber = i;
        }
      }
    }
  }

  pickNumber(number: number) {
    if (this.summonNumber == number) {
      this.summonNumber = undefined;
    } else {
      this.summonNumber = number;
    }
  }

  selectColor(color: SummonColor) {
    this.summonColor = color;
  }

  available(summonData: SummonData, number: number): boolean {
    return this.summonColor != SummonColor.custom && number != 0 && this.character.summons.every((summon) => summon.dead || summon.name != summonData.name || (summonData.special ? summon.number != 0 : summon.number != number) || (summonData.special ? summon.color != SummonColor.custom : summon.color != this.summonColor)) && (summonData.count || 1) > this.character.summons.filter((summon) => summon.name == summonData.name && summon.cardId == summonData.cardId && gameManager.entityManager.isAlive(summon)).length
  }

  customDisabled() {
    return this.character.summons.some((summon) => gameManager.entityManager.isAlive(summon) && summon.name == this.summonName && summon.number == this.summonNumber && summon.color == this.summonColor);
  }

  showLevel(summonData: SummonData): boolean {
    return this.summonData.some((other) => other.name == summonData.name && other.cardId != summonData.cardId && summonData.level != other.level);
  }

  updateSummonData() {
    let summons: SummonData[] = [];
    summons.push(...this.character.availableSummons.filter((summonData) => !summonData.level || summonData.level <= this.character.level));

    if (settingsManager.settings.characterItems) {
      if (this.character.progress && this.character.progress.items) {
        for (let itemIdentifier of this.character.progress.items) {
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
      const editions = gameManager.game.edition ? [gameManager.game.edition, ...gameManager.editionExtensions(gameManager.game.edition)] : gameManager.editions(false, true);
      for (let edition of editions) {
        gameManager.itemManager.getItems(edition, true).filter((itemData) => itemData.summon).forEach((itemData) => {
          if (itemData.summon) {
            summons.push(itemData.summon);
          }
        })
      }
    }

    this.summonData = summons.filter((summonData) => !this.summonFilter || summonData.cardId == this.summonFilter);

    this.summonData.forEach((summonData, index) => {
      this.summonNumbers[index] = -1;
      for (let i = 1; i < 9; i++) {
        if (this.available(summonData, i) && this.summonNumbers[index] == -1) {
          this.summonNumbers[index] = i;
        }
      }
    })
  }

  setSummonName(event: any) {
    this.summonName = event.target.value;
  }

  addCustomSummon() {
    if (this.summonNumber) {
      gameManager.stateManager.before("addCustomSummon", gameManager.characterManager.characterName(this.character), this.summonNumber, this.summonColor);
      let summon: Summon = new Summon(uuidv4(), this.summonName, "", this.character.level, this.summonNumber, this.summonColor);
      summon.state = SummonState.new;
      gameManager.characterManager.addSummon(this.character, summon);
      ghsDialogClosingHelper(this.dialogRef);
      gameManager.stateManager.after();
      this.updateSummonData();
    }
  }

  addSummon(summonData: SummonData) {
    const index = this.summonData.indexOf(summonData);
    if (index != -1) {
      gameManager.stateManager.before("addSummon", gameManager.characterManager.characterName(this.character), "data.summon." + summonData.name);
      let summon: Summon = new Summon(uuidv4(), summonData.name, summonData.cardId, this.character.level, summonData.special ? 0 : this.summonNumber || this.summonNumbers[index], summonData.special ? SummonColor.custom : this.summonColor, summonData);
      if (summonData.special) {
        summon.state = SummonState.true;
      } else {
        summon.state = SummonState.new;
      }
      summon.init = false;
      gameManager.characterManager.addSummon(this.character, summon);
      if (!summonData.count || this.character.summons.filter((summon) => summon.name == summonData.name && summon.cardId == summonData.cardId).length == summonData.count) {
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
import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { SummonData } from "src/app/game/model/data/SummonData";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Summon, SummonColor, SummonState } from "src/app/game/model/Summon";

import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-character-summondialog',
  templateUrl: 'summondialog.html',
  styleUrls: [ './summondialog.scss', '../../../dialog/dialog.scss' ]
})
export class CharacterSummonDialog extends DialogComponent {

  @Input() character!: Character;

  summonColors: SummonColor[] = Object.values(SummonColor).filter((summonColor) => summonColor != SummonColor.custom);
  summonColor: SummonColor = SummonColor.blue;
  summonNumber: number = 1;
  summonName: string = "";

  pickNumber(number: number) {
    this.summonNumber = number;
  }

  selectColor(color: SummonColor) {
    this.summonColor = color;
  }

  available(summonData: SummonData) {
    return this.summonColor != SummonColor.custom && this.summonNumber != 0 && this.character.summons.every((summon) => summon.dead || summon.name != summonData.name || (summonData.special ? summon.number != 0 : summon.number != this.summonNumber) || (summonData.special ? summon.color != SummonColor.custom : summon.color != this.summonColor));
  }

  customDisabled() {
    return this.character.summons.some((summon) => !summon.dead && summon.name == this.summonName && summon.number == this.summonNumber && summon.color == this.summonColor);
  }

  summonData(): SummonData[] {
    return this.character.availableSummons.filter((summonData) => !summonData.level || summonData.level <= this.character.level);
  }

  setSummonName(event: any) {
    this.summonName = event.target.value;
  }

  addCustomSummon() {
    gameManager.stateManager.before();
    let summon: Summon = new Summon(this.summonName, this.character.level, this.summonNumber, this.summonColor);
    summon.state = SummonState.new;
    gameManager.characterManager.addSummon(this.character, summon);
    this.close();
    gameManager.stateManager.after();
  }

  addSummon(summonData: SummonData) {
    if (this.character.availableSummons.indexOf(summonData) != -1) {
      gameManager.stateManager.before();
      let summon: Summon = new Summon(summonData.name, this.character.level, summonData.special ? 0 : this.summonNumber, summonData.special ? SummonColor.custom : this.summonColor);
      summon.maxHealth = typeof summonData.health == "number" ? summonData.health : EntityValueFunction(summonData.health, this.character.level);
      summon.attack = typeof summonData.attack == "number" ? summonData.attack : EntityValueFunction(summonData.attack, this.character.level);
      summon.movement = typeof summonData.movement == "number" ? summonData.movement : EntityValueFunction(summonData.movement, this.character.level);
      summon.range = typeof summonData.range == "number" ? summonData.range : EntityValueFunction(summonData.range, this.character.level);
      summon.health = summon.maxHealth;
      if (summonData.special) {
        summon.state = SummonState.true;
      } else {
        summon.state = SummonState.new;
      }
      summon.init = false;
      gameManager.characterManager.addSummon(this.character, summon);
      this.close();
      gameManager.stateManager.after();
    }
  }

  override close(): void {
    super.close();
    this.summonName = "";
  }
}
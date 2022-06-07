import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";

import { CharacterEntity } from "src/app/game/model/CharacterEntity";
import { SummonColor } from "src/app/game/model/Summon";

import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-character-summondialog',
  templateUrl: 'summondialog.html',
  styleUrls: [ './summondialog.scss', '../../../dialog/dialog.scss' ]
})
export class CharacterSummonDialog extends DialogComponent {

  @Input()
  public addSummon!: Function;

  summonColors: SummonColor[] = Object.values(SummonColor);
  summonColor: SummonColor = SummonColor.blue;

  pickNumber(number: number) {
    this.close();
    this.addSummon(number, this.summonColor);
  }

  selectColor(color: SummonColor) {
    this.summonColor = color;
  }




}
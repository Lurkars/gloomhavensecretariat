import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/MonsterType";
import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-monster-numberpicker',
  templateUrl: 'numberpicker.html',
  styleUrls: [ './numberpicker.scss', '../../../dialog/dialog.scss' ]
})
export class MonsterNumberPicker extends DialogComponent {

  @Input() monster!: Monster;
  @Input() type!: MonsterType;
  @Input() min: number = 1;
  @Input() max: number = 10;
  @Input() range: number[] = [];
  @Input() elite: boolean = false;
  summon: boolean = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.range = Array.from(Array(this.max).keys()).map(x => x + this.min);
  }

  isFull() {
    return this.monster.entities.length >= this.max;
  }


  hasNumber(number: number) {
    return this.monster.entities.some((monsterEntity: MonsterEntity) => {
      return monsterEntity.number == number;
    })
  }

  override open(): void {
    if (this.max == 1) {
      this.pickNumber(1);
    } else {
      super.open();
    }
  }

  pickNumber(number: number) {
    if (!this.hasNumber(number) && this.type) {
      gameManager.stateManager.before();
      gameManager.monsterManager.addMonsterEntity(this.monster, number, this.type, this.summon);
      gameManager.stateManager.after();
      if (this.monster.entities.length == this.monster.count) {
        this.close();
      }
    }
  }

}
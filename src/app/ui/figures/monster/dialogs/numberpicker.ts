import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
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
  summon: boolean = false;
  MonsterType = MonsterType;

  override ngOnInit(): void {
    super.ngOnInit();
    this.range = Array.from(Array(this.max).keys()).map(x => x + this.min);
  }

  nonDead(): number {
    return this.monster.entities.filter((monsterEntity: MonsterEntity) => !monsterEntity.dead).length;
  }


  hasNumber(number: number) {
    return this.monster.entities.some((monsterEntity: MonsterEntity) => {
      return monsterEntity.number == number && !monsterEntity.dead;
    })
  }

  override open(): void {
    if (this.nonDead() >= this.max) {
      return;
    }
    if (this.nonDead() == this.max - 1) {
      for (let i = 0; i < this.max; i++) {
        if (!this.monster.entities.some((me: MonsterEntity) => !me.dead && me.number == i + 1)) {
          this.pickNumber(i + 1);
        }
      }
    } else if (settingsManager.settings.randomStandees) {
      let number = Math.floor(Math.random() * this.monster.count) + 1;
      while (this.monster.entities.some((monsterEntity: MonsterEntity) => monsterEntity.number == number)) {
        number = number = Math.floor(Math.random() * this.monster.count) + 1;
      }
      this.pickNumber(number);
    } else {
      super.open();
    }
  }

  pickNumber(number: number) {
    if (!this.hasNumber(number) && this.type) {
      gameManager.stateManager.before();
      const dead = this.monster.entities.find((monsterEntity: MonsterEntity) => monsterEntity.number == number);
      if (dead) {
        gameManager.monsterManager.removeMonsterEntity(this.monster, dead);
      }
      gameManager.monsterManager.addMonsterEntity(this.monster, number, this.type, this.summon);
      gameManager.stateManager.after();
      if (this.monster.entities.length == this.monster.count) {
        this.close();
      }
    }
  }

}
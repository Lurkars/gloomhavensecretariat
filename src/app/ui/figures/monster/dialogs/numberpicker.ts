import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { MonsterNumberPickerDialog } from "./numberpicker-dialog";


@Component({
  selector: 'ghs-monster-numberpicker',
  templateUrl: 'numberpicker.html',
  styleUrls: ['./numberpicker.scss']
})
export class MonsterNumberPicker {

  @Input() monster!: Monster;
  @Input() type!: MonsterType;
  @Input() min: number = 1;
  @Input() max: number = 10;
  @Input() range: number[] = [];


  settingsManager: SettingsManager = settingsManager;

  constructor(private elementRef: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  nonDead(): number {
    return gameManager.monsterManager.monsterEntityCount(this.monster);
  }

  hasEntity(): boolean {
    return this.monster.entities.filter((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && (!settingsManager.settings.hideStats || monsterEntity.type == this.type)).length > 0;
  }

  hasNumber(number: number) {
    return this.monster.entities.some((monsterEntity) => {
      return monsterEntity.number == number && gameManager.entityManager.isAlive(monsterEntity);
    })
  }

  open(): void {
    if (this.nonDead() >= this.max) {
      return;
    }

    if (settingsManager.settings.disableStandees) {
      if (this.hasEntity()) {
        this.monster.entities = this.monster.entities.filter((monsterEntity) => settingsManager.settings.hideStats && monsterEntity.type != this.type);
      } else {
        this.monster.entities = this.monster.entities.filter((monsterEntity) => settingsManager.settings.hideStats && monsterEntity.type != this.type);
        if (settingsManager.settings.randomStandees) {
          this.randomStandee();
        } else {
          this.nextStandee();
        }
      }
      return;
    }

    if (this.nonDead() == this.max - 1 && this.monster.entities.every((me) => me.number > 0)) {
      for (let i = 0; i < this.max; i++) {
        if (!this.monster.entities.some((me) => gameManager.entityManager.isAlive(me) && me.number == i + 1)) {
          this.pickNumber(i + 1);
        }
      }
    } else if (settingsManager.settings.randomStandees) {
      this.randomStandee();
    } else {
      this.dialog.open(MonsterNumberPickerDialog, {
        panelClass: 'dialog',
        data: {
          monster: this.monster,
          type: this.type,
          min: this.min,
          max: this.max,
          range: this.range
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions(this.type == MonsterType.elite ? 'left' : 'right'))
      })
    }
  }

  randomStandee() {
    const count = EntityValueFunction(this.monster.count, this.monster.level);
    let number = Math.floor(Math.random() * count) + 1;
    while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
      number = Math.floor(Math.random() * count) + 1;
    }
    this.pickNumber(number, true, false);
  }

  nextStandee() {
    let number = 1;
    while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
      number += 1;
    }
    this.pickNumber(number, true, true);
  }

  pickNumber(number: number, automatic: boolean = false, next: boolean = false) {
    if (!this.hasNumber(number) && this.type) {
      let undoType = "addStandee";
      if (automatic && !next) {
        undoType = "addRandomStandee";
      } else if (automatic) {
        undoType = "addNextStandee";
      }
      gameManager.stateManager.before(undoType, "data.monster." + this.monster.name, "monster." + this.type, "" + number);
      const dead = this.monster.entities.find((monsterEntity) => monsterEntity.number == number);
      if (dead) {
        gameManager.monsterManager.removeMonsterEntity(this.monster, dead);
      }
      const entity = gameManager.monsterManager.addMonsterEntity(this.monster, number, this.type, false);

      if (gameManager.game.state == GameState.next && entity) {
        this.monster.active = !gameManager.game.figures.some((figure) => figure.active);
        if (this.monster.active) {
          gameManager.sortFigures();
          entity.active = true;
        }
      }
      gameManager.stateManager.after();
    }
  }
}
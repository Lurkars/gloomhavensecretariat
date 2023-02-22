import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Inject, Input, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/MonsterType";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";


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
    return this.monster.entities.filter((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && (!settingsManager.settings.hideStats || monsterEntity.type == this.type)).length > 0;
  }

  hasNumber(number: number) {
    return this.monster.entities.some((monsterEntity) => {
      return monsterEntity.number == number && !monsterEntity.dead;
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
        if (!this.monster.entities.some((me) => !me.dead && me.number == i + 1)) {
          this.pickNumber(i + 1);
        }
      }
    } else if (settingsManager.settings.randomStandees) {
      this.randomStandee();
    } else if (settingsManager.settings.nextStandees) {
      this.nextStandee();
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
    let number = Math.floor(Math.random() * this.monster.count) + 1;
    while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
      number = Math.floor(Math.random() * this.monster.count) + 1;
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


@Component({
  selector: 'ghs-monster-numberpicker-dialog',
  templateUrl: 'numberpicker-dialog.html',
  styleUrls: ['./numberpicker-dialog.scss']
})
export class MonsterNumberPickerDialog implements OnInit {

  monster: Monster;
  type: MonsterType;
  min: number;
  max: number;
  range: number[];
  summon: boolean = false;
  MonsterType = MonsterType;
  entity: MonsterEntity | undefined;
  settingsManager: SettingsManager = settingsManager;

  constructor(@Inject(DIALOG_DATA) private data: { monster: Monster, type: MonsterType, min: number, max: number, range: number[], entity: MonsterEntity | undefined }, private dialogRef: DialogRef) {
    this.monster = data.monster;
    this.type = data.type;
    this.min = data.min;
    this.max = data.max;
    this.range = data.range;
    this.entity = data.entity;
  }

  ngOnInit(): void {
    this.range = Array.from(Array(this.max).keys()).map(x => x + this.min);
  }

  nonDead(): number {
    return this.monster.entities.filter((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0).length;
  }

  hasEntity(): boolean {
    return this.monster.entities.filter((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && (!settingsManager.settings.hideStats || monsterEntity.type == this.type)).length > 0;
  }

  hasNumber(number: number) {
    return this.monster.entities.some((monsterEntity) => {
      return monsterEntity.number == number && !monsterEntity.dead;
    })
  }

  randomStandee() {
    let number = Math.floor(Math.random() * this.monster.count) + 1;
    while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
      number = Math.floor(Math.random() * this.monster.count) + 1;
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
      if (this.entity) {
        this.entity.number = number;
      } else {
        const entity = gameManager.monsterManager.addMonsterEntity(this.monster, number, this.type, this.summon);

        if (gameManager.game.state == GameState.next && entity) {
          this.monster.active = !gameManager.game.figures.some((figure) => figure.active);
          if (this.monster.active) {
            gameManager.sortFigures();
            entity.active = true;
          }
        }
      }
      gameManager.stateManager.after();
      if (this.monster.entities.length == this.monster.count || this.entity) {
        this.dialogRef.close();
      }
    }
  }

}
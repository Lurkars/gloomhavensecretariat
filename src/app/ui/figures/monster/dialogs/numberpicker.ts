import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Input, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { MonsterNumberPickerDialog } from "./numberpicker-dialog";


@Component({
  selector: 'ghs-monster-numberpicker',
  templateUrl: 'numberpicker.html',
  styleUrls: ['./numberpicker.scss']
})
export class MonsterNumberPicker implements OnInit {

  @Input() monster!: Monster;
  @Input() type!: MonsterType;
  @Input() range: number[] = [];
  @Input() nonDead: number = 0;
  @Input() count: number = 0;

  settingsManager: SettingsManager = settingsManager;

  maxStandees: number = 0;
  usedStandees: number = 0;

  constructor(private elementRef: ElementRef, private dialog: Dialog, private overlay: Overlay) {
    gameManager.uiChange.subscribe({ next: () => this.update() })
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.maxStandees = gameManager.monsterManager.monsterStandeeMax(this.monster);
    this.usedStandees = gameManager.monsterManager.monsterStandeeCount(this.monster);
  }

  hasEntity(): boolean {
    return this.monster.entities.filter((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && (!settingsManager.settings.hideStats || monsterEntity.type == this.type)).length > 0;
  }

  open(): void {
    if (this.nonDead >= this.count) {
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

    if (this.maxStandees == this.count && this.nonDead == this.count - 1 && this.monster.entities.every((me) => me.number > 0)) {
      for (let i = 0; i < this.count; i++) {
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
          range: this.range
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions(this.type == MonsterType.elite ? 'left' : 'right'))
      })
    }
  }

  randomStandee() {
    let number = Math.floor(Math.random() * this.maxStandees) + 1;
    while (gameManager.monsterManager.monsterStandeeUsed(this.monster, number)) {
      number = Math.floor(Math.random() * this.maxStandees) + 1;
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
    if (!gameManager.monsterManager.monsterStandeeUsed(this.monster, number) && this.type) {
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
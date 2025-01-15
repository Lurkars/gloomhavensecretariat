import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { MonsterNumberPickerDialog } from "./numberpicker-dialog";


@Component({
  standalone: false,
  selector: 'ghs-monster-numberpicker',
  templateUrl: 'numberpicker.html',
  styleUrls: ['./numberpicker.scss']
})
export class MonsterNumberPicker implements OnInit, OnDestroy {

  @Input() monster!: Monster;
  @Input() type!: MonsterType;
  @Input() range: number[] = [];
  @Input() nonDead: number = 0;
  @Input() count: number = 0;

  settingsManager: SettingsManager = settingsManager;

  maxStandees: number = 0;
  usedStandees: number = 0;

  constructor(private elementRef: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.maxStandees = gameManager.monsterManager.monsterStandeeMax(this.monster);
    this.usedStandees = gameManager.monsterManager.monsterStandeeCount(this.monster);
  }

  hasEntity(): boolean {
    return this.monster.entities.find((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == this.type) != undefined;
  }

  open(): void {
    if (!settingsManager.settings.standees) {
      if (this.hasEntity()) {
        this.monster.entities = this.monster.entities.filter((monsterEntity) => monsterEntity.type != this.type);
      } else {
        this.nextStandee();
      }
      gameManager.uiChange.emit();
      return;
    }

    if (this.nonDead >= this.count) {
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
        panelClass: ['dialog'],
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
    const number = gameManager.monsterManager.monsterRandomStandee(this.monster);
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
      const entity = gameManager.monsterManager.addMonsterEntity(this.monster, number, this.monster.bb && this.monster.tags.indexOf('bb-elite') != -1 ? MonsterType.elite : this.type, false);

      if (gameManager.game.state == GameState.next && entity) {
        this.monster.active = !gameManager.game.figures.some((figure) => figure.active);
        if (this.monster.active) {
          gameManager.sortFigures(this.monster);
          entity.active = true;
        }
      }
      gameManager.stateManager.after();
    }
  }
}
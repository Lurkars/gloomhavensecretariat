import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions, ghsValueSign } from 'src/app/ui/helper/Static';
import { EntityMenuDialogComponent } from '../../entity-menu/entity-menu-dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ghs-summon-entity',
  templateUrl: './summon.html',
  styleUrls: ['./summon.scss']
})
export class SummonEntityComponent implements OnInit, OnDestroy {

  @ViewChild('standee', { static: false }) standee!: ElementRef;

  @Input() character!: Character;
  @Input() summon!: Summon;
  SummonState = SummonState;
  ConditionType = ConditionType;
  health: number = 0;
  maxHp: number = 0;
  attack: number = 0;
  movement: number = 0;
  range: number = 0;
  levelDialog: boolean = false;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  activeConditions: EntityCondition[] = [];

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
    if (this.summon.init) {
      setTimeout(() => {
        this.open();
      }, !settingsManager.settings.animations ? 0 : 500)
    }
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update(): void {
    this.activeConditions = gameManager.entityManager.activeConditions(this.summon, true);
    this.summon.immunities.forEach((immunity) => {
      if (!this.activeConditions.find((entityCondition) => entityCondition.name == immunity)) {
        this.activeConditions.push(new EntityCondition(immunity));
      }
    })
  }

  dragHpMove(value: number) {
    this.health = value;
    if (this.summon.health + this.health > this.summon.maxHealth) {
      this.health = EntityValueFunction(this.summon.maxHealth) - this.summon.health;
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0) {
      gameManager.stateManager.before("changeSummonHp", gameManager.characterManager.characterName(this.character), "data.summon." + this.summon.name, ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.summon, this.character, this.health);
      if (this.summon.health <= 0 || this.summon.dead && this.health >= 0 && this.summon.health > 0) {
        this.dead();
      }
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  dragHpCancel(value: number) {
    this.health = 0;
  }

  dead() {
    gameManager.stateManager.before("summonDead", gameManager.characterManager.characterName(this.character), "data.summon." + this.summon.name);
    this.summon.dead = true;

    if (gameManager.game.state == GameState.draw || this.summon.entityConditions.length == 0 || this.summon.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
      setTimeout(() => {
        gameManager.characterManager.removeSummon(this.character, this.summon);
        gameManager.stateManager.after();
      }, !settingsManager.settings.animations ? 0 : 1500);
    }

    gameManager.stateManager.after();
  }

  singleClick() {
    if (this.summon.active) {
      this.toggleActive();
    } else {
      this.open();
    }
  }

  doubleClick() {
    if (this.summon.active) {
      this.open();
    } else {
      this.toggleActive();
    }
  }

  open(): void {
    const dialogRef = this.dialog.open(EntityMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        entity: this.summon,
        figure: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.standee).withPositions(ghsDefaultDialogPositions())
    });

    dialogRef.closed.subscribe({
      next: () => {
        if (this.summon.dead) {
          if (this.summon.active && settingsManager.settings.activeSummons) {
            this.toggleActive();
          }
          this.element.nativeElement.classList.add('dead');
        }
      }
    })
  }

  toggleActive() {
    if (this.summon.active) {
      gameManager.stateManager.before("summonInactive", gameManager.characterManager.characterName(this.character), "data.summon." + this.summon.name);
      if (settingsManager.settings.activeSummons && this.character.active) {
        gameManager.roundManager.toggleFigure(this.character);
      } else {
        this.summon.active = false;
      }
      gameManager.stateManager.after();
    } else {
      gameManager.stateManager.before("summonActive", gameManager.characterManager.characterName(this.character), "data.summon." + this.summon.name);
      const activeSummon = this.character.summons.find((summon) => summon.active);
      if (settingsManager.settings.activeSummons && this.character.active && gameManager.entityManager.isAlive(this.summon, true) && (!activeSummon || this.character.summons.indexOf(activeSummon) < this.character.summons.indexOf(this.summon))) {
        while (!this.summon.active) {
          gameManager.roundManager.toggleFigure(this.character);
        }
      } else {
        this.character.summons.forEach((summon) => summon.active = false);
        this.summon.active = true;
      }
      gameManager.stateManager.after();
    }
  }

  removeCondition(entityCondition: EntityCondition) {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.summon, this.character, "removeCondition"), entityCondition.name);
    gameManager.entityManager.removeCondition(this.summon, entityCondition, entityCondition.permanent);
    gameManager.stateManager.after();
  }
}
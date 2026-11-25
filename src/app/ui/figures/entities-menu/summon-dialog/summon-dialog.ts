import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDefaultDialogPositions, ghsDialogClosingHelper, ghsValueSign } from 'src/app/ui/helper/Static';
import { ValueCalcDirective } from 'src/app/ui/helper/valueCalc';

@Component({
  imports: [NgClass, GhsLabelDirective, ValueCalcDirective],
  selector: 'ghs-summon-dialog',
  templateUrl: 'summon-dialog.html',
  styleUrls: ['../entities-menu-dialog.scss', './summon-dialog.scss']
})
export class SummonDialogComponent implements AfterViewInit {
  private dialogRef = inject(DialogRef);
  dialog = inject(Dialog);
  overlay = inject(Overlay);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  EntityValueFunction = EntityValueFunction;

  readonly summonTitleInput = viewChild.required<ElementRef>('summonTitle');

  character: Character;
  summon: Summon;
  maxHp: number = 0;
  attack: number = 0;
  movement: number = 0;
  range: number = 0;
  health: number = 0;

  SummonColor = SummonColor;

  data: { character: Character; summon: Summon; positionElement: ElementRef } = inject(DIALOG_DATA);

  constructor() {
    this.character = this.data.character;
    this.summon = this.data.summon;

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const summonTitleInput = this.summonTitleInput();
    if (summonTitleInput) {
      summonTitleInput.nativeElement.value = this.summon.title;
    }
  }

  changeMaxHealth(value: number) {
    this.maxHp += value;
    if (EntityValueFunction(this.summon.maxHealth) + this.maxHp < 0) {
      this.maxHp = -EntityValueFunction(this.summon.maxHealth);
    }
  }

  changeAttack(value: number) {
    this.attack += value;
    if (typeof this.summon.attack === 'number' && this.summon.attack + this.attack < 0) {
      this.attack = -this.summon.attack;
    }
  }

  changeMovement(value: number) {
    this.movement += value;
    if (this.summon.movement + this.movement <= 0) {
      this.movement = -this.summon.movement;
    }
  }

  changeRange(value: number) {
    this.range += value;
    if (this.summon.range + this.range <= 0) {
      this.range = -this.summon.range;
    }
  }

  back() {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        figure: this.character,
        entity: this.summon,
        positionElement: this.data.positionElement
      },
      positionStrategy:
        this.data.positionElement &&
        this.overlay.position().flexibleConnectedTo(this.data.positionElement).withPositions(ghsDefaultDialogPositions())
    });

    ghsDialogClosingHelper(this.dialogRef);
  }

  close() {
    if (this.summon.init) {
      this.closeInit();
    } else {
      this.closeEdit();
    }
  }

  private closeInit() {
    gameManager.stateManager.before('addSummon', gameManager.characterManager.characterName(this.character, true, true), this.summon.name);
    gameManager.summonManager.initSummon(this.character, this.summon, {
      health: this.health,
      maxHp: this.maxHp,
      attack: this.attack,
      movement: this.movement,
      range: this.range
    });
    gameManager.stateManager.after();
  }

  private closeEdit() {
    const summonTitleInput = this.summonTitleInput();
    if (summonTitleInput) {
      if (summonTitleInput.nativeElement.value && summonTitleInput.nativeElement.value !== this.summon.title) {
        if (this.summon.title !== summonTitleInput.nativeElement.value) {
          gameManager.entityManager.before(this.summon, this.character, 'setTitle', summonTitleInput.nativeElement.value);
          gameManager.entityManager.setTitle(this.summon, summonTitleInput.nativeElement.value);
          gameManager.stateManager.after();
        }
      } else if (this.summon.title !== '') {
        gameManager.entityManager.before(this.summon, this.character, 'unsetTitle', this.summon.title);
        gameManager.entityManager.setTitle(this.summon, '');
        gameManager.stateManager.after();
      }
    }

    if (this.maxHp) {
      gameManager.stateManager.before(
        'changeSummonMaxHp',
        gameManager.characterManager.characterName(this.character, true, true),
        this.summon.title ? this.summon.title : 'data.summon.' + this.summon.name,
        ghsValueSign(this.maxHp)
      );
      gameManager.summonManager.changeSummonStat(this.summon, 'maxHp', this.maxHp);
      gameManager.stateManager.after();
    }
    if (this.attack !== 0 && typeof this.summon.attack === 'number') {
      gameManager.stateManager.before(
        'changeSummonAttack',
        gameManager.characterManager.characterName(this.character, true, true),
        this.summon.title ? this.summon.title : 'data.summon.' + this.summon.name,
        ghsValueSign(this.attack)
      );
      gameManager.summonManager.changeSummonStat(this.summon, 'attack', this.attack);
      gameManager.stateManager.after();
    }
    if (this.movement !== 0) {
      gameManager.stateManager.before(
        'changeSummonMove',
        gameManager.characterManager.characterName(this.character, true, true),
        this.summon.title ? this.summon.title : 'data.summon.' + this.summon.name,
        ghsValueSign(this.movement)
      );
      gameManager.summonManager.changeSummonStat(this.summon, 'movement', this.movement);
      gameManager.stateManager.after();
    }
    if (this.range !== 0) {
      gameManager.stateManager.before(
        'changeSummonRange',
        gameManager.characterManager.characterName(this.character, true, true),
        this.summon.title ? this.summon.title : 'data.summon.' + this.summon.name,
        ghsValueSign(this.range)
      );
      gameManager.summonManager.changeSummonStat(this.summon, 'range', this.range);
      gameManager.stateManager.after();
    }
  }
}

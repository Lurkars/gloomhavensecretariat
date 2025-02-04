import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Monster } from 'src/app/game/model/Monster';
import { ActionType } from 'src/app/game/model/data/Action';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { EntityMenuDialogComponent } from '../../entity-menu/entity-menu-dialog';
import { MonsterLevelDialogComponent } from '../dialogs/level-dialog';
import { MonsterStatDialogComponent } from './stat-dialog';
import { MonsterStatsDialogComponent } from './stats-dialog';

@Component({
  standalone: false,
  selector: 'ghs-monster-stats',
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss']
})
export class MonsterStatsComponent implements OnInit, OnDestroy {

  @Input() monster!: Monster;
  @Input() forceStats: boolean = false;
  @Input() relative: boolean = false;
  @Input() noClick: boolean = false;
  @Input() disablePoup: boolean = false;
  MonsterType = MonsterType;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  stats: MonsterStat = new MonsterStat(MonsterType.normal);
  hideStats: boolean = false;
  eliteStats: MonsterStat = new MonsterStat(MonsterType.elite);
  hideEliteStats: boolean = false;
  statOverview: boolean = false;
  highlightActions: ActionType[] = [ActionType.shield, ActionType.retaliate];
  edition: string = "";
  catching: boolean = false;
  catched: boolean = false;
  flying: boolean = false;
  monsterCopy!: Monster;

  @ViewChild('levelButton', { read: ElementRef }) levelButton!: ElementRef;

  constructor(private dialog: Dialog, private overlay: Overlay, private element: ElementRef) { }


  ngOnInit(): void {
    this.monsterCopy = JSON.parse(JSON.stringify(this.monster));
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => { this.update(); } });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    if (!settingsManager.settings.statAnimations) {
      this.highlightActions = [];
    } else {
      this.highlightActions = [ActionType.shield, ActionType.retaliate];
    }
    this.edition = gameManager.getEdition(this.monster);
    this.catching = this.monster.pet != undefined && gameManager.buildingsManager.petsAvailable;
    this.catched = this.catching && gameManager.buildingsManager.petsEnabled && gameManager.game.party.pets.find((value) => value.edition == this.monster.edition && value.name == this.monster.pet) != undefined;
    this.setStats();
    this.flying = this.monster.flying && (!this.monster.statEffect || this.monster.statEffect.flying != 'disabled') || this.monster.statEffect != undefined && this.monster.statEffect.flying == true;
  }

  setStats() {
    if (this.monster.boss) {
      this.stats = gameManager.monsterManager.getStat(this.monster, MonsterType.boss);
      this.hideStats = !this.forceStats && settingsManager.settings.hideStats && this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type != MonsterType.boss);
    } else {
      const statsType = !this.monster.bb || this.monster.tags.indexOf('bb-elite') == -1 ? MonsterType.normal : MonsterType.elite;
      this.stats = gameManager.monsterManager.getStat(this.monster, statsType);
      this.hideStats = !this.forceStats && settingsManager.settings.hideStats && this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type != statsType);
      if (!this.monster.bb) {
        this.eliteStats = gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
        this.hideEliteStats = !this.forceStats && settingsManager.settings.hideStats && this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type != MonsterType.elite);
      }
    }
  }

  statsForType(type: MonsterType): MonsterStat {
    return gameManager.monsterManager.getStat(this.monster, type);
  }

  setLevel(value: number) {
    if (value != this.monster.level) {
      gameManager.stateManager.before("setLevel", "data.monster." + this.monster.name, value);
      gameManager.monsterManager.setLevel(this.monster, value);
      gameManager.monsterManager.setLevel(this.monsterCopy, value);
      this.setStats();
      gameManager.stateManager.after();
    }
  }

  openLevelDialog() {
    const levelDialog = this.dialog.open(MonsterLevelDialogComponent, {
      panelClass: ['dialog'],
      data: this.monster,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.levelButton).withPositions(ghsDefaultDialogPositions())
    });
    levelDialog.closed.subscribe({
      next: (level) => {
        if (typeof level == 'number') {
          this.setLevel(level);
        }
      }
    })
  }

  openStatsPopup() {
    if (!this.noClick && !this.monster.bb) {
      this.dialog.open(MonsterStatsDialogComponent, {
        panelClass: ['dialog'],
        data: this.monster
      });
    } else if (!this.disablePoup) {
      this.openStatPopup();
    }
  }

  openStatPopup() {
    if (!this.noClick && !this.disablePoup) {
      this.dialog.open(MonsterStatDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: { monster: this.monster, forceStats: this.forceStats }
      });
    }
  }

  openEntityMenu(event: any): void {
    if (!this.noClick) {
      this.dialog.open(EntityMenuDialogComponent, {
        panelClass: ['dialog'],
        data: {
          entity: undefined,
          figure: this.monster
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.element).withPositions(ghsDefaultDialogPositions())
      });
    }
  }
}
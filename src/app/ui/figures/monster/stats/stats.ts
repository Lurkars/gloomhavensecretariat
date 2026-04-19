import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ActionType } from 'src/app/game/model/data/Action';
import { MonsterStat, MonsterStatEffect } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { MonsterLevelDialogComponent } from 'src/app/ui/figures/monster/dialogs/level-dialog';
import { MonsterStatDialogComponent } from 'src/app/ui/figures/monster/stats/stat-dialog';
import { MonsterStatsDialogComponent } from 'src/app/ui/figures/monster/stats/stats-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { ValueCalcDirective } from 'src/app/ui/helper/valueCalc';

@Component({
  imports: [ActionsComponent, GhsLabelDirective, NgClass, PointerInputDirective, ValueCalcDirective],
  selector: 'ghs-monster-stats',
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterStatsComponent implements OnInit {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private element = inject(ElementRef);
  private ghsManager = inject(GhsManager);

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
  highlightActions: ActionType[] = [];
  edition: string = '';
  catching: boolean = false;
  catched: boolean = false;
  flying: boolean = false;
  level: number = 0;
  statEffect: MonsterStatEffect | undefined;
  monsterCopy!: Monster;

  @ViewChild('levelButton', { read: ElementRef }) levelButton!: ElementRef;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    if (!settingsManager.settings.statAnimations) {
      this.highlightActions = [];
    } else {
      this.highlightActions = [ActionType.shield, ActionType.retaliate, ActionType.custom];
    }
    this.edition = gameManager.getEdition(this.monster);
    this.catching = this.monster.pet !== undefined && gameManager.buildingsManager.petsAvailable;
    this.catched =
      this.catching &&
      gameManager.buildingsManager.petsEnabled &&
      gameManager.game.party.pets.find((value) => value.edition === this.monster.edition && value.name === this.monster.pet) !== undefined;
    this.level = this.monster.level;
    this.statEffect = this.monster.statEffect;
    this.flying =
      (this.monster.flying && (!this.statEffect || this.statEffect.flying !== 'disabled')) ||
      (this.statEffect !== undefined && this.statEffect.flying === true);
    this.setStats();
    this.monsterCopy = JSON.parse(JSON.stringify(this.monster));
  }

  setStats() {
    if (this.monster.boss) {
      this.stats = gameManager.monsterManager.getStat(this.monster, MonsterType.boss);
      this.hideStats =
        !this.forceStats &&
        settingsManager.settings.hideStats &&
        this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type !== MonsterType.boss);
    } else {
      const statsType = !this.monster.bb || !this.monster.tags.includes('bb-elite') ? MonsterType.normal : MonsterType.elite;
      this.stats = gameManager.monsterManager.getStat(this.monster, statsType);
      this.hideStats =
        !this.forceStats &&
        settingsManager.settings.hideStats &&
        this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type !== statsType);
      if (!this.monster.bb) {
        this.eliteStats = gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
        this.hideEliteStats =
          !this.forceStats &&
          settingsManager.settings.hideStats &&
          this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type !== MonsterType.elite);
      }
    }
  }

  statsForType(type: MonsterType): MonsterStat {
    return gameManager.monsterManager.getStat(this.monster, type);
  }

  setLevel(value: number) {
    if (value !== this.monster.level) {
      gameManager.stateManager.before('setLevel', 'data.monster.' + this.monster.name, value);
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
        if (typeof level === 'number') {
          this.setLevel(level);
        }
      }
    });
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

  openEntityMenu(): void {
    if (!this.noClick) {
      this.dialog.open(EntitiesMenuDialogComponent, {
        panelClass: ['dialog'],
        data: {
          entity: undefined,
          figure: this.monster,
          positionElement: this.element
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.element).withPositions(ghsDefaultDialogPositions())
      });
    }
  }
}

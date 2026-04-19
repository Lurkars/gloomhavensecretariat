import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { FigureErrorsComponent } from 'src/app/ui/figures/errors/errors';
import { MonsterAbilityCardComponent } from 'src/app/ui/figures/monster/cards/ability-card';
import { MonsterImageComponent } from 'src/app/ui/figures/monster/cards/image';
import { MonsterNumberPicker } from 'src/app/ui/figures/monster/dialogs/numberpicker';
import { MonsterStatsComponent } from 'src/app/ui/figures/monster/stats/stats';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    TrackUUIDPipe,
    MonsterAbilityCardComponent,
    MonsterImageComponent,
    MonsterNumberPicker,
    MonsterStatsComponent,
    StandeeComponent,
    FigureErrorsComponent
  ],
  selector: 'ghs-monster',
  templateUrl: './monster.html',
  styleUrls: ['./monster.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterComponent implements OnInit {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private ghsManager = inject(GhsManager);

  @Input() monster!: Monster;
  MonsterType = MonsterType;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  off: boolean = false;
  nonDead: number = 0;
  count: number = 0;
  sortedEntites: MonsterEntity[] = [];
  hasEntitiesCache: Record<MonsterType, boolean> = { normal: false, elite: false, boss: false };

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.off = this.monster.off;
    this.nonDead = gameManager.monsterManager.monsterEntityCount(this.monster);
    this.count = gameManager.monsterManager.monsterStandeeMax(this.monster);
    this.sortedEntites = settingsManager.settings.eliteFirst
      ? this.monster.entities.sort(gameManager.monsterManager.sortEntities)
      : this.monster.entities.sort(gameManager.monsterManager.sortEntitiesByNumber);
    this.hasEntitiesCache.normal = this.hasEntities(MonsterType.normal);
    this.hasEntitiesCache.elite = this.hasEntities(MonsterType.elite);
    this.hasEntitiesCache.boss = this.hasEntities(MonsterType.boss);
  }

  isNormal() {
    return this.monster.stats.some((monsterStat) => {
      return monsterStat.type === MonsterType.normal || monsterStat.type === MonsterType.elite;
    });
  }

  getEntities(type: MonsterType): MonsterEntity[] {
    return this.monster.entities.filter((value) => value.type === type).sort((a, b) => a.number - b.number);
  }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  hasEntities(type: MonsterType): boolean {
    const count = this.monster.entities.filter((entity) => entity.type === type).length;
    return count > 1 && count < this.nonDead;
  }

  entitiesMenu(event: any, type: MonsterType | undefined = undefined) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        figure: this.monster,
        type: type
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }
}

import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, Input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ghsDefaultDialogPositions } from '../../helper/Static';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';

@Component({
  standalone: false,
  selector: 'ghs-monster',
  templateUrl: './monster.html',
  styleUrls: ['./monster.scss']
})
export class MonsterComponent implements OnInit {

  @Input() monster!: Monster;
  MonsterType = MonsterType;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  nonDead: number = 0;
  count: number = 0;
  sortedEntites: MonsterEntity[] = [];
  hasEntitiesCache: Record<MonsterType, boolean> = { "normal": false, "elite": false, "boss": false };

  constructor(private dialog: Dialog, private overlay: Overlay, private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }


  update() {
    this.nonDead = gameManager.monsterManager.monsterEntityCount(this.monster);
    this.count = gameManager.monsterManager.monsterStandeeMax(this.monster);
    this.sortedEntites = settingsManager.settings.eliteFirst ? this.monster.entities.sort(gameManager.monsterManager.sortEntities) : this.monster.entities.sort(gameManager.monsterManager.sortEntitiesByNumber);
    this.hasEntitiesCache.normal = this.hasEntities(MonsterType.normal);
    this.hasEntitiesCache.elite = this.hasEntities(MonsterType.elite);
    this.hasEntitiesCache.boss = this.hasEntities(MonsterType.boss);
  }

  isNormal() {
    return this.monster.stats.some((monsterStat) => {
      return monsterStat.type == MonsterType.normal || monsterStat.type == MonsterType.elite;
    });
  }

  getEntities(type: MonsterType): MonsterEntity[] {
    return this.monster.entities.filter((value) => value.type == type).sort((a, b) => a.number - b.number);
  }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  hasEntities(type: MonsterType): boolean {
    const count = this.monster.entities.filter((entity) => entity.type == type).length;
    return count > 1 && count < this.nonDead;
  }

  entitiesMenu(event: any, type: MonsterType | undefined = undefined) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        monster: this.monster,
        type: type
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }
}
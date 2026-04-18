import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { LevelDialogComponent } from 'src/app/ui/footer/level/level-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-level',
  templateUrl: './level.html',
  styleUrls: ['./level.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelComponent {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private ghsManager = inject(GhsManager);

  @ViewChild('levelButton') levelButton!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  level: number = 0;
  trap: number = 0;
  experience: number = 0;
  loot: number = 0;
  hazardousTerrain: number = 0;
  monsterDifficulty: number = 0;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.calculateValues());
  }

  open() {
    const positions = [
      new ConnectionPositionPair({ originX: 'center', originY: 'top' }, { overlayX: 'center', overlayY: 'bottom' }),
      new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' }),
      new ConnectionPositionPair({ originX: 'end', originY: 'top' }, { overlayX: 'end', overlayY: 'bottom' })
    ];

    this.dialog.open(LevelDialogComponent, {
      panelClass: ['dialog'],
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.levelButton).withPositions(positions).withDefaultOffsetY(-10)
    });
  }

  calculateValues() {
    this.level = gameManager.game.level;
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.hazardousTerrain = gameManager.levelManager.terrain();
    this.monsterDifficulty = gameManager.levelManager.bbMonsterDifficutly();

    if (gameManager.trialsManager.activeFavor('fh', 'wealth')) {
      this.loot += gameManager.trialsManager.activeFavor('fh', 'wealth');
    }
  }
}

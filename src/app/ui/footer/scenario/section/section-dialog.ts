import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-section-dialog',
  templateUrl: './section-dialog.html',
  styleUrls: ['./section-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionDialogComponent {
  private dialog = inject(Dialog);
  private dialogRef = inject(DialogRef);

  private cdr = inject(ChangeDetectorRef);

  gameManager: GameManager = gameManager;

  sectionData: ScenarioData = inject(DIALOG_DATA);

  addSection() {
    if (this.sectionData.conclusion) {
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        data: {
          scenario: gameManager.game.scenario,
          success: true,
          conclusion: this.sectionData
        }
      });
      this.close(true);
    } else {
      gameManager.stateManager.before(
        'addSection',
        this.sectionData.index,
        gameManager.scenarioManager.scenarioTitle(this.sectionData, true),
        'data.edition.' + this.sectionData.edition
      );
      gameManager.scenarioManager.addSection(this.sectionData);
      gameManager.stateManager.after();
      this.close(true);
    }
  }

  close(result: boolean) {
    ghsDialogClosingHelper(this.dialogRef, result);
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown', ['$event'])
  confirm(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
      this.addSection();
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

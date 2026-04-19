import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-scenario-conclusion-dialog',
  templateUrl: './scenario-conclusion.html',
  styleUrls: ['./scenario-conclusion.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioConclusionComponent {
  dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;

  data: { conclusions: ScenarioData[]; parent: ScenarioData } = inject(DIALOG_DATA);

  constructor() {
    if (this.data.conclusions.length === 1) {
      this.close(this.data.conclusions[0]);
    }
  }

  close(result: ScenarioData | undefined = undefined) {
    ghsDialogClosingHelper(this.dialogRef, result);
  }
}

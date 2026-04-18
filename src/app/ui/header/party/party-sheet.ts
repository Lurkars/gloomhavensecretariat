import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-party-sheet',
  templateUrl: 'party-sheet.html',
  styleUrls: ['./party-sheet.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartySheetComponent {
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  open(): void {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert']
    });
  }
}

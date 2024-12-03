import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { PartySheetDialogComponent } from "../../figures/party/party-sheet-dialog";

@Component({
	standalone: false,
  selector: 'ghs-party-sheet',
  templateUrl: 'party-sheet.html',
  styleUrls: ['./party-sheet.scss']
})
export class PartySheetComponent {

  gameManager: GameManager = gameManager;

  constructor(private dialog: Dialog) { }

  open(): void {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert']
    });
  }
}
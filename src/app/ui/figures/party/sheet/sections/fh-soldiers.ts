import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { BuildingUpgradeDialog } from 'src/app/ui/figures/party/buildings/upgrade-dialog/upgrade-dialog';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, PointerInputDirective],
  selector: 'ghs-party-sheet-fh-soldiers',
  templateUrl: 'fh-soldiers.html',
  styleUrls: ['../../../sheet.scss', './fh-soldiers.scss']
})
export class PartySheetFhSoldiersComponent extends PartySheetSection {
  setSoldiers(value: number, force: boolean = false) {
    if (this.party.soldiers === value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    if ((value < this.party.soldiers || force) && gameManager.buildingsManager.canSetSoldiers(value, force)) {
      gameManager.stateManager.before('setPartySoldiers', value);
      gameManager.buildingsManager.setSoldiers(value, force);
      gameManager.stateManager.after();
    } else if (this.soldierAvailable() && value === this.party.soldiers + 1) {
      this.dialog
        .open(BuildingUpgradeDialog, {
          panelClass: ['dialog'],
          data: {
            costs: { gold: 3 },
            repair: 1,
            action: 'soldiers'
          }
        })
        .closed.subscribe({
          next: (result) => {
            const payment = result instanceof SelectResourceResult ? result : undefined;
            const force = result === true;
            if (result && gameManager.buildingsManager.canTrainSoldier(payment, force)) {
              gameManager.stateManager.before('setPartySoldiers', value);
              gameManager.buildingsManager.trainSoldier(payment, force);
              gameManager.stateManager.after();
            }
          }
        });
    }
  }
  soldierAvailable(): boolean {
    return gameManager.buildingsManager.soldierTrainable();
  }
}

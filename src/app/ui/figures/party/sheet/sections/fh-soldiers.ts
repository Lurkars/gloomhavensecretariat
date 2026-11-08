import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
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

    if (value < this.party.soldiers || force) {
      gameManager.stateManager.before('setPartySoldiers', value);
      this.party.soldiers = value;
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
            if (result) {
              gameManager.stateManager.before('setPartySoldiers', value);
              this.party.soldiers = value;
              if (result instanceof SelectResourceResult) {
                gameManager.lootManager.applySelectResources(result);
              }
              gameManager.stateManager.after();
            }
          }
        });
    }
  }
  soldierAvailable(): boolean {
    if (!this.party.campaignMode) {
      return true;
    }
    const barracks = this.party.buildings.find(
      (buildingModel) => buildingModel.name === 'barracks' && buildingModel.level > 0 && buildingModel.state === 'normal'
    );
    if (barracks && this.party.soldiers < 2 + barracks.level * 2) {
      const characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
      if (characters.length > 0) {
        const characterGold = characters.map((character) => character.progress.gold).reduce((a, b) => a + b);
        const characterResourses = characters
          .map(
            (character) =>
              (character.progress.loot.hide || 0) + (character.progress.loot.lumber || 0) + (character.progress.loot.metal || 0)
          )
          .reduce((a, b) => a + b);
        const supplyResources = (this.party.loot.hide || 0) + (this.party.loot.lumber || 0) + (this.party.loot.metal || 0);
        if (characterGold > 3 && characterResourses + supplyResources > 0) {
          return true;
        }
      }
    }

    return false;
  }
}

import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { PerkLabelComponent } from 'src/app/ui/figures/attackmodifier/perk/label';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsFloorPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, GhsFloorPipe, PointerInputDirective, TrackUUIDPipe, PerkLabelComponent],
  selector: 'ghs-party-sheet-fh-town-guard',
  templateUrl: 'fh-town-guard.html',
  styleUrls: ['../../../sheet.scss', './fh-town-guard.scss']
})
export class PartySheetFhTownGuardComponent extends PartySheetSection {
  setTownGuardPerks(value: number) {
    if (this.party.townGuardPerks === value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before('setPartyTownGuardPerks', value);
    this.party.townGuardPerks = value;
    gameManager.stateManager.after();
  }
  toggleTownGuardPerkSection(section: string, force: boolean = false) {
    const added = !(this.party.townGuardPerkSections || []).includes(section);
    if (gameManager.outpostAttackManager.townGuardPerkSectionAvailable(section) || force) {
      gameManager.stateManager.before(added ? 'addPartyTownGuardPerkSection' : 'removePartyTownGuardPerkSection', section);
      gameManager.outpostAttackManager.setTownGuardPerkSection(section, added);
      gameManager.stateManager.after();
      if (added) {
        this.finishConclusion(section);
      }
    }
  }
}

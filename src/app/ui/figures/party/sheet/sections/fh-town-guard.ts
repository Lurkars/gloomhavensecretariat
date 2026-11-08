import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
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
    this.party.townGuardPerkSections = this.party.townGuardPerkSections || [];
    const index = this.party.townGuardPerkSections.indexOf(section);
    if (index !== -1 || this.party.townGuardPerkSections.length < Math.floor(this.party.townGuardPerks / 3) || force) {
      gameManager.stateManager.before(index === -1 ? 'addPartyTownGuardPerkSection' : 'removePartyTownGuardPerkSection', section);
      if (index === -1) {
        this.party.townGuardPerkSections.push(section);
        this.finishConclusion(section);
      } else {
        this.party.townGuardPerkSections.splice(index, 1);
      }
      const active = (this.party.townGuardDeck && this.party.townGuardDeck.active) || false;
      const townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(
        this.party,
        gameManager.campaignManager.campaignData()
      );
      townGuardDeck.active = active;
      gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
      this.party.townGuardDeck = townGuardDeck.toModel();

      gameManager.stateManager.after();
    }
  }
}

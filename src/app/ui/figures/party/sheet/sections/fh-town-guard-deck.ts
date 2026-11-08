import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';

@Component({
  imports: [NgClass, AttackModifierDeckComponent],
  selector: 'ghs-party-sheet-fh-town-guard-deck',
  templateUrl: 'fh-town-guard-deck.html',
  styleUrls: ['./fh-town-guard-deck.scss']
})
export class PartySheetFhTownGuardDeckComponent extends PartySheetSection {
  townGuardDeck: AttackModifierDeck | undefined;
  deckModel: string = '';

  override update(): void {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign.townGuardPerks) {
      this.townGuardDeck = undefined;
      return;
    }
    if (this.townGuardDeck && this.deckModel === this.modelKey()) {
      return;
    }
    this.townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.party, campaign);
    if (this.party.townGuardDeck) {
      gameManager.attackModifierManager.fromModel(this.townGuardDeck, this.party.townGuardDeck);
    } else {
      gameManager.attackModifierManager.shuffleModifiers(this.townGuardDeck);
      this.townGuardDeck.active = false;
      this.party.townGuardDeck = this.townGuardDeck.toModel();
    }
    this.deckModel = this.modelKey();
  }

  modelKey(): string {
    return JSON.stringify(this.party.townGuardDeck || null) + '|' + (this.party.townGuardPerkSections || []).join(',');
  }

  beforeTownGuardDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before('updateAttackModifierDeck.' + change.type, 'party.campaign.townGuard', ...change.values);
  }
  afterTownGuardDeck(change: AttackModiferDeckChange) {
    this.townGuardDeck = change.deck;
    this.party.townGuardDeck = this.townGuardDeck.toModel();
    this.deckModel = this.modelKey();
    gameManager.stateManager.after();
  }
  toggleTownGuardDeck() {
    if (this.townGuardDeck) {
      this.beforeTownGuardDeck(
        new AttackModiferDeckChange(
          this.townGuardDeck,
          this.townGuardDeck.active && !gameManager.game.lootDeck.active ? 'amDeckHide' : 'amDeckShow'
        )
      );
      this.townGuardDeck.active = !this.townGuardDeck.active;
      this.afterTownGuardDeck(new AttackModiferDeckChange(this.townGuardDeck, !this.townGuardDeck.active ? 'amDeckHide' : 'amDeckShow'));
    }
  }
}

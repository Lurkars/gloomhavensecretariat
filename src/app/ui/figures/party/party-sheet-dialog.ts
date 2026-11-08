import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Party } from 'src/app/game/model/Party';
import { ScenarioChartDialogComponent } from 'src/app/ui/figures/party/scenario-chart/scenario-chart';
import { PartySheetCampaignComponent } from 'src/app/ui/figures/party/sheet/layouts/campaign';
import { PartySheetFhComponent } from 'src/app/ui/figures/party/sheet/layouts/fh-sheet';
import { PartySheetGhComponent } from 'src/app/ui/figures/party/sheet/layouts/gh-sheet';
import { PartySheetGh2eComponent } from 'src/app/ui/figures/party/sheet/layouts/gh2e-sheet';
import { PartySheetType } from 'src/app/ui/figures/party/sheet/section';
import { PartySheetMenuComponent } from 'src/app/ui/figures/party/sheet/sections/menu';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [
    NgClass,
    PartySheetGhComponent,
    PartySheetFhComponent,
    PartySheetGh2eComponent,
    PartySheetCampaignComponent,
    PartySheetMenuComponent
  ],
  selector: 'ghs-party-sheet-dialog',
  templateUrl: 'party-sheet-dialog.html',
  styleUrls: ['./party-sheet-dialog.scss']
})
export class PartySheetDialogComponent implements OnInit {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  party: Party;
  campaign: boolean = false;
  partyEdition: string = '';
  sheet: PartySheetType = 'gh';
  disableShortcuts: boolean = false;

  data: { campaign: boolean; partySheet: boolean; disableShortcuts: boolean } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      if (this.party !== gameManager.game.party) {
        this.party = gameManager.game.party;
        this.update();
      }
    });
    this.campaign = !!this.data && this.data.campaign;
    this.party = gameManager.game.party;
    this.disableShortcuts = !!this.data && this.data.disableShortcuts;

    if (gameManager.game.edition && !this.party.edition) {
      this.party.edition = gameManager.game.edition;
    }

    if (this.party.edition) {
      this.partyEdition = this.party.edition;
    }

    this.party.casualScenarios = this.party.casualScenarios || [];
    this.party.scenarios = this.party.scenarios || [];
    this.party.availableCharacters = this.party.availableCharacters || [];

    if (!this.campaign && (!this.data || !this.data.partySheet) && this.partyEdition === 'jotl') {
      this.campaign = true;
    }

    if (gameManager.game.conditions && !this.party.conditions) {
      this.party.conditions = gameManager.game.conditions;
    }

    if (gameManager.game.battleGoalEditions && !this.party.battleGoalEditions) {
      this.party.battleGoalEditions = gameManager.game.battleGoalEditions;
    }

    if (gameManager.game.filteredBattleGoals && !this.party.filteredBattleGoals) {
      this.party.filteredBattleGoals = gameManager.game.filteredBattleGoals;
    }

    if (gameManager.game.unlockedCharacters && !this.party.unlockedCharacters) {
      this.party.unlockedCharacters = gameManager.game.unlockedCharacters;
    }

    if (gameManager.game.lootDeckEnhancements && !this.party.lootDeckEnhancements) {
      this.party.lootDeckEnhancements = gameManager.game.lootDeckEnhancements;
    }

    if (gameManager.game.lootDeckFixed && !this.party.lootDeckFixed) {
      this.party.lootDeckFixed = gameManager.game.lootDeckFixed;
    }

    if (gameManager.game.lootDeckSections && !this.party.lootDeckSections) {
      this.party.lootDeckSections = gameManager.game.lootDeckSections;
    }

    gameManager.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .forEach((character) => {
        if (!this.party.players[character.number - 1]) {
          this.party.players[character.number - 1] = '';
        }
      });

    this.party.availableCharacters.forEach((characterModel) => {
      if (!this.party.players[characterModel.number - 1]) {
        this.party.players[characterModel.number - 1] = '';
      }
    });
  }

  ngOnInit(): void {
    this.update();

    this.dialogRef.closed.subscribe({
      next: () => {
        gameManager.trialsManager.applyTrialCards();
      }
    });
  }

  update() {
    this.sheet = gameManager.fhRules() ? 'fh' : !gameManager.editionRules('cs') && gameManager.gh2eRules() ? 'gh2e' : 'gh';
  }

  get worldMap(): boolean {
    const editionData = gameManager.editionData.find((editionData) => this.partyEdition && editionData.edition === this.partyEdition);
    return !!editionData && (!!editionData.worldMap || !!editionData.extendWorldMap);
  }

  @HostListener('document:keydown', ['$event'])
  keyboardShortcuts(event: KeyboardEvent) {
    if (
      settingsManager.settings.keyboardShortcuts &&
      !this.disableShortcuts &&
      (!window.document.activeElement ||
        (window.document.activeElement.tagName !== 'INPUT' &&
          window.document.activeElement.tagName !== 'SELECT' &&
          window.document.activeElement.tagName !== 'TEXTAREA'))
    ) {
      if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'g' && this.worldMap) {
        this.dialogRef.close();
        this.dialog.open(WorldMapComponent, {
          panelClass: ['fullscreen-panel', 'no-dialog-animations'],
          backdropClass: ['fullscreen-backdrop'],
          data: { edition: this.partyEdition }
        });
        event.stopPropagation();
        event.preventDefault();
      } else if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'c' && gameManager.game.edition) {
        this.dialogRef.close();
        this.dialog.open(ScenarioChartDialogComponent, {
          panelClass: ['fullscreen-panel'],
          backdropClass: ['fullscreen-backdrop'],
          data: { edition: this.partyEdition }
        });
        event.stopPropagation();
        event.preventDefault();
      }
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  toggleFhSheet() {
    if (this.sheet !== 'fh') {
      this.sheet = 'fh';
    } else if (!gameManager.fhRules()) {
      this.update();
    } else {
      this.sheet = 'gh';
    }
  }
}

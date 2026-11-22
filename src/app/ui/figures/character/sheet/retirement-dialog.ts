import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Retirement } from 'src/app/game/businesslogic/RetirementManager';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { CharacterMoveResourcesDialog } from 'src/app/ui/figures/character/sheet/move-resources';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-retirement-dialog',
  templateUrl: 'retirement-dialog.html',
  styleUrls: ['./retirement-dialog.scss']
})
export class CharacterRetirementDialog {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  character: Character = inject(DIALOG_DATA);
  retirement: Retirement = gameManager.retirementManager.retirement(this.character);
  additional: boolean = false;

  get conclusion(): ScenarioData | undefined {
    return this.retirement.conclusion;
  }
  get personalQuestConclusion(): ScenarioData | undefined {
    return this.retirement.personalQuestConclusion;
  }
  get alreadyRetired(): boolean {
    return this.retirement.alreadyRetired;
  }
  get hasResources(): boolean {
    return this.retirement.hasResources;
  }
  get personalQuest(): PersonalQuest | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.personalQuest;
  }
  get personalQuestBuilding(): BuildingData | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.building;
  }
  get unlockEvent(): string {
    return (this.retirement.personalQuest && this.retirement.personalQuest.unlockEvent) || '';
  }
  get characterAlreadyUnlocked(): boolean {
    return !!this.retirement.personalQuest && this.retirement.personalQuest.characterAlreadyUnlocked;
  }
  get characterScenario(): ScenarioData | boolean | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.characterScenario;
  }
  get characterItemDesign(): ItemData | boolean | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.characterItemDesign;
  }
  get envelopeAlreadyUnlocked(): boolean {
    return !!this.retirement.personalQuest && this.retirement.personalQuest.envelopeAlreadyUnlocked;
  }
  get envelopeSection(): ScenarioData | boolean | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.envelopeSection;
  }
  get envelopeItemBlueprint(): ItemData | boolean | undefined {
    return this.retirement.personalQuest && this.retirement.personalQuest.envelopeItemBlueprint;
  }
  get additionalPQ(): PersonalQuest | undefined {
    return this.retirement.additional && this.retirement.additional.personalQuest;
  }
  get additionalPQBuilding(): BuildingData | undefined {
    return this.retirement.additional && this.retirement.additional.building;
  }
  get additionalUnlockEvent(): string {
    return (this.retirement.additional && this.retirement.additional.unlockEvent) || '';
  }
  get additionalCharacterAlreadyUnlocked(): boolean {
    return !!this.retirement.additional && this.retirement.additional.characterAlreadyUnlocked;
  }
  get additionalCharacterScenario(): ScenarioData | boolean | undefined {
    return this.retirement.additional && this.retirement.additional.characterScenario;
  }
  get additionalCharacterItemDesign(): ItemData | boolean | undefined {
    return this.retirement.additional && this.retirement.additional.characterItemDesign;
  }
  get additionalEnvelopeAlreadyUnlocked(): boolean {
    return !!this.retirement.additional && this.retirement.additional.envelopeAlreadyUnlocked;
  }
  get additionalEnvelopeSection(): ScenarioData | boolean | undefined {
    return this.retirement.additional && this.retirement.additional.envelopeSection;
  }
  get additionalEnvelopeItemBlueprint(): ItemData | boolean | undefined {
    return this.retirement.additional && this.retirement.additional.envelopeItemBlueprint;
  }

  openConclusions(conclusions: ScenarioData[]) {
    if (conclusions.length == 0) {
      return;
    }
    const conclusionSection = conclusions[conclusions.length - 1];
    const childConclusions: ScenarioData[] = gameManager.scenarioManager.sectionConclusions(
      conclusionSection.index,
      conclusionSection.edition,
      true
    );
    if (gameManager.scenarioManager.hasOpenConclusions(conclusionSection.index, conclusionSection.edition, true)) {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: {
            conclusions: childConclusions,
            parent: gameManager
              .sectionData(conclusionSection.edition)
              .find((sectionData) => sectionData.index === conclusionSection.index && !sectionData.group)
          }
        })
        .closed.subscribe({
          next: (chosenConclusion) => {
            conclusions.push(chosenConclusion as ScenarioData);
            this.openConclusions(conclusions);
          }
        });
    } else {
      const conclusion = conclusions.pop();
      this.dialog
        .open(ScenarioSummaryComponent, {
          panelClass: ['dialog'],
          data: {
            scenario: conclusion,
            conclusionOnly: true,
            rewardsOnly: !!conclusion && gameManager.scenarioManager.conclusionFinished(conclusion)
          }
        })
        .closed.subscribe({ next: () => this.openConclusions(conclusions) });
    }
  }

  moveResources() {
    this.dialog.open(CharacterMoveResourcesDialog, {
      panelClass: ['dialog'],
      data: { character: this.character, all: true }
    });
  }

  apply() {
    ghsDialogClosingHelper(this.dialogRef, true);
    gameManager.stateManager.before('setRetired', gameManager.characterManager.characterName(this.character, true, true));
    const conclusions = gameManager.retirementManager.retire(this.retirement, this.additional);
    gameManager.stateManager.after();
    this.openConclusions(conclusions);
  }

  changeAdditionalPQ(event: any) {
    gameManager.retirementManager.setAdditionalQuest(this.retirement, event.target.value);
  }

  itemDialog(item: ItemData) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { item: item }
    });
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

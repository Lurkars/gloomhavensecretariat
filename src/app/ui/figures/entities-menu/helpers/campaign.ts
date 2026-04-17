import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { EventRandomItemDialogComponent } from 'src/app/ui/figures/entities-menu/random-item/random-item-dialog';
import { EventRandomScenarioDialogComponent } from 'src/app/ui/figures/entities-menu/random-scenario/random-scenario-dialog';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { ghsValueSign } from 'src/app/ui/helper/Static';

export class CampaignHelper {
  prosperity: number = 0;
  reputation: number = 0;

  // FH
  morale: number = 0;
  inspiration: number = 0;

  // GH2E
  factions: string[] = [];
  factionReputation: Partial<Record<string, number>> = {};

  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.factions = [];
    if (gameManager.gh2eRules()) {
      const campaign = gameManager.campaignData();
      if (campaign && campaign.factions) {
        this.factions = campaign.factions;
      }
    }
  }

  close() {
    if (this.prosperity != 0) {
      gameManager.stateManager.before('eventEffect.prosperity', ghsValueSign(this.prosperity));
      gameManager.game.party.prosperity += this.prosperity;
      gameManager.stateManager.after();
    }

    if (this.reputation != 0) {
      gameManager.stateManager.before('eventEffect.reputation', ghsValueSign(this.reputation));
      gameManager.game.party.reputation += this.reputation;
      gameManager.stateManager.after();
    }

    if (this.morale != 0) {
      gameManager.stateManager.before('eventEffect.morale', ghsValueSign(this.morale));
      gameManager.game.party.morale += this.morale;
      gameManager.stateManager.after();
    }

    if (this.inspiration != 0) {
      gameManager.stateManager.before('eventEffect.inspiration', ghsValueSign(this.inspiration));
      gameManager.game.party.inspiration += this.inspiration;
      gameManager.stateManager.after();
    }

    this.factions.forEach((faction) => {
      if (this.factionReputation[faction]) {
        gameManager.stateManager.before('eventEffect.factionReputation', ghsValueSign(this.factionReputation[faction] || 0), faction);
        gameManager.game.party.factionReputation[faction] =
          (gameManager.game.party.factionReputation[faction] || 0) + (this.factionReputation[faction] || 0);
        gameManager.stateManager.after();
      }
    });
  }

  changeFactionReputation(faction: string, value: number) {
    this.factionReputation[faction] = (this.factionReputation[faction] || 0) + value;
  }

  drawRandomItem(blueprint: boolean = false) {
    const itemData = gameManager.itemManager.drawRandomItem(gameManager.currentEdition(), blueprint);
    if (itemData) {
      this.component.dialog
        .open(EventRandomItemDialogComponent, {
          panelClass: ['dialog'],
          data: { item: itemData, blueprint: blueprint }
        })
        .closed.subscribe({
          next: (result: unknown) => {
            if (result) {
              const itemData = result as ItemData;
              gameManager.stateManager.before(
                'eventEffect.drawRandomItem' + (blueprint ? 'Blueprint' : ''),
                itemData.id,
                itemData.edition,
                itemData.name
              );
              gameManager.game.party.unlockedItems.push(new CountIdentifier(itemData.id, itemData.edition));
              gameManager.stateManager.after();
            }
          }
        });
    } else if (blueprint) {
      this.inspiration++;
    }
  }

  drawRandomScenario(section: boolean = false) {
    const scenarioData = section
      ? gameManager.scenarioManager.drawRandomScenarioSection(gameManager.currentEdition())
      : gameManager.scenarioManager.drawRandomScenario(gameManager.currentEdition());
    if (scenarioData) {
      this.component.dialog
        .open(EventRandomScenarioDialogComponent, {
          panelClass: ['dialog'],
          data: { scenario: scenarioData, section: section }
        })
        .closed.subscribe({
          next: (result: unknown) => {
            if (result) {
              const scenarioData = result as ScenarioData;
              if (section) {
                const unlocks = scenarioData.unlocks
                  ? scenarioData.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ')
                  : '';
                gameManager.stateManager.before(
                  'eventEffect.drawRandomScenarioSection',
                  scenarioData.index,
                  scenarioData.edition,
                  scenarioData.name,
                  unlocks
                );
                gameManager.game.party.conclusions.push(
                  new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group)
                );
                gameManager.stateManager.after();
              } else {
                gameManager.stateManager.before(
                  'eventEffect.drawRandomScenario',
                  scenarioData.index,
                  scenarioData.edition,
                  scenarioData.name
                );
                gameManager.game.party.manualScenarios.push(
                  new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group)
                );
                gameManager.stateManager.after();
              }
            }
          }
        });
    } else if (section) {
      this.inspiration++;
    }
  }

  openPartySheet() {
    this.component.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { partySheet: true }
    });
  }
}

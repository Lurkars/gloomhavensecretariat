import { Component, OnInit, inject, input } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { Party } from 'src/app/game/model/Party';
import { BuildingsListComponent } from 'src/app/ui/figures/party/buildings/list/buildings-list';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

export type Building = { model: BuildingModel; data: BuildingData };

@Component({
  imports: [BuildingsListComponent, GhsLabelDirective],
  selector: 'ghs-party-buildings',
  templateUrl: 'buildings.html',
  styleUrls: ['./buildings.scss']
})
export class PartyBuildingsComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly inputParty = input.required<Party>({ alias: 'party' });
  get party(): Party {
    return this.inputParty();
  }

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  buildings: Building[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.updateBuildings();
    });
  }

  ngOnInit(): void {
    this.updateBuildings();
  }

  updateBuildings() {
    this.buildings = [];
    const campaign = gameManager.campaignManager.campaignData();

    this.party.buildings.forEach((model) => {
      const data = campaign.buildings.find((buildingData) => buildingData.name === model.name);
      if (data) {
        this.buildings.push({ model: model, data: data });
      }
    });

    this.buildings.sort((a, b) => {
      if (a.model.level && !b.model.level) {
        return -1;
      } else if (!a.model.level && b.model.level) {
        return 1;
      }

      if (a.data.id && b.data.id) {
        return a.data.id < b.data.id ? -1 : 1;
      } else if (a.data.id) {
        return -1;
      } else if (b.data.id) {
        return 1;
      }

      if (a.model.level === b.model.level) {
        return a.data.name < b.data.name ? -1 : 1;
      } else {
        return b.model.level - a.model.level;
      }
    });
  }

  unlockBuilding(buildingElement: HTMLInputElement) {
    const buildingData = gameManager.buildingsManager.findBuilding(buildingElement.value);
    if (buildingData && gameManager.buildingsManager.canAddBuilding(buildingData)) {
      gameManager.stateManager.before('addBuilding', buildingData.id, buildingData.name);
      gameManager.buildingsManager.addBuilding(buildingData);
      this.updateBuildings();
      buildingElement.value = '';
      gameManager.stateManager.after();
    }
  }
}

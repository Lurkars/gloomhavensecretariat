import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { BuildingModel } from "src/app/game/model/Building";
import { Party } from "src/app/game/model/Party";
import { BuildingData } from "src/app/game/model/data/BuildingData";

export type Building = { model: BuildingModel, data: BuildingData };

@Component({
  standalone: false,
  selector: 'ghs-party-buildings',
  templateUrl: 'buildings.html',
  styleUrls: ['./buildings.scss']
})
export class PartyBuildingsComponent implements OnInit, OnDestroy {
  @Input() party!: Party;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  buildings: Building[] = [];

  ngOnInit(): void {
    this.updateBuildings();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.party = gameManager.game.party;
        this.updateBuildings();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  updateBuildings() {
    this.buildings = [];
    const campaign = gameManager.campaignData();

    campaign.buildings.filter((buildingData) => gameManager.buildingsManager.initialBuilding(buildingData)).forEach((buildingData) => {
      if (!this.party.buildings.find((model) => buildingData.name == model.name)) {
        this.party.buildings.push(new BuildingModel(buildingData.name, 1));
        if (buildingData.rewards[0]) {
          gameManager.buildingsManager.applyRewards(buildingData.rewards[0]);
        }
      }
    })

    campaign.buildings.filter((buildingData) => buildingData.prosperityUnlock && buildingData.costs.prosperity <= gameManager.prosperityLevel()).forEach((buildingData) => {
      if (!this.party.buildings.find((model) => buildingData.name == model.name)) {
        if (!buildingData.requires || this.party.buildings.find((model) => model.name == buildingData.requires && model.level))
          this.party.buildings.push(new BuildingModel(buildingData.name, 0));
      }
    })

    this.party.buildings.forEach((model) => {
      const data = campaign.buildings.find((buildingData) => buildingData.name == model.name);
      if (data) {
        this.buildings.push({ model: model, data: data });
      }
    })

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

      if (a.model.level == b.model.level) {
        return a.data.name < b.data.name ? -1 : 1;
      } else {
        return b.model.level - a.model.level;
      }
    })
  }

  unlockBuilding(buildingElement: HTMLInputElement) {
    const building = buildingElement.value;
    this.party.buildings = this.party.buildings || [];
    const campaign = gameManager.campaignData();
    if (campaign.buildings && building) {
      const buildingData = campaign.buildings.find((buildingData) => buildingData.name == building.toLowerCase().replaceAll(' ', '-') || buildingData.id == building || !isNaN(+buildingData.id) && !isNaN(+building) && +buildingData.id == +building);
      if (buildingData && !this.party.buildings.find((buildingModel) => buildingModel.name == buildingData.name)) {
        gameManager.stateManager.before("addBuilding", buildingData.id, buildingData.name);
        this.party.buildings.push(new BuildingModel(buildingData.name, 0));
        this.updateBuildings();
        buildingElement.value = "";
        gameManager.stateManager.after();
      }
    }
  }

}
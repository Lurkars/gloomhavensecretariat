import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Party } from "src/app/game/model/Party";
import { BuildingCosts, BuildingData, BuildingModel } from "src/app/game/model/data/BuildingData";
import { CampaignData } from "src/app/game/model/data/EditionData";
import { LootType } from "src/app/game/model/data/Loot";
import { BuildingRepairDialog } from "./repair";
import { Character } from "src/app/game/model/Character";
import { SelectGoldDialog } from "./select-gold/select-gold";

export type Building = { model: BuildingModel, data: BuildingData };

@Component({
  selector: 'ghs-party-buildings',
  templateUrl: 'buildings.html',
  styleUrls: ['./buildings.scss']
})
export class PartyBuildingsComponent implements OnInit {

  gameManager: GameManager = gameManager;
  @Input() party!: Party;

  buildings: Building[] = [];

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    this.updateBuildings();
    gameManager.uiChange.subscribe({
      next: () => {
        this.party = gameManager.game.party;
        this.updateBuildings();
      }
    })
  }

  updateBuildings() {
    this.buildings = [];
    const campaign = this.campaignData();
    if (campaign) {

      campaign.buildings.filter((buildingData) => this.initialBuilding(buildingData)).forEach((buildingData) => {
        if (!this.party.buildings.find((model) => buildingData.name == model.name)) {
          this.party.buildings.push(new BuildingModel(buildingData.name, 1));
        }
      })

      campaign.buildings.filter((buildingData) => buildingData.prosperityUnlock && buildingData.costs.prosperity <= gameManager.prosperityLevel()).forEach((buildingData) => {
        if (!this.party.buildings.find((model) => buildingData.name == model.name)) {
          if (!buildingData.requires || this.party.buildings.find((model) => model.name == buildingData.requires))
            this.party.buildings.push(new BuildingModel(buildingData.name, 0));
        }
      })

      this.party.buildings.forEach((model) => {
        const data = campaign.buildings.find((buildingData) => buildingData.name == model.name);
        if (data) {
          this.buildings.push({ model: model, data: data });
        }
      })
    }

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

  initialBuilding(buildingData: BuildingData): boolean {
    return buildingData.costs.prosperity == 0 && buildingData.costs.lumber == 0 && buildingData.costs.metal == 0 && buildingData.costs.hide == 0 && buildingData.costs.gold == 0;
  }

  campaignData(): CampaignData | undefined {
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition());

    if (editionData && editionData.campaign) {
      return editionData.campaign;
    }

    return undefined;
  }

  unlockBuilding(buildingElement: HTMLInputElement) {
    const building = buildingElement.value;
    this.party.buildings = this.party.buildings || [];
    const campaign = this.campaignData();
    if (campaign && campaign.buildings && building) {
      const buildingData = campaign.buildings.find((buildingData) => buildingData.name == building.toLowerCase().replaceAll(' ', '-') || buildingData.id == building);
      if (buildingData && !this.party.buildings.find((buildingModel) => buildingModel.name == buildingData.name)) {
        gameManager.stateManager.before("addBuilding", "data.buildings." + buildingData.name);
        this.party.buildings.push(new BuildingModel(buildingData.name, 0));
        this.updateBuildings();
        buildingElement.value = "";
        gameManager.stateManager.after();
      }
    }
  }

  upgradeable(building: Building): boolean {

    let costs: BuildingCosts = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
    if (building.model.level && !building.data.repair) {
      return false;
    }

    if (building.data.repair && building.model.state == "damaged") {
      const totalCosts = building.data.repair[building.model.level - 1];
      return ((this.party.loot[LootType.lumber] || 0) + (this.party.loot[LootType.metal] || 0) + (this.party.loot[LootType.hide] || 0)) > totalCosts;
    }

    if (building.model.state == 'wrecked') {
      costs = building.data.rebuild[building.model.level - 1];
      if (costs.lumber > (this.party.loot[LootType.lumber] || 0)) {
        return false;
      } else if (costs.metal > (this.party.loot[LootType.metal] || 0)) {
        return false;
      } else if (costs.hide > (this.party.loot[LootType.hide] || 0)) {
        return false;
      }
      return true;
    } else if (building.model.level < building.data.upgrades.length + 1) {
      if (costs.prosperity && costs.prosperity > gameManager.prosperityLevel()) {
        return false;
      } else if ((costs.lumber || 0) > (this.party.loot[LootType.lumber] || 0)) {
        return false;
      } else if ((costs.metal || 0) > (this.party.loot[LootType.metal] || 0)) {
        return false;
      } else if ((costs.hide || 0) > (this.party.loot[LootType.hide] || 0)) {
        return false;
      } else if ((costs.gold || 0) > gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).progress.gold).reduce((a, b) => a + b)) {
        return false;
      }
      return true;
    }

    return false;
  }

  upgrade(building: Building, force: boolean = false) {
    if (building.model.level < building.data.upgrades.length + 1 || building.model.level < building.data.manualUpgrades + 1) {
      if (this.upgradeable(building) || force) {
        const costs = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
        if (costs.gold && !force) {
          this.dialog.open(SelectGoldDialog, {
            panelClass: ['dialog'],
            data: { min: costs.gold, max: costs.gold }
          }).closed.subscribe({
            next: (value) => {
              if (value && (+value) >= costs.gold) {
                this.upgradeIntern(building, force);
              }
            }
          })
        } else {
          this.upgradeIntern(building, force);
        }
      }
    }
  }

  upgradeIntern(building: Building, force: boolean) {
    const costs = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
    gameManager.stateManager.before(building.model.level ? "upgradeBuilding" : "buildBuilding", "data.buildings." + building.model.name, '' + (building.model.level + 1));
    if (!force) {
      // TODO Gold
      this.party.loot[LootType.lumber] = (this.party.loot[LootType.lumber] || 0) - costs.lumber;
      this.party.loot[LootType.metal] = (this.party.loot[LootType.metal] || 0) - costs.metal;
      this.party.loot[LootType.hide] = (this.party.loot[LootType.hide] || 0) - costs.hide;
    }
    building.model.level++;
    gameManager.stateManager.after();
  }

  rebuild(building: Building, force: boolean = false) {
    if (building.model.state == 'wrecked') {
      if (this.upgradeable(building) || force) {
        gameManager.stateManager.before("rebuildBuilding", "data.buildings." + building.model.name);
        if (!force) {
          const costs = building.data.rebuild[building.model.level - 1];
          this.party.loot[LootType.lumber] = (this.party.loot[LootType.lumber] || 0) - costs.lumber;
          this.party.loot[LootType.metal] = (this.party.loot[LootType.metal] || 0) - costs.metal;
          this.party.loot[LootType.hide] = (this.party.loot[LootType.hide] || 0) - costs.hide;
        }
        building.model.state = 'normal';
        gameManager.stateManager.after();
      }
    }
  }

  repair(building: Building, force: boolean = false) {
    if (building.model.state == 'damaged') {
      if (this.upgradeable(building) || force) {
        if (!force) {
          this.dialog.open(BuildingRepairDialog, {
            panelClass: ['dialog'],
            data: building
          });
        } else {
          gameManager.stateManager.before("repairBuilding", "data.buildings." + building.model.name);
          building.model.state = 'normal';
          gameManager.stateManager.after();
        }
      }
    }
  }


  toggleState(building: Building, force: boolean = false) {
    if (building.data.repair) {
      if (building.model.level > 0) {
        if (building.model.state == 'normal') {
          gameManager.stateManager.before("changeBuildingState", building.model.name, 'damaged');
          building.model.state = 'damaged';
          gameManager.stateManager.after();
        } else if (building.model.state == 'damaged') {
          gameManager.stateManager.before("changeBuildingState", building.model.name, 'wrecked');
          building.model.state = 'wrecked'
          gameManager.stateManager.after();
        } else if (force && building.model.state == 'wrecked') {
          gameManager.stateManager.before("changeBuildingState", building.model.name, 'normal');
          building.model.state = 'normal';
          gameManager.stateManager.after();
        }
      }
    }
  }

  downgrade(building: Building, force: boolean = false) {
    const index = this.party.buildings.indexOf(building.model);
    if (index != -1) {
      if (!this.initialBuilding(building.data) && (building.model.level == 0 || force)) {
        gameManager.stateManager.before("removeBuilding", "data.buildings." + building.model.name);
        this.party.buildings.splice(index, 1);
        gameManager.stateManager.after();
      } else if (!this.initialBuilding(building.data) || building.model.level > 1) {
        gameManager.stateManager.before("downgradeBuilding", building.model.name, '' + (building.model.level - 1));
        building.model.level--;
        gameManager.stateManager.after();
      }
      this.updateBuildings();
    }
  }

}
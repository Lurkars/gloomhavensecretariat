import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Party } from "src/app/game/model/Party";
import { BuildingCosts, BuildingData, BuildingModel } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";
import { Character } from "src/app/game/model/Character";
import { SelectResourceResult, SelectResourcesDialog } from "./select-resources/select-resources";

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
    const campaign = gameManager.campaignData();

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

  unlockBuilding(buildingElement: HTMLInputElement) {
    const building = buildingElement.value;
    this.party.buildings = this.party.buildings || [];
    const campaign = gameManager.campaignData();
    if (campaign.buildings && building) {
      const buildingData = campaign.buildings.find((buildingData) => buildingData.name == building.toLowerCase().replaceAll(' ', '-') || buildingData.id == building || !isNaN(+buildingData.id) && !isNaN(+building) && +buildingData.id == +building);
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
      if (force) {
        gameManager.stateManager.before(building.model.level ? "upgradeBuilding" : "buildBuilding", "data.buildings." + building.model.name, '' + (building.model.level + 1));
        building.model.level++;
        gameManager.stateManager.after();
      } else if (this.upgradeable(building)) {
        const costs = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
        this.dialog.open(SelectResourcesDialog, {
          panelClass: ['dialog'],
          data: {
            costs: costs,
            building: building.data,
            action: building.model.level > 0 ? 'upgrade' : 'build'
          }
        }).closed.subscribe({
          next: (result) => {
            if (result instanceof SelectResourceResult) {
              gameManager.stateManager.before(building.model.level ? "upgradeBuilding" : "buildBuilding", "data.buildings." + building.model.name, '' + (building.model.level + 1));
              this.applySelectResources(result);
              building.model.level++;
              gameManager.stateManager.after();
            }
          }
        })
      }
    }
  }

  upgradeIntern(building: Building, force: boolean) {
    const costs = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
    gameManager.stateManager.before(building.model.level ? "upgradeBuilding" : "buildBuilding", "data.buildings." + building.model.name, '' + (building.model.level + 1));
    if (!force) {
      this.party.loot[LootType.lumber] = (this.party.loot[LootType.lumber] || 0) - costs.lumber;
      this.party.loot[LootType.metal] = (this.party.loot[LootType.metal] || 0) - costs.metal;
      this.party.loot[LootType.hide] = (this.party.loot[LootType.hide] || 0) - costs.hide;
    }
    building.model.level++;
    gameManager.stateManager.after();
  }

  rebuild(building: Building, force: boolean = false) {
    if (building.model.state == 'wrecked') {
      if (this.upgradeable(building)) {
        if (force) {
          gameManager.stateManager.before("rebuildBuilding", "data.buildings." + building.model.name);
          building.model.state = 'normal';
          gameManager.stateManager.after();
        } else {
          this.dialog.open(SelectResourcesDialog, {
            panelClass: ['dialog'],
            data: {
              costs: building.data.rebuild[building.model.level - 1],
              building: building.data,
              action: 'rebuild'
            }
          }).closed.subscribe({
            next: (result) => {
              if (result instanceof SelectResourceResult) {
                gameManager.stateManager.before("rebuildBuilding", "data.buildings." + building.model.name);
                this.applySelectResources(result);
                building.model.state = 'normal';
                gameManager.stateManager.after();
              }
            }
          })
        }
      }
    }
  }

  repair(building: Building, force: boolean = false) {
    if (building.model.state == 'damaged') {
      if (this.upgradeable(building) || force) {
        if (!force) {
          this.dialog.open(SelectResourcesDialog, {
            panelClass: ['dialog'],
            data: {
              repair: building.data.repair && building.data.repair[building.model.level - 1],
              building: building.data,
              action: 'repair'
            }
          }).closed.subscribe({
            next: (result) => {
              if (result instanceof SelectResourceResult) {
                gameManager.stateManager.before("repairBuilding", "data.buildings." + building.data.name);
                this.applySelectResources(result);
                building.model.state = 'normal';
                gameManager.stateManager.after();
              }
            }
          })
        } else {
          gameManager.stateManager.before("repairBuilding", "data.buildings." + building.model.name);
          building.model.state = 'normal';
          gameManager.stateManager.after();
        }
      }
    }
  }

  applySelectResources(result: SelectResourceResult) {
    result.characters.forEach((character, index) => {
      if (result.characterSpent[index].gold) {
        character.progress.gold -= result.characterSpent[index].gold;
      }
      if (result.characterSpent[index].hide) {
        character.progress.loot[LootType.hide] = (character.progress.loot[LootType.hide] || 0) - (result.characterSpent[index].hide);
      }
      if (result.characterSpent[index].lumber) {
        character.progress.loot[LootType.lumber] = (character.progress.loot[LootType.lumber] || 0) - (result.characterSpent[index].lumber);
      }
      if (result.characterSpent[index].metal) {
        character.progress.loot[LootType.metal] = (character.progress.loot[LootType.metal] || 0) - (result.characterSpent[index].metal);
      }
    })
    if (result.fhSupportSpent.hide) {
      gameManager.game.party.loot[LootType.hide] = (gameManager.game.party.loot[LootType.hide] || 0) - (result.fhSupportSpent.hide);
    }
    if (result.fhSupportSpent.lumber) {
      gameManager.game.party.loot[LootType.lumber] = (gameManager.game.party.loot[LootType.lumber] || 0) - (result.fhSupportSpent.lumber);
    }
    if (result.fhSupportSpent.metal) {
      gameManager.game.party.loot[LootType.metal] = (gameManager.game.party.loot[LootType.metal] || 0) - (result.fhSupportSpent.metal);
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
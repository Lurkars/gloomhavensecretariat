import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, inject, input, output } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingCosts, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { ItemsBrewDialog } from 'src/app/ui/figures/items/brew/brew';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { GardenComponent } from 'src/app/ui/figures/party/buildings/garden/garden';
import { StablesComponent } from 'src/app/ui/figures/party/buildings/stables/stables';
import { BuildingUpgradeDialog } from 'src/app/ui/figures/party/buildings/upgrade-dialog/upgrade-dialog';
import { openConclusionChoice } from 'src/app/ui/figures/party/week-sections/week-sections';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, GhsTooltipDirective, NgClass, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-buildings-list',
  templateUrl: 'buildings-list.html',
  styleUrls: ['./buildings-list.scss']
})
export class BuildingsListComponent {
  private dialog = inject(Dialog);

  private cdr = inject(ChangeDetectorRef);

  readonly inputBuildings = input.required<Building[]>({ alias: 'buildings' });
  get buildings(): Building[] {
    return this.inputBuildings();
  }

  readonly short = input<boolean>(false);
  readonly invert = input<boolean>(false);

  readonly changed = output<void>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  upgradeable(building: Building): boolean {
    return gameManager.buildingsManager.upgradeable(building.data, building.model);
  }

  upgrade(building: Building, force: boolean = false) {
    if (building.model.level < building.data.upgrades.length + 1) {
      if (this.upgradeable(building) || force) {
        this.dialog
          .open(BuildingUpgradeDialog, {
            panelClass: ['dialog'],
            data: {
              costs: gameManager.buildingsManager.upgradeCosts(building.data, building.model),
              building: building,
              action: building.model.level > 0 ? 'upgrade' : 'build',
              force: force
            }
          })
          .closed.subscribe({
            next: (result) => {
              if ((force && result === true) || result instanceof SelectResourceResult) {
                setTimeout(() => {
                  gameManager.stateManager.before(
                    building.model.level ? 'upgradeBuilding' : 'buildBuilding',
                    building.data.id,
                    building.model.name,
                    building.model.level + 1
                  );
                  const rewards = gameManager.buildingsManager.upgradeBuilding(
                    building.data,
                    building.model,
                    !force && result instanceof SelectResourceResult ? result : undefined
                  );
                  if (rewards && rewards.section) {
                    this.openConclusion(rewards.section);
                  }
                  gameManager.stateManager.after();
                  this.cdr.markForCheck();
                }, 1);
              }
            }
          });
      }
    }
  }

  openConclusion(index: string) {
    const conclusion = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => sectionData.index === index);
    if (conclusion) {
      const scenario = new Scenario(conclusion as ScenarioData);
      if (this.hasConclusions(scenario.index)) {
        this.openConclusions(scenario.index);
      } else {
        this.dialog.open(ScenarioSummaryComponent, {
          panelClass: ['dialog'],
          data: {
            scenario: scenario,
            conclusionOnly: true
          }
        });
      }
    }
  }

  hasConclusions(section: string): boolean {
    return gameManager.scenarioManager.hasOpenConclusions(section);
  }

  openConclusions(section: string) {
    const conclusions: ScenarioData[] = gameManager.scenarioManager.sectionConclusions(section, gameManager.game.edition, true);
    openConclusionChoice(this.dialog, section, conclusions, (conclusion) => this.openConclusion(conclusion.index));
  }

  rebuild(building: Building, force: boolean = false) {
    if (building.model.state === 'wrecked') {
      if (this.upgradeable(building) || force) {
        this.dialog
          .open(BuildingUpgradeDialog, {
            panelClass: ['dialog'],
            data: {
              costs: building.data.rebuild[building.model.level - 1],
              building: building,
              action: 'rebuild',
              force: force
            }
          })
          .closed.subscribe({
            next: (result) => {
              if ((force && result === true) || result instanceof SelectResourceResult) {
                gameManager.stateManager.before('rebuildBuilding', building.data.id, building.model.name);
                gameManager.buildingsManager.rebuildBuilding(
                  building.model,
                  !force && result instanceof SelectResourceResult ? result : undefined
                );
                gameManager.stateManager.after();
                this.cdr.markForCheck();
              }
            }
          });
      }
    }
  }

  repair(building: Building, force: boolean = false) {
    if (building.model.state === 'damaged') {
      if (force) {
        gameManager.stateManager.before('repairBuilding', building.data.id, building.data.name);
        gameManager.buildingsManager.repairBuilding(building.model);
        gameManager.stateManager.after();
      } else if (this.upgradeable(building)) {
        this.dialog
          .open(BuildingUpgradeDialog, {
            panelClass: ['dialog'],
            data: {
              repair: building.data.repair && building.data.repair[building.model.level - 1],
              building: building,
              action: 'repair',
              force: force
            }
          })
          .closed.subscribe({
            next: (result) => {
              if (result instanceof SelectResourceResult) {
                gameManager.stateManager.before('repairBuilding', building.data.id, building.data.name);
                gameManager.buildingsManager.repairBuilding(building.model, result);
                gameManager.stateManager.after();
                this.cdr.markForCheck();
              }
            }
          });
      }
    }
  }

  rewardsDialog(building: Building) {
    if (building.data.rewards && building.data.rewards[building.model.level - 1]) {
      const rewards = building.data.rewards[building.model.level - 1];
      if (
        rewards.defense ||
        rewards.items ||
        rewards.loseMorale ||
        rewards.plots ||
        rewards.prosperity ||
        rewards.section ||
        rewards.soldiers
      ) {
        this.dialog.open(BuildingUpgradeDialog, {
          panelClass: ['dialog'],
          data: {
            building: building,
            action: 'rewards'
          }
        });
      }
    }
  }

  toggleState(building: Building, force: boolean = false) {
    const state = gameManager.buildingsManager.nextBuildingState(building.data, building.model, force);
    if (state) {
      gameManager.stateManager.before('changeBuildingState', building.data.id, building.model.name, state);
      building.model.state = state;
      gameManager.stateManager.after();
    }
  }

  downgrade(building: Building, force: boolean = false) {
    if (gameManager.game.party.buildings.includes(building.model)) {
      const remove = gameManager.buildingsManager.removableBuilding(building.data) && (building.model.level === 0 || force);
      if (remove || gameManager.buildingsManager.downgradeable(building.data, building.model)) {
        if (remove) {
          gameManager.stateManager.before('removeBuilding', building.data.id, building.model.name);
        } else {
          gameManager.stateManager.before('downgradeBuilding', building.data.id, building.model.name, building.model.level - 1);
        }
        gameManager.buildingsManager.downgradeBuilding(building.data, building.model, force);
        gameManager.stateManager.after();
      }
      // TODO: The 'emit' function requires a mandatory void argument
      this.changed.emit();
    }
  }

  openInteraction(building: Building) {
    if (building.model.name === 'craftsman') {
      this.dialog.open(ItemsDialogComponent, {
        panelClass: ['dialog'],
        data: { edition: gameManager.game.edition, craftOnly: true }
      });
    } else if (building.model.name === 'alchemist') {
      this.dialog.open(ItemsBrewDialog, {
        panelClass: ['dialog']
      });
    } else if (building.model.name === 'trading-post') {
      this.dialog.open(ItemsDialogComponent, {
        panelClass: ['dialog'],
        data: { edition: gameManager.game.edition, buyOnly: true }
      });
    }
  }

  openStables() {
    this.dialog.open(StablesComponent, {
      panelClass: ['dialog']
    });
  }

  openTrade(building: Building) {
    const trade = gameManager.buildingsManager.trade(building.model);
    if (trade) {
      this.dialog
        .open(BuildingUpgradeDialog, {
          panelClass: ['dialog'],
          data: { building: building, action: 'trade', trade: trade }
        })
        .closed.subscribe({
          next: (result) => {
            if (result instanceof SelectResourceResult) {
              gameManager.stateManager.before(
                'buildingTrade',
                building.model.name,
                this.tradeResources([...result.characterSpent, result.fhSupportSpent]),
                this.tradeResources([...result.characterReceived, result.fhSupportReceived])
              );
              gameManager.lootManager.applySelectResources(result);
              gameManager.stateManager.after();
              this.changed.emit();
            }
          }
        });
    }
  }

  private tradeResources(costs: (BuildingCosts | undefined)[]): string {
    return (['gold', 'lumber', 'metal', 'hide'] as const)
      .map((type) => {
        const value = costs.reduce((sum, cost) => sum + ((cost && cost[type]) || 0), 0);
        return value ? value + ' %game.resource.' + (type === 'gold' ? LootType.money : type) + '%' : '';
      })
      .filter((value) => value)
      .join(', ');
  }

  openGarden() {
    this.dialog.open(GardenComponent, {
      panelClass: ['dialog']
    });
  }
}

import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import {
  BuildingCosts,
  BuildingCostType,
  BuildingRewards,
  BuildingTrade,
  SelectResourceResult
} from 'src/app/game/model/data/BuildingData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { DistributionChange, DistributionEntry, PartyDistributionComponent } from 'src/app/ui/figures/party/distribution/distribution';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

function tradeCostType(type: LootType): BuildingCostType {
  return type === LootType.money ? 'gold' : (type as BuildingCostType);
}

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TrackUUIDPipe, PartyDistributionComponent],
  selector: 'ghs-buildings-upgrade-dialog',
  templateUrl: 'upgrade-dialog.html',
  styleUrls: ['./upgrade-dialog.scss']
})
export class BuildingUpgradeDialog implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  building: Building | undefined;
  action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards' | 'soldiers' | 'trade';
  costs: BuildingCosts;
  requiredResources: number;
  paidResources: number = 0;
  repair: number;
  force: boolean;
  characters: Character[] = [];
  characterSpent: BuildingCosts[] = [];
  fhSupportSpent: BuildingCosts = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
  spent: BuildingCosts = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
  rewards: BuildingRewards | undefined;
  rewardsOnly: boolean;
  discount: boolean;
  trade: BuildingTrade | undefined;
  tradeMax: number = 0;
  tradeReceiveEntries: DistributionEntry[] = [];
  tradeReceiveGlobalTotal: number | undefined;
  characterReceived: BuildingCosts[] = [];
  fhSupportReceived: BuildingCosts = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
  tradeInitialReceived: Partial<Record<string, number>> = {};

  data: {
    costs: BuildingCosts | undefined;
    repair: number;
    building: Building | undefined;
    action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards' | 'soldiers' | 'trade';
    force: boolean;
    trade: BuildingTrade | undefined;
  } = inject(DIALOG_DATA);

  constructor() {
    this.repair = this.data.repair || 0;
    this.requiredResources = this.repair;
    this.building = this.data.building;
    this.action = this.data.action;
    this.force = this.data.force || false;
    this.rewardsOnly = this.action === 'rewards';
    this.trade = this.action === 'trade' ? this.data.trade : undefined;
    this.discount =
      !this.trade &&
      gameManager.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'carpenter' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
      ) !== undefined &&
      !this.repair;
    if (!this.repair && this.building) {
      this.costs = this.data.costs || { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
      this.costs.gold = this.costs.gold || 0;
      this.costs.hide = this.costs.hide || 0;
      this.costs.lumber = this.costs.lumber || 0;
      this.costs.metal = this.costs.metal || 0;
      this.requiredResources = this.costs.hide + this.costs.lumber + this.costs.metal;

      let discountFree = this.discount;

      // lumber
      this.fhSupportSpent.lumber = Math.max(0, this.costs.lumber - (discountFree ? 1 : 0));
      discountFree = false;
      if (this.fhSupportSpent.lumber > (gameManager.game.party.loot[LootType.lumber] || 0)) {
        this.fhSupportSpent.lumber = gameManager.game.party.loot[LootType.lumber] || 0;
        discountFree = this.discount;
      }
      this.spent[LootType.lumber] = this.fhSupportSpent.lumber;
      this.paidResources += this.fhSupportSpent.lumber;

      // metal
      this.fhSupportSpent.metal = Math.max(0, this.costs.metal - (discountFree ? 1 : 0));
      discountFree = false;
      if (this.fhSupportSpent.metal > (gameManager.game.party.loot[LootType.metal] || 0)) {
        this.fhSupportSpent.metal = gameManager.game.party.loot[LootType.metal] || 0;
        discountFree = this.discount;
      }
      this.spent[LootType.metal] = this.fhSupportSpent.metal;
      this.paidResources += this.fhSupportSpent.metal;

      // hide
      this.fhSupportSpent.hide = Math.max(0, this.costs.hide - (discountFree ? 1 : 0));
      discountFree = false;
      if (this.fhSupportSpent.hide > (gameManager.game.party.loot[LootType.hide] || 0)) {
        this.fhSupportSpent.hide = gameManager.game.party.loot[LootType.hide] || 0;
        discountFree = this.discount;
      }
      this.spent[LootType.hide] = this.fhSupportSpent.hide;
      this.paidResources += this.fhSupportSpent.hide;

      if (
        (this.action === 'build' || this.action === 'upgrade') &&
        this.building.data.rewards &&
        this.building.data.rewards[this.building.model.level]
      ) {
        this.rewards = this.building.data.rewards[this.building.model.level];
      } else if (this.action === 'rewards' && this.building.data.rewards && this.building.data.rewards[this.building.model.level - 1]) {
        this.rewards = this.building.data.rewards[this.building.model.level - 1];
      }
    } else {
      this.costs = {
        gold: (!!this.data.costs && this.data.costs.gold) || 0,
        hide: this.repair,
        lumber: this.repair,
        metal: this.repair,
        prosperity: 0,
        manual: 0
      };
    }
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
    this.characters.forEach((character, index) => {
      this.characterSpent[index] = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
    });

    if (this.trade) {
      const trade = this.trade;
      const available =
        trade.pay === LootType.money
          ? this.characters.reduce((sum, character) => sum + (character.progress.gold || 0), 0)
          : (gameManager.game.party.loot[trade.pay] || 0) +
            this.characters.reduce((sum, character) => sum + (character.progress.loot[trade.pay] || 0), 0);
      this.tradeMax = Math.min(trade.max, Math.floor(available / trade.payAmount));
      this.initTrade(trade);
    }
  }

  // distributions are limited by the maximum trade amount, the actual amount results from the distributed resources
  private initTrade(trade: BuildingTrade) {
    const pay = tradeCostType(trade.pay);
    const payTotal = this.tradeMax * trade.payAmount;
    const receiveTotal = this.tradeMax * trade.receiveAmount;
    this.costs = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
    this.costs[pay] = payTotal;
    this.characterReceived = this.characters.map(() => ({ gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 }));
    this.requiredResources = 0;

    // pay resources from Frosthaven supply first, then from characters
    if (trade.pay !== LootType.money) {
      this.fhSupportSpent[pay] = Math.min(payTotal, gameManager.game.party.loot[trade.pay] || 0);
      if (!settingsManager.settings.fhShareResources) {
        let remaining = payTotal - this.fhSupportSpent[pay];
        this.characters.forEach((character, index) => {
          const value = Math.min(remaining, character.progress.loot[trade.pay] || 0);
          this.characterSpent[index][pay] = value;
          remaining -= value;
        });
      }
    }

    this.tradeReceiveEntries = trade.receive.map((type) => ({ type: type === LootType.money ? 'gold' : type, total: receiveTotal }));
    this.tradeReceiveGlobalTotal = trade.receive.length > 1 ? receiveTotal : undefined;
    // receive resources into Frosthaven supply by default
    if (trade.receive.length === 1 && trade.receive[0] !== LootType.money) {
      const receive = tradeCostType(trade.receive[0]);
      this.fhSupportReceived[receive] = receiveTotal;
      this.tradeInitialReceived = { [receive]: receiveTotal };
    }
    this.recalculatePaidResources();
  }

  onTradeReceive(change: DistributionChange): void {
    if (change.source === 'party') {
      this.fhSupportReceived[change.type as BuildingCostType] = change.value;
    } else {
      this.characterReceived[change.source][change.type as BuildingCostType] = change.value;
    }
  }

  get tradeComplete(): boolean {
    if (!this.trade) {
      return false;
    }
    const trades = this.spent[tradeCostType(this.trade.pay)] / this.trade.payAmount;
    const received = this.trade.receive
      .map(tradeCostType)
      .reduce(
        (sum, type) =>
          sum + (this.fhSupportReceived[type] || 0) + this.characterReceived.reduce((total, values) => total + values[type], 0),
        0
      );
    return Number.isInteger(trades) && trades > 0 && trades <= this.tradeMax && received === trades * this.trade.receiveAmount;
  }

  ngOnInit(): void {
    if (this.force && (this.repair || !settingsManager.settings.applyBuildingRewards || !gameManager.game.party.campaignMode)) {
      this.dialogRef.close(true);
    }
  }

  get upgradeEntries(): DistributionEntry[] {
    const entries: DistributionEntry[] = [];
    if (this.costs.gold) entries.push({ type: 'gold', total: this.costs.gold });
    if (this.costs.lumber) entries.push({ type: LootType.lumber, total: this.costs.lumber });
    if (this.costs.metal) entries.push({ type: LootType.metal, total: this.costs.metal });
    if (this.costs.hide) entries.push({ type: LootType.hide, total: this.costs.hide });
    return entries;
  }

  get upgradeInitialPartyValues(): Partial<Record<string, number>> {
    return {
      lumber: this.fhSupportSpent.lumber || 0,
      metal: this.fhSupportSpent.metal || 0,
      hide: this.fhSupportSpent.hide || 0
    };
  }

  get upgradeInitialCharacterValues(): Partial<Record<string, number>>[] {
    return this.characterSpent.map((spent) => ({ lumber: spent.lumber || 0, metal: spent.metal || 0, hide: spent.hide || 0 }));
  }

  onCostChange(change: DistributionChange): void {
    const type = change.type as keyof BuildingCosts;
    if (change.source === 'party') {
      this.fhSupportSpent[type] = change.value;
    } else {
      this.characterSpent[change.source as number][type] = change.value;
    }
    this.recalculatePaidResources();
  }

  recalculatePaidResources(): void {
    this.spent.gold = (this.fhSupportSpent.gold || 0) + this.characterSpent.reduce((s, cs) => s + (cs.gold || 0), 0);
    this.spent.lumber = (this.fhSupportSpent.lumber || 0) + this.characterSpent.reduce((s, cs) => s + (cs.lumber || 0), 0);
    this.spent.metal = (this.fhSupportSpent.metal || 0) + this.characterSpent.reduce((s, cs) => s + (cs.metal || 0), 0);
    this.spent.hide = (this.fhSupportSpent.hide || 0) + this.characterSpent.reduce((s, cs) => s + (cs.hide || 0), 0);
    this.paidResources =
      (this.fhSupportSpent.lumber || 0) +
      (this.fhSupportSpent.metal || 0) +
      (this.fhSupportSpent.hide || 0) +
      (this.fhSupportSpent.manual || 0) +
      this.characterSpent.reduce((sum, cs) => sum + (cs.lumber || 0) + (cs.metal || 0) + (cs.hide || 0), 0);
  }

  changeValue(type: BuildingCostType, spent: BuildingCosts, value: number) {
    spent[type] += value;
    this.spent[type] += value;
    if (type !== 'gold' && type !== 'prosperity') {
      this.paidResources += value;
    }
  }

  sectionRewards(index: string, edition: string = '') {
    const section = gameManager.sectionData(edition || gameManager.currentEdition()).find((sectionData) => sectionData.index === index);
    if (this.rewardsOnly && section) {
      const conclusion = gameManager.buildingsManager.rewardSection(section);
      const conclusions = gameManager
        .sectionData(section.edition)
        .filter(
          (sectionData) =>
            sectionData.conclusion &&
            !sectionData.parent &&
            sectionData.parentSections &&
            sectionData.parentSections.find((parentSections) => parentSections.length === 1 && parentSections.includes(section.index)) &&
            gameManager.scenarioManager.getRequirements(sectionData).length === 0
        );

      if (conclusion || conclusions.length === 0) {
        const scenario = new Scenario(conclusion || section);
        this.close();
        this.dialog.open(ScenarioSummaryComponent, {
          panelClass: ['dialog'],
          data: {
            scenario: scenario,
            success: true,
            conclusionOnly: true,
            rewardsOnly: conclusion !== undefined
          }
        });
      } else if (conclusions.length > 0) {
        this.dialog
          .open(ScenarioConclusionComponent, {
            panelClass: ['dialog'],
            data: { conclusions: conclusions, parent: section }
          })
          .closed.subscribe({
            next: (result) => {
              if (result) {
                const conclusionResult = result as ScenarioData;
                this.sectionRewards(conclusionResult.index, conclusionResult.edition);
              }
            }
          });
      }
    }
  }

  confirm(morale: boolean = false) {
    if (this.force) {
      ghsDialogClosingHelper(this.dialogRef, true);
    } else if (morale) {
      ghsDialogClosingHelper(this.dialogRef, new SelectResourceResult(this.characters, this.characterSpent, this.fhSupportSpent, 1));
    } else if (
      this.trade
        ? this.tradeComplete
        : this.paidResources >= this.requiredResources - (this.discount ? 1 : 0) &&
          (!this.costs.gold || this.costs.gold === this.spent.gold)
    ) {
      ghsDialogClosingHelper(
        this.dialogRef,
        new SelectResourceResult(
          this.characters,
          this.characterSpent,
          this.fhSupportSpent,
          0,
          this.characterReceived,
          this.trade ? this.fhSupportReceived : undefined
        )
      );
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

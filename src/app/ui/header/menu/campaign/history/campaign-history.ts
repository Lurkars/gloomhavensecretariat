import { DialogRef } from '@angular/cdk/dialog';

import { NgClass, SlicePipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';

import { GhsManager } from 'src/app/game/businesslogic/GhsManager';

import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

import {
  CAMPAIGN_HISTORY_CATEGORIES,
  CampaignHistoryCategory,
  CampaignHistoryEntry,
  computeCampaignHistoryRecord,
  getCampaignHistoryCategory
} from 'src/app/game/model/CampaignHistory';

import { AutoscrollDirective } from 'src/app/ui/helper/autoscroll';

import { GhsLabelDirective } from 'src/app/ui/helper/label';

import { ghsTextSearch } from 'src/app/ui/helper/Static';

import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  imports: [NgClass, SlicePipe, FormsModule, AutoscrollDirective, GhsLabelDirective, TabClickDirective],

  selector: 'ghs-campaign-history',

  templateUrl: './campaign-history.html',

  styleUrls: ['./campaign-history.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignHistoryComponent implements OnInit {
  dialogRef = inject(DialogRef);

  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;

  entries: CampaignHistoryEntry[] = [];

  confirmClear: boolean = false;

  searchFilter: string = '';

  categoryFilter: CampaignHistoryCategory | '' = '';

  categories = CAMPAIGN_HISTORY_CATEGORIES;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());

    this.dialogRef.overlayRef.hostElement.style.zIndex = '999';

    if (this.dialogRef.overlayRef.backdropElement) {
      this.dialogRef.overlayRef.backdropElement.style.zIndex = '999';
    }
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    const history = gameManager.game.party.campaignHistory || [];

    this.entries = [...history].reverse();
  }

  onFilterChange() {}

  filteredEntries(): CampaignHistoryEntry[] {
    return this.entries.filter((entry) => this.matchesFilters(entry));
  }

  displayedEntries(): CampaignHistoryEntry[] {
    return this.filteredEntries();
  }

  getEntryCategory(entry: CampaignHistoryEntry): CampaignHistoryCategory {
    return getCampaignHistoryCategory((entry.info && entry.info[0]) || '');
  }

  getEntryRecord(entry: CampaignHistoryEntry): string {
    if (entry.record) {
      return entry.record;
    }

    const computed = computeCampaignHistoryRecord(entry.info || []);

    if (computed) {
      return computed;
    }

    return this.scenarioRecordFromNearby(entry);
  }

  private scenarioRecordFromNearby(entry: CampaignHistoryEntry): string {
    const key = (entry.info && entry.info[0]) || '';

    if (!key.startsWith('scenarioReward.')) {
      return '';
    }

    const index = this.entries.indexOf(entry);

    if (index < 0) {
      return '';
    }

    for (let i = index + 1; i < this.entries.length && i <= index + 30; i++) {
      const nearby = this.entries[i];

      if (nearby.revision !== entry.revision) {
        break;
      }

      const nearbyKey = (nearby.info && nearby.info[0]) || '';

      if (nearbyKey.startsWith('finishScenario.') && nearbyKey !== 'finishScenario.battleGoal' && nearbyKey !== 'finishScenario.trial') {
        return nearby.record || nearby.info[1] || '';
      }

      if (nearbyKey === 'finishConclusion' || nearbyKey === 'scenarioReward.unlockScenario') {
        return nearby.record || nearby.info[1] || '';
      }
    }

    return '';
  }

  categoryLabel(category: CampaignHistoryCategory | ''): string {
    if (!category) {
      return settingsManager.getLabel('campaign.history.filterAll');
    }

    return settingsManager.getLabel('campaign.history.category.' + category);
  }

  getEntryInfo(entry: CampaignHistoryEntry): string[] {
    let info = entry.info || [];

    if (info.length > 1 && info[0] === 'serverSync') {
      info = ['serverSync', settingsManager.getLabel('state.info.' + info[1], info.slice(2))];
    } else if (info.length === 1 && info[0] === 'serverSync') {
      info = ['serverSync', ''];
    }

    return info;
  }

  getEntryDescription(entry: CampaignHistoryEntry): string {
    const info = this.getEntryInfo(entry);

    if (info.length === 0) {
      return '';
    }

    return settingsManager.getLabel('state.info.' + info[0], info.slice(1));
  }

  formatDate(timestamp: number): string {
    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleDateString();
  }

  formatTime(timestamp: number): string {
    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleTimeString();
  }

  clearHistory() {
    if (!this.confirmClear) {
      this.confirmClear = true;
    } else {
      gameManager.game.party.campaignHistory = [];

      gameManager.stateManager.saveLocal();

      this.confirmClear = false;

      this.update();
    }
  }

  cancelClear() {
    this.confirmClear = false;
  }

  private matchesFilters(entry: CampaignHistoryEntry): boolean {
    const category = this.getEntryCategory(entry);

    if (this.categoryFilter && category !== this.categoryFilter) {
      return false;
    }

    if (!this.searchFilter.trim()) {
      return true;
    }

    const haystack = [
      '' + entry.revision,

      this.formatDate(entry.timestamp),

      this.formatTime(entry.timestamp),

      settingsManager.getLabel('campaign.history.category.' + category),

      this.getEntryRecord(entry),

      this.getEntryDescription(entry),

      (entry.info && entry.info[0]) || ''
    ].join(' ');

    return ghsTextSearch(haystack, this.searchFilter.trim());
  }
}

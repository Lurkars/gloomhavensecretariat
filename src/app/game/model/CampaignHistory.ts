export class CampaignHistoryEntry {
  revision: number = 0;
  timestamp: number = 0;
  info: string[] = [];
  record: string = '';
}

export const MAX_CAMPAIGN_HISTORY = 500;

const CAMPAIGN_HISTORY_PREFIXES = [
  'eventEffect.',
  'eventDraw.',
  'events.deck.',
  'setParty',
  'addParty',
  'removeParty',
  'changeParty',
  'resetCampaign',
  'startCampaign',
  'cancelCampaign',
  'enablePartyCampaignMode',
  'disablePartyCampaignMode',
  'addBuilding',
  'buildBuilding',
  'upgradeBuilding',
  'downgradeBuilding',
  'removeBuilding',
  'rebuildBuilding',
  'changeBuildingState',
  'finishScenario.',
  'finishConclusion',
  'addManualScenario',
  'removeManualScenario',
  'cancelScenario',
  'addSection',
  'removeConclusion',
  'addPartyWeekSection',
  'removePartyWeekSection',
  'setPartyWeeks',
  'passTime',
  'addCampaignSticker',
  'removeCampaignSticker',
  'importParty',
  'addPartyAchievement',
  'removePartyAchievement',
  'addGlobalAchievement',
  'removeGlobalAchievement',
  'setPartyResource',
  'applyResourceChange',
  'moveResource',
  'addResource',
  'addTreasure',
  'removeTreasure',
  'addTreasures',
  'removeTreasures',
  'buyItem',
  'craftItem',
  'sellItem',
  'equipItem',
  'unequipItem',
  'distillItem',
  'brewPotion',
  'addItem',
  'removeItem',
  'addUnlockedItem',
  'removeUnlockedItem',
  'updateUnlockedItemCount',
  'setPQ',
  'addPerk',
  'removePerk',
  'retire',
  'unlockChar',
  'unlockAllCharacters',
  'unsetRetired',
  'donate',
  'setPartyDonations',
  'setPartyReputation',
  'setPartyProsperity',
  'setPartyInspiration',
  'setPartyMorale',
  'setPartySoldiers',
  'setPartyTotalDefense',
  'setPartyTownGuardPerks',
  'addPartyTownGuardPerkSection',
  'removePartyTownGuardPerkSection',
  'setFactionReputation',
  'setPartyImbuement',
  'gh2eImbuement',
  'buildings.',
  'finishScenario.trial',
  'garden.',
  'setPlayer',
  'removePlayer',
  'setPartyName',
  'setPartyLocation',
  'setPartyNotes',
  'enableEnvelopeB',
  'disableEnvelopeB',
  'lootRandomItem',
  'removeCharTreasure',
  'characterItemApply',
  'characterItemUnapply',
  'importCharacter',
  'addMastery',
  'removeMastery',
  'applyFavorSelection',
  'favorKeepOn',
  'favorKeepOff',
  'campaignHistory.',
  'scenarioReward.'
];

export type CampaignHistoryCategory =
  | 'scenario'
  | 'events'
  | 'calendar'
  | 'buildings'
  | 'resources'
  | 'items'
  | 'characters'
  | 'party'
  | 'campaign'
  | 'undo'
  | 'other';

export const CAMPAIGN_HISTORY_CATEGORIES: CampaignHistoryCategory[] = [
  'scenario',
  'events',
  'calendar',
  'buildings',
  'resources',
  'items',
  'characters',
  'party',
  'campaign',
  'undo',
  'other'
];

export function getCampaignHistoryCategory(key: string): CampaignHistoryCategory {
  if (!key) {
    return 'other';
  }

  if (key.startsWith('campaignHistory.')) {
    return 'undo';
  }

  if (
    key.startsWith('finishScenario.') ||
    key === 'finishConclusion' ||
    key.startsWith('scenarioReward.') ||
    key === 'addManualScenario' ||
    key === 'removeManualScenario' ||
    key === 'cancelScenario' ||
    key === 'addSection' ||
    key === 'removeConclusion' ||
    key === 'resetScenario'
  ) {
    return 'scenario';
  }

  if (key.startsWith('eventEffect.') || key.startsWith('eventDraw.') || key.startsWith('events.deck.')) {
    return 'events';
  }

  if (key === 'passTime' || key === 'setPartyWeeks' || key === 'addPartyWeekSection' || key === 'removePartyWeekSection') {
    return 'calendar';
  }

  if (
    key === 'addBuilding' ||
    key === 'buildBuilding' ||
    key === 'upgradeBuilding' ||
    key === 'downgradeBuilding' ||
    key === 'removeBuilding' ||
    key === 'rebuildBuilding' ||
    key === 'changeBuildingState' ||
    key === 'repairBuilding' ||
    key.startsWith('buildings.') ||
    key.startsWith('garden.')
  ) {
    return 'buildings';
  }

  if (
    key === 'setPartyResource' ||
    key === 'applyResourceChange' ||
    key === 'moveResource' ||
    key === 'addResource' ||
    key === 'removeResource' ||
    key === 'addTreasure' ||
    key === 'removeTreasure' ||
    key === 'addTreasures' ||
    key === 'removeTreasures' ||
    key === 'lootRandomItem' ||
    key === 'donate' ||
    key === 'setPartyDonations'
  ) {
    return 'resources';
  }

  if (
    key === 'buyItem' ||
    key === 'craftItem' ||
    key === 'sellItem' ||
    key === 'equipItem' ||
    key === 'unequipItem' ||
    key === 'distillItem' ||
    key === 'brewPotion' ||
    key === 'addItem' ||
    key === 'removeItem' ||
    key === 'addUnlockedItem' ||
    key === 'removeUnlockedItem' ||
    key === 'updateUnlockedItemCount' ||
    key === 'characterItemApply' ||
    key === 'characterItemUnapply'
  ) {
    return 'items';
  }

  if (
    key === 'unlockChar' ||
    key === 'unlockAllCharacters' ||
    key === 'retire' ||
    key === 'unsetRetired' ||
    key === 'addPerk' ||
    key === 'removePerk' ||
    key === 'setPQ' ||
    key === 'importCharacter' ||
    key === 'addMastery' ||
    key === 'removeMastery' ||
    key === 'applyFavorSelection' ||
    key === 'favorKeepOn' ||
    key === 'favorKeepOff' ||
    key === 'removeCharTreasure' ||
    key === 'setPlayer' ||
    key === 'removePlayer'
  ) {
    return 'characters';
  }

  if (key === 'resetCampaign' || key === 'startCampaign' || key === 'cancelCampaign' || key === 'importParty') {
    return 'campaign';
  }

  if (
    key.startsWith('setParty') ||
    key.startsWith('addParty') ||
    key.startsWith('removeParty') ||
    key.startsWith('changeParty') ||
    key === 'enablePartyCampaignMode' ||
    key === 'disablePartyCampaignMode' ||
    key === 'addPartyAchievement' ||
    key === 'removePartyAchievement' ||
    key === 'addGlobalAchievement' ||
    key === 'removeGlobalAchievement' ||
    key === 'addCampaignSticker' ||
    key === 'removeCampaignSticker' ||
    key === 'setFactionReputation' ||
    key === 'setPartyImbuement' ||
    key.startsWith('gh2eImbuement') ||
    key === 'enableEnvelopeB' ||
    key === 'disableEnvelopeB'
  ) {
    return 'party';
  }

  return 'other';
}

const SCENARIO_INDEX_IN_INFO_KEYS = new Set([
  'finishConclusion',
  'addManualScenario',
  'removeManualScenario',
  'cancelScenario',
  'resetScenario',
  'setScenario',
  'finishScenario.success',
  'finishScenario.failure',
  'finishScenario.linked',
  'finishScenario.remove',
  'finishScenario.restart',
  'finishScenario.dialog',
  'finishScenario.close',
  'scenarioReward.unlockScenario',
  'scenarioReward.revertScenario',
  'scenarioReward.revertConclusion'
]);

export function computeCampaignHistoryRecord(info: string[], options: { scenarioIndex?: string; eventCardId?: string } = {}): string {
  if (!info || info.length === 0 || !info[0]) {
    return '';
  }

  const key = info[0];
  const category = getCampaignHistoryCategory(key);

  if (category === 'scenario') {
    if (SCENARIO_INDEX_IN_INFO_KEYS.has(key)) {
      return info[1] || options.scenarioIndex || '';
    }
    if (key.startsWith('finishScenario.') || key.startsWith('scenarioReward.')) {
      return options.scenarioIndex || '';
    }
    return '';
  }

  if (category === 'events') {
    if (key === 'eventDraw.accept' || key === 'eventEffect.resourcesDistributed') {
      return info[2] || '';
    }
    if (key.startsWith('events.deck.') && info.length >= 3) {
      return info[2] || '';
    }
    if (key.startsWith('eventEffect.') || key.startsWith('eventDraw.')) {
      return options.eventCardId || info[2] || '';
    }
  }

  return '';
}

export function isCampaignHistoryAction(info: string[]): boolean {
  if (!info || info.length === 0 || !info[0]) {
    return false;
  }

  const key = info[0];

  if (key === 'serverSync' || key === 'serverSyncEmpty' || key === 'unknown') {
    return false;
  }

  if (key.startsWith('updateAttackModifierDeck.')) {
    return info.length > 1 && info[1] === 'party.campaign.townGuard';
  }

  return CAMPAIGN_HISTORY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}

/** Log campaign-map changes always; during combat skip in-scenario noise; allow completion/summary. */
export function shouldLogCampaignHistoryEntry(scenarioActive: boolean, scenarioSummary: boolean, info: string[]): boolean {
  if (!scenarioActive) {
    return true;
  }

  const key = info[0];
  if (!key) {
    return false;
  }

  if (key.startsWith('campaignHistory.')) {
    return true;
  }

  if (key === 'cancelScenario' || key === 'resetScenario') {
    return true;
  }

  if (scenarioSummary && (key.startsWith('finishScenario.') || key.startsWith('scenarioReward.') || key === 'finishConclusion')) {
    return true;
  }

  return false;
}

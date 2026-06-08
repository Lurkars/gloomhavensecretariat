import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { LootType } from 'src/app/game/model/data/Loot';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';
import { ghsValueSign } from 'src/app/ui/helper/Static';

export interface CharacterProgressSnapshot {
  key: string;
  gold: number;
  experience: number;
  battleGoals: number;
  extraPerks: number;
  loot: Partial<Record<LootType, number>>;
}

export interface PartyCampaignSnapshot {
  weeks: number;
  morale: number;
  prosperity: number;
  inspiration: number;
  reputation: number;
  defense: number;
  soldiers: number;
  imbuement: number;
  donations: number;
  townGuardPerks: number;
  loot: Partial<Record<LootType, number>>;
  factionReputation: Partial<Record<string, number>>;
  scenarios: string[];
  conclusions: string[];
  manualScenarios: string[];
  globalAchievements: string[];
  achievementsList: string[];
  campaignStickers: string[];
  unlockedCharacters: string[];
  characters: CharacterProgressSnapshot[];
}

export function shouldSnapshotCampaignForHistoryDiff(key: string): boolean {
  if (key === 'finishConclusion' || key === 'eventDraw.accept' || key === 'eventEffect.applyManualDistribution') {
    return true;
  }
  if (!key.startsWith('finishScenario.')) {
    return false;
  }
  const sub = key.substring('finishScenario.'.length);
  return ['success', 'failure', 'linked', 'battleGoal', 'remove'].includes(sub);
}

export interface EventResourceAllocation {
  lootType: LootType;
  delta: number;
  characterName?: string;
}

export interface PartyCampaignSnapshotDiffOptions {
  skipResourceDiff?: boolean;
}

export function collectResourceAllocationsFromSnapshots(
  before: PartyCampaignSnapshot,
  after: PartyCampaignSnapshot
): EventResourceAllocation[] {
  const allocations: EventResourceAllocation[] = [];

  Object.values(LootType).forEach((type) => {
    const delta = (after.loot[type] || 0) - (before.loot[type] || 0);
    if (delta !== 0) {
      allocations.push({ lootType: type, delta });
    }
  });

  const afterCharacters = new Map(after.characters.map((character) => [character.key, character]));
  before.characters.forEach((beforeCharacter) => {
    const afterCharacter = afterCharacters.get(beforeCharacter.key);
    if (!afterCharacter) {
      return;
    }

    const characterName = beforeCharacter.key.split(':')[1];
    Object.values(LootType).forEach((type) => {
      const delta = (afterCharacter.loot[type] || 0) - (beforeCharacter.loot[type] || 0);
      if (delta !== 0) {
        allocations.push({ lootType: type, delta, characterName });
      }
    });
  });

  return allocations;
}

export function formatEventResourceAllocations(allocations: EventResourceAllocation[]): string {
  return allocations
    .map((allocation) => {
      const sign = ghsValueSign(allocation.delta);
      const resource = `%game.resource.${allocation.lootType}%`;
      const target = allocation.characterName
        ? `%game.characterIconColored.${allocation.characterName}%`
        : '%party.campaign.sheet.supply%';
      return `${sign} ${resource} ${target}`;
    })
    .join(', ');
}

export function useScenarioRewardHistoryKeys(key: string): boolean {
  if (key === 'finishConclusion') {
    return true;
  }
  if (!key.startsWith('finishScenario.')) {
    return false;
  }
  const sub = key.substring('finishScenario.'.length);
  return ['success', 'failure', 'linked', 'battleGoal', 'remove'].includes(sub);
}

/** @deprecated use shouldSnapshotCampaignForHistoryDiff */
export function shouldSnapshotCampaignForUndo(key: string): boolean {
  return shouldSnapshotCampaignForHistoryDiff(key);
}

export function capturePartyCampaignSnapshot(game: Game): PartyCampaignSnapshot {
  const party = game.party;
  return {
    weeks: party.weeks,
    morale: party.morale,
    prosperity: party.prosperity,
    inspiration: party.inspiration,
    reputation: party.reputation,
    defense: party.defense,
    soldiers: party.soldiers,
    imbuement: party.imbuement || 0,
    donations: party.donations,
    townGuardPerks: party.townGuardPerks,
    loot: { ...party.loot },
    factionReputation: { ...party.factionReputation },
    scenarios: party.scenarios.map((s) => `${s.edition}:${s.group || ''}:${s.index}`),
    conclusions: party.conclusions.map((s) => `${s.edition}:${s.group || ''}:${s.index}`),
    manualScenarios: party.manualScenarios.map((s) => `${s.edition}:${s.group || ''}:${s.index}`),
    globalAchievements: [...party.globalAchievementsList],
    achievementsList: [...party.achievementsList],
    campaignStickers: [...party.campaignStickers],
    unlockedCharacters: [...game.unlockedCharacters],
    characters: game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => {
        const character = figure as Character;
        return {
          key: character.edition + ':' + character.name,
          gold: character.progress.gold || 0,
          experience: character.progress.experience || 0,
          battleGoals: character.progress.battleGoals || 0,
          extraPerks: character.progress.extraPerks || 0,
          loot: { ...character.progress.loot }
        };
      })
  };
}

export function diffPartyCampaignSnapshots(
  before: PartyCampaignSnapshot,
  after: PartyCampaignSnapshot,
  includeUnlocks: boolean = true,
  scenarioContext: boolean = false,
  options: PartyCampaignSnapshotDiffOptions = {}
): string[][] {
  const entries: string[][] = [];

  const numberDiff = (delta: number, key: string, ...args: string[]) => {
    if (delta !== 0) {
      entries.push([key, ghsValueSign(delta), ...args]);
    }
  };

  if (after.weeks !== before.weeks) {
    if (after.weeks > before.weeks) {
      entries.push(['passTime', '' + after.weeks]);
    } else {
      entries.push(['setPartyWeeks', '' + after.weeks]);
    }
  }

  const moraleKey = scenarioContext ? 'scenarioReward.morale' : 'eventEffect.morale';
  const prosperityKey = scenarioContext ? 'scenarioReward.prosperity' : 'eventEffect.prosperity';
  const inspirationKey = scenarioContext ? 'scenarioReward.inspiration' : 'eventEffect.inspiration';
  const reputationKey = scenarioContext ? 'scenarioReward.reputation' : 'eventEffect.reputation';
  const goldKey = scenarioContext ? 'scenarioReward.changeCharacterGold' : 'eventEffect.changeCharacterGold';
  const xpKey = scenarioContext ? 'scenarioReward.changeCharacterXP' : 'eventEffect.changeCharacterXP';
  const battleGoalsKey = scenarioContext ? 'scenarioReward.changeCharacterBattleGoals' : 'eventEffect.changeCharacterBattleGoals';
  const resourceKey = scenarioContext ? 'scenarioReward.changeCharacterResource' : 'eventEffect.changeCharacterResource';

  numberDiff(after.morale - before.morale, moraleKey);
  numberDiff(after.prosperity - before.prosperity, prosperityKey);
  numberDiff(after.inspiration - before.inspiration, inspirationKey);
  numberDiff(after.reputation - before.reputation, reputationKey);
  numberDiff(after.defense - before.defense, 'scenarioReward.defense');
  numberDiff(after.soldiers - before.soldiers, 'scenarioReward.soldiers');
  if (after.imbuement !== before.imbuement) {
    entries.push(['setPartyImbuement', '' + after.imbuement]);
  }
  if (after.donations !== before.donations) {
    entries.push(['setPartyDonations', '' + after.donations]);
  }
  if (after.townGuardPerks !== before.townGuardPerks) {
    entries.push(['setPartyTownGuardPerks', '' + after.townGuardPerks]);
  }

  Object.keys({ ...before.factionReputation, ...after.factionReputation }).forEach((faction) => {
    const delta = (after.factionReputation[faction] || 0) - (before.factionReputation[faction] || 0);
    if (delta !== 0) {
      entries.push(['eventEffect.factionReputation', ghsValueSign(delta), faction]);
    }
  });

  if (!options.skipResourceDiff) {
    Object.values(LootType).forEach((type) => {
      const delta = (after.loot[type] || 0) - (before.loot[type] || 0);
      if (delta !== 0) {
        entries.push([
          'eventEffect.changeCharacterResource',
          `%game.resource.${type}%`,
          ghsValueSign(delta),
          '%party.campaign.sheet.supply%'
        ]);
      }
    });
  }

  if (includeUnlocks) {
    diffStringArray(before.globalAchievements, after.globalAchievements, 'addGlobalAchievement', 'removeGlobalAchievement', entries);
    diffStringArray(before.achievementsList, after.achievementsList, 'addPartyAchievement', 'removePartyAchievement', entries);
    diffStringArray(before.campaignStickers, after.campaignStickers, 'addCampaignSticker', 'removeCampaignSticker', entries);
    diffStringArray(before.unlockedCharacters, after.unlockedCharacters, 'unlockChar', 'scenarioReward.lockCharacter', entries);
    diffScenarioArray(before.scenarios, after.scenarios, entries, 'scenarioReward.unlockScenario', 'scenarioReward.revertScenario');
    diffScenarioArray(before.conclusions, after.conclusions, entries, 'finishConclusion', 'scenarioReward.revertConclusion');
    diffScenarioArray(before.manualScenarios, after.manualScenarios, entries, 'addManualScenario', 'removeManualScenario');
  }

  const afterCharacters = new Map(after.characters.map((c) => [c.key, c]));
  before.characters.forEach((beforeCharacter) => {
    const afterCharacter = afterCharacters.get(beforeCharacter.key);
    if (!afterCharacter) {
      return;
    }
    const icons = '%game.characterIconColored.' + beforeCharacter.key.split(':')[1] + '%';
    numberDiff(afterCharacter.gold - beforeCharacter.gold, goldKey, icons);
    numberDiff(afterCharacter.experience - beforeCharacter.experience, xpKey, icons);
    numberDiff(afterCharacter.battleGoals - beforeCharacter.battleGoals, battleGoalsKey, icons);
    numberDiff(afterCharacter.extraPerks - beforeCharacter.extraPerks, 'scenarioReward.perks', icons);

    if (!options.skipResourceDiff) {
      Object.values(LootType).forEach((type) => {
        const delta = (afterCharacter.loot[type] || 0) - (beforeCharacter.loot[type] || 0);
        if (delta !== 0) {
          entries.push([resourceKey, `%game.resource.${type}%`, ghsValueSign(delta), icons]);
        }
      });
    }
  });

  return entries;
}

function diffStringArray(before: string[], after: string[], addKey: string, removeKey: string, entries: string[][]) {
  after.filter((value) => !before.includes(value)).forEach((value) => entries.push([addKey, value]));
  before.filter((value) => !after.includes(value)).forEach((value) => entries.push([removeKey, value]));
}

function diffScenarioArray(
  before: string[],
  after: string[],
  entries: string[][],
  addKey: string,
  removeKey: string
) {
  after
    .filter((value) => !before.includes(value))
    .forEach((value) => entries.push(scenarioHistoryEntry(value, addKey)));
  before
    .filter((value) => !after.includes(value))
    .forEach((value) => entries.push(scenarioHistoryEntry(value, removeKey)));
}

function scenarioHistoryEntry(value: string, key: string): string[] {
  const [edition, group, index] = value.split(':');
  const scenarioData = gameManager.scenarioManager.scenarioDataForModel(
    new GameScenarioModel(index, edition, group || undefined)
  );
  if (scenarioData) {
    return [key, ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData))];
  }
  return [key, index, '', edition];
}

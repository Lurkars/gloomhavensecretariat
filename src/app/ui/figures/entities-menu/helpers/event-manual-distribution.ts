import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { resolveDistributableEffect } from 'src/app/ui/figures/entities-menu/helpers/event-effect-resolver';

export type DistributionKind = 'gold' | 'resource' | 'experience' | 'battleGoal';

export class DistributionRow {
  id: string;
  kind: DistributionKind;
  effect: EventCardEffect;
  total: number;
  perCharacter: number = 0;
  lootType: LootType | undefined;
  anyMaterial: boolean = false;
  useSupply: boolean = false;
  spent: number = 0;
  supplySpent: number = 0;
  characterSpent: number[] = [];
  supplySpentByType: Partial<Record<LootType, number>> = {};
  characterSpentByType: Partial<Record<LootType, number[]>> = {};

  constructor(id: string, kind: DistributionKind, effect: EventCardEffect, total: number, characterCount: number) {
    this.id = id;
    this.kind = kind;
    this.effect = effect;
    this.total = Math.abs(total);
    this.characterSpent = Array.from({ length: characterCount }, () => 0);
  }

  isGain(): boolean {
    return !this.isLoseEffect(this.effect.type);
  }

  isComplete(): boolean {
    return this.spent >= this.total;
  }

  materialTypes(): LootType[] {
    return materialResourceLootTypes;
  }

  spentForType(lootType: LootType, characterIndex?: number): number {
    if (characterIndex === undefined) {
      return this.supplySpentByType[lootType] || 0;
    }
    return this.characterSpentByType[lootType]?.[characterIndex] || 0;
  }

  private isLoseEffect(type: EventCardEffectType): boolean {
    return [
      EventCardEffectType.loseCollectiveGold,
      EventCardEffectType.loseGold,
      EventCardEffectType.loseGoldOne,
      EventCardEffectType.loseCollectiveResource,
      EventCardEffectType.loseCollectiveResourceAny,
      EventCardEffectType.loseCollectiveResourceType,
      EventCardEffectType.loseResource,
      EventCardEffectType.loseExperience,
      EventCardEffectType.loseCollectiveExperience,
      EventCardEffectType.loseBattleGoal
    ].includes(type);
  }
}

export class EventManualDistributionHelper {
  rows: DistributionRow[] = [];
  characters: Character[] = [];
  applied = false;

  parse(effects: EventCardEffect[]) {
    this.applied = false;
    this.characters = gameManager.characterManager.getActiveCharacters();
    this.rows = [];
    effects.forEach((effect, index) => {
      this.collectRows(resolveDistributableEffect(effect), '' + index);
    });
  }

  hasRows(): boolean {
    return !this.applied && this.rows.length > 0;
  }

  static effectNeedsDistribution(effect: EventCardEffect): boolean {
    const helper = new EventManualDistributionHelper();
    helper.parse([effect]);
    return helper.rows.length > 0;
  }

  hasPending(): boolean {
    return this.rows.some((row) => row.spent > 0 || row.supplySpent > 0);
  }

  changeValue(row: DistributionRow, characterIndex: number | undefined, value: number, lootType?: LootType) {
    if (row.anyMaterial) {
      if (!lootType) {
        return;
      }
      this.changeAnyMaterialValue(row, characterIndex, value, lootType);
      return;
    }

    if (value > 0 && row.spent >= row.total) {
      return;
    }
    if (value < 0 && (characterIndex === undefined ? row.supplySpent : row.characterSpent[characterIndex]) <= 0) {
      return;
    }

    if (characterIndex === undefined) {
      if (value > 0 && row.spent >= row.total) {
        return;
      }
      row.supplySpent += value;
      row.spent += value;
    } else {
      const character = this.characters[characterIndex];
      if (value > 0) {
        if (row.perCharacter > 0 && row.characterSpent[characterIndex] >= row.perCharacter) {
          return;
        }
        if (!row.isGain()) {
          const available = this.availableForLoss(row, character);
          if (available <= row.characterSpent[characterIndex]) {
            return;
          }
        }
      }
      row.characterSpent[characterIndex] += value;
      row.spent += value;
    }
  }

  availableForLoss(row: DistributionRow, character: Character, lootType?: LootType): number {
    switch (row.kind) {
      case 'gold':
        return character.progress.gold || 0;
      case 'experience':
        return character.progress.experience || 0;
      case 'battleGoal':
        return character.progress.battleGoals || 0;
      case 'resource':
        if (lootType) {
          return character.progress.loot[lootType] || 0;
        }
        return row.lootType ? character.progress.loot[row.lootType] || 0 : 0;
      default:
        return 0;
    }
  }

  currentSupply(row: DistributionRow, lootType?: LootType): number {
    const type = lootType || row.lootType;
    if (!type) {
      return 0;
    }
    return gameManager.game.party.loot[type] || 0;
  }

  apply(): boolean {
    if (!this.hasPending()) {
      return false;
    }

    gameManager.stateManager.before('eventEffect.applyManualDistribution');
    this.rows.forEach((row) => {
      if (row.spent === 0 && row.supplySpent === 0) {
        return;
      }

      const gain = row.isGain();

      if (row.anyMaterial) {
        this.applyAnyMaterialRowState(row, gain);
      } else if (row.kind === 'gold') {
        this.characters.forEach((character, index) => {
          const amount = row.characterSpent[index];
          if (!amount) {
            return;
          }
          const delta = gain ? amount : -amount;
          character.progress.gold = (character.progress.gold || 0) + delta;
          if (character.progress.gold < 0) {
            character.progress.gold = 0;
          }
        });
      } else if (row.kind === 'experience') {
        this.characters.forEach((character, index) => {
          const amount = row.characterSpent[index];
          if (!amount) {
            return;
          }
          const delta = gain ? amount : -amount;
          character.progress.experience = (character.progress.experience || 0) + delta;
          if (character.progress.experience < 0) {
            character.progress.experience = 0;
          }
        });
      } else if (row.kind === 'battleGoal') {
        this.characters.forEach((character, index) => {
          const amount = row.characterSpent[index];
          if (!amount) {
            return;
          }
          const delta = gain ? amount : -amount;
          character.progress.battleGoals = (character.progress.battleGoals || 0) + delta;
          if (character.progress.battleGoals < 0) {
            character.progress.battleGoals = 0;
          }
        });
      } else if (row.kind === 'resource' && row.lootType) {
        const lootType = row.lootType;
        if (row.supplySpent) {
          const delta = gain ? row.supplySpent : -row.supplySpent;
          gameManager.game.party.loot[lootType] = Math.max(0, (gameManager.game.party.loot[lootType] || 0) + delta);
        }
        this.characters.forEach((character, index) => {
          const amount = row.characterSpent[index];
          if (!amount) {
            return;
          }
          const delta = gain ? amount : -amount;
          character.progress.loot[lootType] = Math.max(0, (character.progress.loot[lootType] || 0) + delta);
        });
      }

      row.spent = 0;
      row.supplySpent = 0;
      row.characterSpent = row.characterSpent.map(() => 0);
    });
    gameManager.stateManager.after();
    this.completeDistribution();
    return true;
  }

  completeDistribution() {
    this.applied = true;
    this.rows = [];
  }

  private changeAnyMaterialValue(row: DistributionRow, characterIndex: number | undefined, value: number, lootType: LootType) {
    if (value > 0 && row.spent >= row.total) {
      return;
    }

    if (characterIndex === undefined) {
      if (!row.useSupply) {
        return;
      }
      const current = row.supplySpentByType[lootType] || 0;
      if (value < 0 && current <= 0) {
        return;
      }
      if (value > 0 && !row.isGain()) {
        const available = this.currentSupply(row, lootType);
        if (available <= current) {
          return;
        }
      }
      row.supplySpentByType[lootType] = current + value;
      row.supplySpent += value;
      row.spent += value;
      return;
    }

    const character = this.characters[characterIndex];
    const spent = row.characterSpentByType[lootType] || Array.from({ length: this.characters.length }, () => 0);
    row.characterSpentByType[lootType] = spent;
    const current = spent[characterIndex] || 0;
    if (value < 0 && current <= 0) {
      return;
    }
    if (value > 0 && !row.isGain() && this.availableForLoss(row, character, lootType) <= current) {
      return;
    }
    spent[characterIndex] = current + value;
    row.spent += value;
  }

  private applyAnyMaterialRowState(row: DistributionRow, gain: boolean) {
    row.materialTypes().forEach((lootType) => {
      const supplyAmount = row.supplySpentByType[lootType] || 0;
      if (supplyAmount) {
        const delta = gain ? supplyAmount : -supplyAmount;
        gameManager.game.party.loot[lootType] = Math.max(0, (gameManager.game.party.loot[lootType] || 0) + delta);
      }

      const spent = row.characterSpentByType[lootType] || [];
      this.characters.forEach((character, index) => {
        const amount = spent[index] || 0;
        if (!amount) {
          return;
        }
        const delta = gain ? amount : -amount;
        character.progress.loot[lootType] = Math.max(0, (character.progress.loot[lootType] || 0) + delta);
      });
    });

    row.spent = 0;
    row.supplySpent = 0;
    row.supplySpentByType = {};
    row.characterSpentByType = {};
    row.characterSpent = row.characterSpent.map(() => 0);
  }

  private collectRows(effect: EventCardEffect | string, id: string) {
    if (typeof effect === 'string') {
      return;
    }

    const characterCount = this.characters.length;

    switch (effect.type) {
      case EventCardEffectType.collectiveGold:
      case EventCardEffectType.collectiveGoldAdditional:
      case EventCardEffectType.collectiveGoldOther:
      case EventCardEffectType.loseCollectiveGold:
        this.rows.push(new DistributionRow(id, 'gold', effect, this.signedTotal(effect), characterCount));
        break;
      case EventCardEffectType.gold:
      case EventCardEffectType.goldAdditional:
      case EventCardEffectType.loseGold:
        this.addPerCharacterRow(id, 'gold', effect, Math.abs(+effect.values[0]), characterCount);
        break;
      case EventCardEffectType.loseGoldOne:
        this.rows.push(new DistributionRow(id, 'gold', effect, Math.abs(+effect.values[0]), characterCount));
        break;
      case EventCardEffectType.collectiveResource:
        this.addResourceRow(id, effect, +effect.values[0], effect.values[1] as LootType, true);
        break;
      case EventCardEffectType.collectiveResourceType:
        this.addResourceRow(id, effect, +effect.values[0], this.resolveLootType(effect.values[1]), true);
        break;
      case EventCardEffectType.collectiveResourceAny:
        this.addAnyMaterialRow(id, effect, Math.abs(+effect.values[0]));
        break;
      case EventCardEffectType.loseCollectiveResource:
      case EventCardEffectType.loseCollectiveResourceType:
        this.addResourceRow(id, effect, -Math.abs(+effect.values[0]), this.resolveLootType(effect.values[1]), true);
        break;
      case EventCardEffectType.loseCollectiveResourceAny:
        this.addAnyMaterialRow(id, effect, Math.abs(+effect.values[0]));
        break;
      case EventCardEffectType.resource:
      case EventCardEffectType.resourceType:
      case EventCardEffectType.loseResource:
        this.addPerCharacterRow(id, 'resource', effect, Math.abs(+effect.values[0]), characterCount, effect.values[1] as LootType);
        break;
      case EventCardEffectType.experience:
      case EventCardEffectType.traitExperience:
      case EventCardEffectType.loseExperience:
      case EventCardEffectType.loseCollectiveExperience:
        if (
          [EventCardEffectType.experience, EventCardEffectType.traitExperience, EventCardEffectType.loseExperience].includes(effect.type)
        ) {
          this.addPerCharacterRow(id, 'experience', effect, +effect.values[0], characterCount);
        } else {
          this.rows.push(new DistributionRow(id, 'experience', effect, this.signedTotal(effect), characterCount));
        }
        break;
      case EventCardEffectType.battleGoal:
      case EventCardEffectType.loseBattleGoal:
        this.addPerCharacterRow(id, 'battleGoal', effect, +effect.values[0], characterCount);
        break;
      case EventCardEffectType.and:
      case EventCardEffectType.additionally:
      case EventCardEffectType.choose:
        effect.values
          .filter((value) => typeof value === 'object')
          .forEach((value, index) => this.collectRows(value as EventCardEffect, id + '-' + index));
        break;
      case EventCardEffectType.checkbox:
        effect.values
          .filter((value) => typeof value === 'object')
          .forEach((value, index) => this.collectRows(value as EventCardEffect, id + '-cb-' + index));
        break;
    }
  }

  private addPerCharacterRow(
    id: string,
    kind: DistributionKind,
    effect: EventCardEffect,
    perCharacter: number,
    characterCount: number,
    lootType?: LootType
  ) {
    const row = new DistributionRow(id, kind, effect, Math.abs(perCharacter) * characterCount, characterCount);
    row.perCharacter = Math.abs(perCharacter);
    row.lootType = lootType;
    row.useSupply = kind === 'resource' && settingsManager.settings.fhShareResources;
    this.rows.push(row);
  }

  private addResourceRow(id: string, effect: EventCardEffect, total: number, lootType: LootType | undefined, collective: boolean) {
    if (!lootType) {
      return;
    }
    const row = new DistributionRow(id, 'resource', effect, total, this.characters.length);
    row.lootType = lootType;
    row.useSupply = collective && settingsManager.settings.fhShareResources;
    this.rows.push(row);
  }

  private addAnyMaterialRow(id: string, effect: EventCardEffect, total: number) {
    const row = new DistributionRow(id, 'resource', effect, total, this.characters.length);
    row.anyMaterial = true;
    row.useSupply = settingsManager.settings.fhShareResources;
    row.materialTypes().forEach((lootType) => {
      row.characterSpentByType[lootType] = Array.from({ length: this.characters.length }, () => 0);
      row.supplySpentByType[lootType] = 0;
    });
    this.rows.push(row);
  }

  private signedTotal(effect: EventCardEffect): number {
    const value = +effect.values[0];
    if (
      [
        EventCardEffectType.loseCollectiveGold,
        EventCardEffectType.loseCollectiveResource,
        EventCardEffectType.loseCollectiveResourceAny,
        EventCardEffectType.loseCollectiveResourceType,
        EventCardEffectType.loseCollectiveExperience
      ].includes(effect.type)
    ) {
      return -Math.abs(value);
    }
    return Math.abs(value);
  }

  private resolveLootType(value: string | number | EventCardEffect | undefined): LootType | undefined {
    if (typeof value === 'string' && Object.values(LootType).includes(value as LootType)) {
      return value as LootType;
    }
    return undefined;
  }
}

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findItem, validSeed } from 'src/app/game/commands/CommandHelper';
import { CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Party } from 'src/app/game/model/Party';

type StringListField = 'achievementsList' | 'globalAchievementsList' | 'campaignStickers';

abstract class PartyListCommandImpl extends CommandImpl {
  requiredParameters: number = 2;
  abstract field: StringListField;

  list(party: Party): string[] {
    return party[this.field];
  }

  validParameters(entry: string, value: boolean): boolean {
    return typeof entry === 'string' && !!entry && typeof value === 'boolean';
  }

  executeWithParameters(entry: string, value: boolean) {
    const list = this.list(gameManager.game.party);
    if (!value && list.includes(entry)) {
      list.splice(list.lastIndexOf(entry), 1);
    } else if (value && !list.includes(entry)) {
      list.push(entry);
    }
  }
}

export class PartyAchievementCommand extends PartyListCommandImpl {
  id: string = 'party.achievement';
  field: StringListField = 'achievementsList';
}

export class PartyGlobalAchievementCommand extends PartyListCommandImpl {
  id: string = 'party.globalAchievement';
  field: StringListField = 'globalAchievementsList';
}

export class PartyCampaignStickerCommand extends PartyListCommandImpl {
  id: string = 'party.campaignSticker';
  field: StringListField = 'campaignStickers';
}

export class PartyTownGuardPerkSectionCommand extends CommandImpl {
  id: string = 'party.townGuardPerkSection';
  requiredParameters: number = 3;

  validParameters(section: string, value: boolean, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      typeof section === 'string' &&
      !!section &&
      typeof value === 'boolean' &&
      gameManager.game.party.townGuardPerkSections.includes(section) !== value
    );
  }

  executeWithParameters(section: string, value: boolean, seed: number) {
    gameManager.game.seed = seed;
    const party = gameManager.game.party;
    if (value) {
      party.townGuardPerkSections.push(section);
    } else {
      party.townGuardPerkSections.splice(party.townGuardPerkSections.indexOf(section), 1);
    }
    let active = false;
    if (party.townGuardDeck) {
      const current = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(party, gameManager.campaignManager.campaignData());
      gameManager.attackModifierManager.fromModel(current, party.townGuardDeck);
      active = current.active;
    }
    const townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(
      party,
      gameManager.campaignManager.campaignData()
    );
    townGuardDeck.active = active;
    gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
    party.townGuardDeck = townGuardDeck.toModel();
  }
}

export class PartyTreasureCommand extends CommandImpl {
  id: string = 'party.treasure';
  requiredParameters: number = 3;

  has(edition: BASE_TYPE, treasure: BASE_TYPE): boolean {
    return gameManager.game.party.treasures.some((identifier) => identifier.edition === edition && identifier.name === '' + treasure);
  }

  validParameters(edition: string, treasure: number, value: boolean): boolean {
    return typeof edition === 'string' && typeof treasure === 'number' && treasure > 0 && typeof value === 'boolean';
  }

  executeWithParameters(edition: string, treasure: number, value: boolean) {
    if (!value) {
      gameManager.game.party.treasures = gameManager.game.party.treasures.filter(
        (identifier) => identifier.edition !== edition || identifier.name !== '' + treasure
      );
    } else if (!this.has(edition, treasure)) {
      gameManager.game.party.treasures.push(new Identifier('' + treasure, edition));
    }
  }
}

abstract class PartyItemCommandImpl extends CommandImpl {
  requiredParameters: number = 3;

  item(): ItemData | undefined {
    return findItem(this.parameters[0], this.parameters[1]);
  }

  unlocked(item: ItemData): CountIdentifier | undefined {
    return gameManager.game.party.unlockedItems.find(
      (identifier) => identifier.name === '' + item.id && identifier.edition === item.edition
    );
  }

  validParameters(edition: string, id: string | number, value: BASE_TYPE): boolean {
    return !!this.item() && typeof value === 'boolean';
  }
}

export class PartyItemUnlockCommand extends PartyItemCommandImpl {
  id: string = 'party.item.unlock';

  executeWithParameters(edition: string, id: string | number, value: boolean) {
    const item = this.item();
    if (item) {
      const unlocked = this.unlocked(item);
      if (unlocked && !value) {
        gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems.filter((identifier) => identifier !== unlocked);
      } else if (!unlocked && value) {
        gameManager.game.party.unlockedItems.push(new CountIdentifier(item.id, item.edition));
      }
    } else {
      this.executionError('item not found');
    }
  }
}

export class PartyItemCountCommand extends PartyItemCommandImpl {
  id: string = 'party.item.count';

  override validParameters(edition: string, id: string | number, count: number): boolean {
    const item = this.item();
    return (
      !!item &&
      !!this.unlocked(item) &&
      typeof count === 'number' &&
      Number.isInteger(count) &&
      (count === -1 || (count > 0 && count < item.count))
    );
  }

  executeWithParameters(edition: string, id: string | number, count: number) {
    const item = this.item();
    const unlocked = item && this.unlocked(item);
    if (item && unlocked) {
      unlocked.count = count;
    } else {
      this.executionError('unlocked item not found');
    }
  }
}

export class PartyItemFilterCommand extends PartyItemCommandImpl {
  id: string = 'party.item.filter';

  filtered(item: ItemData): boolean {
    return gameManager.game.party.filteredItems.some(
      (identifier) => identifier.edition === item.edition && identifier.name === '' + item.id
    );
  }

  executeWithParameters(edition: string, id: string | number, value: boolean) {
    const item = this.item();
    if (item) {
      if (this.filtered(item) === value) {
        return;
      }
      if (!value) {
        gameManager.game.party.filteredItems = gameManager.game.party.filteredItems.filter(
          (identifier) => identifier.edition !== item.edition || identifier.name !== '' + item.id
        );
      } else {
        gameManager.game.party.filteredItems.push(new Identifier(item.id, item.edition));
      }
    } else {
      this.executionError('item not found');
    }
  }
}

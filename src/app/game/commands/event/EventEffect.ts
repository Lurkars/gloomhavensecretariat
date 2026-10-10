import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { fillParameter, findCharacter, findItem } from 'src/app/game/commands/CommandHelper';
import { findScenarioData, findSectionData } from 'src/app/game/commands/scenario/Scenario';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier, CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

const CAMPAIGN_EFFECTS = ['prosperity', 'reputation', 'morale', 'inspiration', 'factionReputation'];

export class EventEffectCommand extends CommandImpl {
  id: string = 'event.effect';
  requiredParameters: number = 2;

  validParameters(type: string, value: number, faction: string = ''): boolean {
    return CAMPAIGN_EFFECTS.includes(type) && typeof value === 'number' && value !== 0 && (type !== 'factionReputation' || !!faction);
  }

  executeWithParameters(type: string, value: number, faction: string = '') {
    switch (type) {
      case 'prosperity':
        gameManager.campaignManager.changeProsperity(value);
        break;
      case 'reputation':
        gameManager.campaignManager.changeReputation(value);
        break;
      case 'morale':
        gameManager.campaignManager.changeMorale(value);
        break;
      case 'inspiration':
        gameManager.game.party.inspiration += value;
        break;
      case 'factionReputation':
        gameManager.campaignManager.changeFactionReputation(faction, value);
        break;
    }
  }
}

const CHARACTER_EFFECTS = ['experience', 'gold', 'battleGoals', 'resource'];

export class EventEffectCharactersCommand extends CommandImpl {
  id: string = 'event.effect.characters';
  requiredParameters: number = 3;

  characters(): Character[] {
    return this.parameters
      .slice(3)
      .map((number) => findCharacter(number))
      .filter((character) => !!character) as Character[];
  }

  validParameters(type: string, value: number, lootType: string, ...numbers: number[]): boolean {
    return (
      CHARACTER_EFFECTS.includes(type) &&
      typeof value === 'number' &&
      value !== 0 &&
      (type !== 'resource' || Object.values(LootType).includes(lootType as LootType)) &&
      (numbers.length > 0 || type === 'resource') &&
      numbers.every((number) => !!findCharacter(number))
    );
  }

  executeWithParameters(type: string, value: number, lootType: LootType) {
    const characters = this.characters();
    if (type === 'resource' && !characters.length) {
      gameManager.game.party.loot[lootType] = (gameManager.game.party.loot[lootType] || 0) + value;
      return;
    }
    characters.forEach((character) => {
      switch (type) {
        case 'experience':
          character.progress.experience = Math.max(0, character.progress.experience + value);
          break;
        case 'gold':
          character.progress.gold = Math.max(0, character.progress.gold + value);
          if (value > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.gold, undefined, value);
          }
          break;
        case 'battleGoals':
          character.progress.battleGoals = Math.max(0, character.progress.battleGoals + value);
          if (value > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              character,
              PersonalQuestAutotrackType.battleGoals,
              undefined,
              value
            );
          }
          break;
        case 'resource':
          character.progress.loot[lootType] = Math.max(0, (character.progress.loot[lootType] || 0) + value);
          break;
      }
    });
  }
}

export class EventEffectRandomItemCommand extends CommandImpl {
  id: string = 'event.effect.randomItem';
  requiredParameters: number = 0;

  validParameters(blueprint: boolean = false, edition: string = '', id: string | number = ''): boolean {
    return typeof blueprint === 'boolean' && (!edition || !!findItem(edition, id));
  }

  executeWithParameters(blueprint: boolean = false, edition: string = '') {
    let item: ItemData | undefined;
    if (edition) {
      item = findItem(edition, this.parameters[2]);
    } else {
      item = gameManager.itemManager.drawRandomItem(gameManager.currentEdition(), blueprint);
      if (item) {
        fillParameter(this, 1, [blueprint], item.edition);
        this.parameters[2] = item.id;
      }
    }
    if (item) {
      gameManager.game.party.unlockedItems.push(new CountIdentifier(item.id, item.edition));
    } else if (gameManager.fhRules()) {
      gameManager.game.party.inspiration += 1;
    }
  }
}

export class EventEffectRandomScenarioCommand extends CommandImpl {
  id: string = 'event.effect.randomScenario';
  requiredParameters: number = 0;

  find(section: BASE_TYPE | undefined, edition: BASE_TYPE | undefined, index: BASE_TYPE | undefined, group: BASE_TYPE | undefined) {
    return section ? findSectionData(edition, index, group) : findScenarioData(edition, index, group);
  }

  validParameters(section: boolean = false, edition: string = '', index: string = '', group: string = ''): boolean {
    return typeof section === 'boolean' && (!edition || !!this.find(section, edition, index, group));
  }

  executeWithParameters(section: boolean = false, edition: string = '', index: string = '', group: string = '') {
    let scenarioData: ScenarioData | undefined;
    if (edition) {
      scenarioData = this.find(section, edition, index, group);
    } else {
      scenarioData = section
        ? gameManager.scenarioManager.drawRandomScenarioSection(gameManager.currentEdition())
        : gameManager.scenarioManager.drawRandomScenario(gameManager.currentEdition());
      if (scenarioData) {
        fillParameter(this, 1, [section], scenarioData.edition);
        this.parameters[2] = scenarioData.index;
        this.parameters[3] = scenarioData.group || '';
      }
    }
    if (scenarioData) {
      const model = new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group);
      if (section) {
        gameManager.game.party.conclusions.push(model);
      } else {
        gameManager.game.party.manualScenarios.push(model);
      }
    } else if (gameManager.fhRules()) {
      gameManager.game.party.inspiration += 1;
    }
  }
}

type DistributionValues = Partial<Record<string, number>>;
type DistributionItem = [string, string | number, number];

type Distribution = {
  receive?: Partial<Record<string, DistributionValues>>;
  spend?: Partial<Record<string, DistributionValues>>;
  spendParty?: DistributionValues;
  itemsReceive?: DistributionItem[];
  itemsConsume?: DistributionItem[];
  itemsLose?: DistributionItem[];
};

export class EventDistributionCommand extends CommandImpl {
  id: string = 'event.distribution';
  requiredParameters: number = 1;

  distribution(json: BASE_TYPE): Distribution | undefined {
    try {
      const distribution = JSON.parse(json as string);
      return distribution && typeof distribution === 'object' ? (distribution as Distribution) : undefined;
    } catch {
      return undefined;
    }
  }

  validParameters(json: string): boolean {
    const distribution = this.distribution(json);
    if (!distribution) {
      return false;
    }
    const characterNumbers = [...Object.keys(distribution.receive || {}), ...Object.keys(distribution.spend || {})].map((key) => +key);
    const items = [...(distribution.itemsReceive || []), ...(distribution.itemsConsume || []), ...(distribution.itemsLose || [])];
    return (
      characterNumbers.every((number) => !!findCharacter(number)) &&
      items.every((item) => Array.isArray(item) && !!findItem(item[0], item[1]) && !!findCharacter(item[2]))
    );
  }

  apply(character: Character, values: DistributionValues, sign: number) {
    Object.keys(values).forEach((type) => {
      const amount = (values[type] || 0) * sign;
      if (!amount) {
        return;
      }
      if (type === 'gold') {
        character.progress.gold = Math.max(0, character.progress.gold + amount);
      } else if (type === 'experience') {
        character.progress.experience = Math.max(0, character.progress.experience + amount);
      } else {
        const lootType = type as LootType;
        character.progress.loot[lootType] = Math.max(0, (character.progress.loot[lootType] || 0) + amount);
      }
    });
  }

  executeWithParameters(json: string) {
    const distribution = this.distribution(json);
    if (!distribution) {
      this.executionError('invalid distribution');
      return;
    }

    Object.keys(distribution.receive || {}).forEach((key) => {
      const character = findCharacter(+key);
      const values = (distribution.receive || {})[key];
      if (character && values) {
        this.apply(character, values, 1);
      }
    });

    Object.keys(distribution.spend || {}).forEach((key) => {
      const character = findCharacter(+key);
      const values = (distribution.spend || {})[key];
      if (character && values) {
        this.apply(character, values, -1);
      }
    });

    Object.keys(distribution.spendParty || {}).forEach((type) => {
      const amount = (distribution.spendParty || {})[type] || 0;
      if (amount && type !== 'gold' && type !== 'experience') {
        const lootType = type as LootType;
        gameManager.game.party.loot[lootType] = Math.max(0, (gameManager.game.party.loot[lootType] || 0) - amount);
      }
    });

    (distribution.itemsReceive || []).forEach(([edition, id, number]) => {
      const item = findItem(edition, id);
      const character = findCharacter(number);
      if (item && character) {
        gameManager.itemManager.addItem(item, character);
      }
    });

    (distribution.itemsConsume || []).forEach(([edition, id, number]) => {
      const item = findItem(edition, id);
      const character = findCharacter(number);
      if (item && character) {
        let equipped = character.progress.equippedItems.find(
          (identifier) => identifier.name === '' + item.id && identifier.edition === item.edition
        );
        if (!equipped) {
          equipped = new AdditionalIdentifier(item.id, item.edition);
          character.progress.equippedItems.push(equipped);
        }
        equipped.tags = equipped.tags || [];
        if (!equipped.tags.includes(ItemFlags.consumed)) {
          equipped.tags.push(ItemFlags.consumed);
        }
      }
    });

    (distribution.itemsLose || []).forEach(([edition, id, number]) => {
      const item = findItem(edition, id);
      const character = findCharacter(number);
      if (item && character) {
        gameManager.itemManager.removeItem(item, character);
      }
    });
  }
}

import { EventDistribution, EventDistributionValues } from 'src/app/game/businesslogic/EventCardManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { fillParameter, findCharacter, findItem } from 'src/app/game/commands/CommandHelper';
import { findScenarioData, findSectionData } from 'src/app/game/commands/scenario/Scenario';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';

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
        gameManager.campaignManager.changeInspiration(value);
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
      gameManager.eventCardManager.changeSupplyResource(lootType, value);
    } else {
      gameManager.eventCardManager.changeCharacterValue(
        characters,
        type as 'experience' | 'gold' | 'battleGoals' | 'resource',
        value,
        lootType
      );
    }
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
      item = gameManager.itemManager.drawRandomItem(gameManager.editionManager.currentEdition(), blueprint);
      if (item) {
        fillParameter(this, 1, [blueprint], item.edition);
        this.parameters[2] = item.id;
      }
    }
    gameManager.eventCardManager.applyRandomItem(item);
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
        ? gameManager.scenarioManager.drawRandomScenarioSection(gameManager.editionManager.currentEdition())
        : gameManager.scenarioManager.drawRandomScenario(gameManager.editionManager.currentEdition());
      if (scenarioData) {
        fillParameter(this, 1, [section], scenarioData.edition);
        this.parameters[2] = scenarioData.index;
        this.parameters[3] = scenarioData.group || '';
      }
    }
    gameManager.eventCardManager.applyRandomScenario(scenarioData, section);
  }
}

type DistributionItem = [string, string | number, number];

type Distribution = {
  receive?: Partial<Record<string, EventDistributionValues>>;
  receiveParty?: EventDistributionValues;
  spend?: Partial<Record<string, EventDistributionValues>>;
  spendParty?: EventDistributionValues;
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

  executeWithParameters(json: string) {
    const jsonDistribution = this.distribution(json);
    if (!jsonDistribution) {
      this.executionError('invalid distribution');
      return;
    }
    const distribution = new EventDistribution();
    const values = (entries: Partial<Record<string, EventDistributionValues>> | undefined) =>
      Object.keys(entries || {})
        .map((key) => ({ character: findCharacter(+key), values: (entries || {})[key] }))
        .filter((entry) => !!entry.character && !!entry.values)
        .map((entry) => ({ character: entry.character as Character, values: entry.values as EventDistributionValues }));
    const items = (entries: DistributionItem[] | undefined) =>
      (entries || [])
        .map(([edition, id, number]) => ({ item: findItem(edition, id), character: findCharacter(number) }))
        .filter((entry) => !!entry.item && !!entry.character)
        .map((entry) => ({ item: entry.item as ItemData, character: entry.character as Character }));
    distribution.receive = values(jsonDistribution.receive);
    distribution.receiveParty = jsonDistribution.receiveParty || {};
    distribution.spend = values(jsonDistribution.spend);
    distribution.spendParty = jsonDistribution.spendParty || {};
    distribution.itemsReceive = items(jsonDistribution.itemsReceive);
    distribution.itemsConsume = items(jsonDistribution.itemsConsume);
    distribution.itemsLose = items(jsonDistribution.itemsLose);
    gameManager.eventCardManager.applyDistribution(distribution);
  }
}

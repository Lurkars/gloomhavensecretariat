import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType, resourceLootTypes } from 'src/app/game/model/data/Loot';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

export class RetirementQuest {
  personalQuest: PersonalQuest;
  building: BuildingData | undefined;
  unlockEvent: string = '';
  characterAlreadyUnlocked: boolean = false;
  characterScenario: ScenarioData | boolean | undefined;
  characterItemDesign: ItemData | boolean | undefined;
  envelopeAlreadyUnlocked: boolean = false;
  envelopeSection: ScenarioData | boolean | undefined;
  envelopeItemBlueprint: ItemData | boolean | undefined;

  constructor(personalQuest: PersonalQuest) {
    this.personalQuest = personalQuest;
  }
}

export class Retirement {
  character: Character;
  personalQuest: RetirementQuest | undefined;
  personalQuestConclusion: ScenarioData | undefined;
  conclusion: ScenarioData | undefined;
  alreadyRetired: boolean = false;
  hasResources: boolean = false;
  reservedRandomScenario: ScenarioData | undefined;
  reservedRandomItem: ItemData | undefined;
  additional: RetirementQuest | undefined;

  constructor(character: Character) {
    this.character = character;
  }
}

export class RetirementManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  retireCharacter(character: Character) {
    character.progress.retired = true;
    if (this.game.party.campaignMode) {
      this.game.party.retirements.push(character.toModel());
      gameManager.characterManager.removeCharacter(character, true);
    }
  }

  canSetModelPlayerNumber(characterModel: GameCharacterModel, number: number): boolean {
    return Number.isInteger(number) && number > 0 && number !== characterModel.number;
  }

  // player number of a retired or stored character
  setModelPlayerNumber(characterModel: GameCharacterModel, number: number): boolean {
    if (!this.canSetModelPlayerNumber(characterModel, number)) {
      return false;
    }
    characterModel.number = number;
    return true;
  }

  reactivatable(model: GameCharacterModel): boolean {
    return (
      this.game.party.retirements.includes(model) &&
      !this.game.figures.some((figure) => figure instanceof Character && figure.name === model.name && figure.edition === model.edition) &&
      !this.game.party.availableCharacters.some((other) => other.name === model.name && other.edition === model.edition)
    );
  }

  reactivateCharacter(model: GameCharacterModel) {
    const character = new Character(gameManager.editionManager.getCharacterData(model.name, model.edition), model.level);
    character.fromModel(model);
    character.progress.retired = false;
    character.progress.personalQuestProgress = [];
    this.game.figures.push(character);
    this.game.party.retirements.splice(this.game.party.retirements.indexOf(model), 1);
  }

  retirement(character: Character): Retirement {
    const retirement = new Retirement(character);
    let skipCharacterConclusion = false;
    const personalQuest = character.progress.personalQuest
      ? gameManager.personalQuestManager.personalQuestByCard(gameManager.editionManager.currentEdition(), character.progress.personalQuest)
      : undefined;

    if (personalQuest) {
      const pqRef = 'PQ-' + personalQuest.cardId;
      retirement.personalQuestConclusion = gameManager.editionManager
        .sectionData(personalQuest.edition)
        .find((sectionData) => sectionData.retirement === pqRef && sectionData.conclusion);
      if (retirement.personalQuestConclusion) {
        skipCharacterConclusion = retirement.personalQuestConclusion.rewards?.characterRetirementSkipEvents !== undefined;
      }
    }

    if (!skipCharacterConclusion) {
      retirement.conclusion = gameManager.editionManager
        .sectionData(character.edition)
        .find((sectionData) => sectionData.retirement === character.name && sectionData.conclusion);
    }

    retirement.hasResources = Object.keys(character.progress.loot).some(
      (key) => resourceLootTypes.includes(key as LootType) && !!character.progress.loot[key as LootType]
    );

    if (personalQuest) {
      const fhQuest = !!personalQuest.openEnvelope && gameManager.fhRules();
      const scenarios = fhQuest
        ? gameManager.scenarioManager.drawRandomScenarioSectionsBatch(personalQuest.edition, 2)
        : gameManager.scenarioManager.drawRandomScenariosBatch(personalQuest.edition, 2);
      const items = gameManager.itemManager.drawRandomItemsBatch(personalQuest.edition, 2, fhQuest);
      retirement.personalQuest = this.retirementQuest(
        personalQuest,
        () => scenarios.pop(),
        () => items.pop()
      );
      retirement.reservedRandomScenario = scenarios.pop();
      retirement.reservedRandomItem = items.pop();
    }

    retirement.alreadyRetired = this.game.party.retirements.some(
      (retired) => retired.edition === character.edition && retired.name === character.name
    );
    return retirement;
  }

  setAdditionalQuest(retirement: Retirement, cardId: string) {
    const personalQuest = gameManager.personalQuestManager.personalQuestByCard(gameManager.editionManager.currentEdition(), cardId);
    retirement.additional = personalQuest
      ? this.retirementQuest(
          personalQuest,
          () => retirement.reservedRandomScenario,
          () => retirement.reservedRandomItem,
          retirement.personalQuest && retirement.personalQuest.building,
          true
        )
      : undefined;
  }

  envelopeBuilding(envelope: string, both: boolean = true, exclude: BuildingData | undefined = undefined): BuildingData | undefined {
    const buildingData = gameManager.campaignManager.campaignData().buildings;
    if (buildingData) {
      const buildings = envelope
        .split(':')
        .map((id) => buildingData.find((buildingData) => buildingData.id === id))
        .filter((buildingData) => buildingData)
        .map((buildingData) => buildingData as BuildingData);
      if (buildings.length > 0) {
        if (!this.game.party.buildings.some((buildingModel) => buildingModel.name === buildings[0].name) && exclude !== buildings[0]) {
          return buildings[0];
        } else if (
          both &&
          buildings.length > 1 &&
          !this.game.party.buildings.some((buildingModel) => buildingModel.name === buildings[1].name)
        ) {
          return buildings[1];
        }
      }
    }
    return undefined;
  }

  private retirementQuest(
    personalQuest: PersonalQuest,
    scenario: () => ScenarioData | undefined,
    item: () => ItemData | undefined,
    mainBuilding: BuildingData | undefined = undefined,
    additional: boolean = false
  ): RetirementQuest {
    const quest = new RetirementQuest(personalQuest);
    if (settingsManager.settings.unlockEnvelopeBuildings && personalQuest.openEnvelope) {
      quest.building = this.envelopeBuilding(personalQuest.openEnvelope, true, mainBuilding);
    }

    if (personalQuest.unlockCharacter) {
      quest.characterAlreadyUnlocked = this.game.unlockedCharacters.includes(personalQuest.edition + ':' + personalQuest.unlockCharacter);
      if (quest.characterAlreadyUnlocked) {
        const characterScenario = scenario();
        const characterItemDesign = item();
        quest.characterScenario = settingsManager.settings.drawRandomScenario ? characterScenario : !!characterScenario;
        quest.characterItemDesign = settingsManager.settings.drawRandomItem ? characterItemDesign : !!characterItemDesign;
      } else {
        const unlockCharacter = gameManager.editionManager
          .charactersData(personalQuest.edition)
          .find((characterData) => characterData.edition === personalQuest.edition && characterData.name === personalQuest.unlockCharacter);
        quest.unlockEvent = (unlockCharacter && unlockCharacter.unlockEvent) || '';
      }
    }

    if (personalQuest.openEnvelope && gameManager.fhRules()) {
      const envelopeExclude = additional ? mainBuilding : quest.building;
      quest.envelopeAlreadyUnlocked =
        !this.envelopeBuilding(personalQuest.openEnvelope, false, envelopeExclude) &&
        !this.envelopeBuilding(personalQuest.openEnvelope, true, envelopeExclude);
      if (quest.envelopeAlreadyUnlocked) {
        const envelopeSection = scenario();
        const envelopeItemBlueprint = item();
        quest.envelopeSection = settingsManager.settings.drawRandomScenario ? envelopeSection : !!envelopeSection;
        quest.envelopeItemBlueprint = settingsManager.settings.drawRandomItem ? envelopeItemBlueprint : !!envelopeItemBlueprint;
      }
    }
    return quest;
  }

  retire(retirement: Retirement, additional: boolean = false): ScenarioData[] {
    const character = retirement.character;
    character.progress.retired = true;
    this.game.party.retirements.push(character.toModel());
    gameManager.characterManager.removeCharacter(character, true);

    if (retirement.personalQuest) {
      this.applyQuest(retirement.personalQuest);
    }

    if (additional && retirement.additional) {
      if (gameManager.fhRules()) {
        this.game.party.inspiration -= 15;
      } else if (gameManager.gh2eRules()) {
        this.game.party.inspiration -= 12;
      }
      gameManager.campaignManager.changeProsperity(2);
      this.applyQuest(retirement.additional);
    }

    return [retirement.conclusion, retirement.personalQuestConclusion]
      .filter((conclusion) => !!conclusion)
      .map((conclusion) => conclusion as ScenarioData)
      .filter((conclusion) => !gameManager.campaignManager.conclusionFinished(conclusion));
  }

  private applyQuest(quest: RetirementQuest) {
    const personalQuest = quest.personalQuest;
    if (personalQuest.unlockCharacter && settingsManager.settings.automaticUnlocking) {
      gameManager.characterManager.unlockCharacter(personalQuest.edition, personalQuest.unlockCharacter);
    }

    if (personalQuest.unlockPQ && settingsManager.settings.automaticUnlocking) {
      gameManager.personalQuestManager.unlockPersonalQuest(personalQuest.edition, personalQuest.unlockPQ);
    }

    if (quest.characterAlreadyUnlocked) {
      if (quest.characterScenario && quest.characterScenario !== true) {
        this.game.party.manualScenarios.push(
          new GameScenarioModel(quest.characterScenario.index, quest.characterScenario.edition, quest.characterScenario.group)
        );
      }
      if (quest.characterItemDesign && quest.characterItemDesign !== true) {
        this.game.party.unlockedItems.push(new CountIdentifier(quest.characterItemDesign.id, quest.characterItemDesign.edition));
      }
    }

    if (quest.envelopeAlreadyUnlocked) {
      const envelopeSection = quest.envelopeSection;
      if (envelopeSection && envelopeSection !== true) {
        this.game.party.conclusions.push(new GameScenarioModel(envelopeSection.index, envelopeSection.edition, envelopeSection.group));
        (envelopeSection.unlocks || []).forEach((unlock) =>
          this.game.party.manualScenarios.push(new GameScenarioModel(unlock, envelopeSection.edition))
        );
      } else {
        this.game.party.inspiration += 1;
      }

      if (quest.envelopeItemBlueprint && quest.envelopeItemBlueprint !== true) {
        this.game.party.unlockedItems.push(new CountIdentifier(quest.envelopeItemBlueprint.id, quest.envelopeItemBlueprint.edition));
      } else {
        this.game.party.inspiration += 1;
      }
    }

    if (settingsManager.settings.unlockEnvelopeBuildings && quest.building) {
      this.game.party.buildings.push(new BuildingModel(quest.building.name, 0));
    }
  }
}

import { gameManager } from "../businesslogic/GameManager";
import { settingsManager } from "../businesslogic/SettingsManager";
import { Character, GameCharacterModel } from "./Character";
import { AttackModifierDeck, defaultAttackModifierCards, GameAttackModifierDeckModel } from "./data/AttackModifier";
import { ChallengeDeck, GameChallengeDeckModel } from "./data/Challenges";
import { ConditionName } from "./data/Condition";
import { defaultElementBoard, ElementModel, } from "./data/Element";
import { Identifier } from "./data/Identifier";
import { Loot, lootCardIdMigration, LootDeck, LootType } from "./data/Loot";
import { ScenarioFinish } from "./data/ScenarioData";
import { ScenarioRule, ScenarioRuleIdentifier } from "./data/ScenarioRule";
import { EntityCounter } from "./Entity";
import { Figure } from "./Figure";
import { GameMonsterModel, Monster } from "./Monster";
import { GameObjectiveContainerModel, ObjectiveContainer } from "./ObjectiveContainer";
import { Party } from "./Party";
import { GameScenarioModel, Scenario } from "./Scenario";

export class Game {
  revision: number = 0;
  revisionOffset: number = 0;
  edition: string | undefined = undefined;
  conditions: ConditionName[] = [];
  battleGoalEditions: string[] = [];
  filteredBattleGoals: Identifier[] = [];
  figures: Figure[] = [];
  entitiesCounter: EntityCounter[] = []
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  sections: Scenario[] = [];
  scenarioRules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];
  appliedScenarioRules: ScenarioRuleIdentifier[] = [];
  discardedScenarioRules: ScenarioRuleIdentifier[] = [];
  level: number = 1;
  levelCalculation: boolean = true;
  levelAdjustment: number = 0;
  bonusAdjustment: number = 0;
  ge5Player: boolean = true;
  playerCount: number = -1;
  round: number = 0;
  roundResets: number[] = [];
  roundResetsHidden: number[] = [];
  playSeconds: number = 0;
  totalSeconds: number = 0;
  monsterAttackModifierDeck: AttackModifierDeck = new AttackModifierDeck();
  allyAttackModifierDeck: AttackModifierDeck = new AttackModifierDeck();
  elementBoard: ElementModel[];
  solo: boolean = false;
  party: Party;
  parties: Party[];
  lootDeck: LootDeck = new LootDeck();
  lootDeckEnhancements: Loot[] = [];
  lootDeckFixed: LootType[] = [];
  lootDeckSections: string[] = [];
  unlockedCharacters: string[] = [];
  server: boolean = false;
  finish: ScenarioFinish | undefined;
  gameClock: GameClockTimestamp[] = [];
  challengeDeck: ChallengeDeck = new ChallengeDeck();
  favors: Identifier[] = [];
  favorPoints: number[] = [];
  keepFavors: boolean = false;

  constructor() {
    this.elementBoard = JSON.parse(JSON.stringify(defaultElementBoard));
    this.party = new Party();
    this.parties = [this.party];
  }

  toModel(): GameModel {
    return new GameModel(this.revision, this.revisionOffset, this.edition, this.conditions, this.battleGoalEditions, this.filteredBattleGoals, this.figures.map((figure) => figure.edition + '-' + (figure instanceof ObjectiveContainer ? figure.uuid : figure.name)), this.entitiesCounter, this.figures.filter((figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel())), this.figures.filter((figure) => figure instanceof Monster).map((figure) => ((figure as Monster).toModel())), this.figures.filter((figure) => figure instanceof ObjectiveContainer).map((figure) => ((figure as ObjectiveContainer).toModel())), this.state, this.scenario && gameManager.scenarioManager.toModel(this.scenario, this.scenario.revealedRooms, this.scenario.additionalSections, this.scenario.custom, this.scenario.custom ? this.scenario.name : "") || undefined, this.sections.map((section) => gameManager.scenarioManager.toModel(section, section.revealedRooms, section.additionalSections)), this.scenarioRules.map((value) => value.identifier), this.appliedScenarioRules, this.discardedScenarioRules, this.level, this.levelCalculation, this.levelAdjustment, this.bonusAdjustment, this.ge5Player, this.playerCount, this.round, this.roundResets, this.roundResetsHidden, this.playSeconds, this.totalSeconds, this.monsterAttackModifierDeck.toModel(), this.allyAttackModifierDeck.toModel(), this.elementBoard, this.solo, this.party, this.parties, this.lootDeck, this.lootDeckEnhancements, this.lootDeckFixed, this.lootDeckSections, this.unlockedCharacters, this.server, this.finish, this.gameClock, this.challengeDeck.toModel(), this.favors, this.favorPoints, this.keepFavors);
  }

  fromModel(model: GameModel, server: boolean = false) {
    this.revision = model.revision || 0;
    this.revisionOffset = model.revisionOffset || 0;
    this.edition = model.edition;
    this.conditions = model.conditions || [];
    this.battleGoalEditions = model.battleGoalEditions || [];
    this.filteredBattleGoals = model.filteredBattleGoals || [];
    this.figures = this.figures.filter((figure) =>
      model.characters.map((gcm) => gcm.name).indexOf(figure.name) != -1 ||
      model.monsters.map((gmm) => gmm.name).indexOf(figure.name) != -1 ||
      model.objectiveContainers && model.objectiveContainers.map((gom) => gom.name).indexOf(figure.name) != -1
    );

    this.entitiesCounter = model.entitiesCounter || [];

    model.characters.forEach((value) => {
      let character = this.figures.find((figure) => figure instanceof Character && figure.name == value.name && figure.edition == value.edition) as Character;
      if (!character) {
        character = new Character(gameManager.getCharacterData(value.name, value.edition), value.level);
        this.figures.push(character);
      }
      character.fromModel(value);
    });

    model.monsters.forEach((value) => {
      let monster = this.figures.find((figure) => figure instanceof Monster && figure.name == value.name && figure.edition == value.edition) as Monster;
      if (!monster) {
        monster = new Monster(gameManager.getMonsterData(value.name, value.edition));
        this.figures.push(monster);
      }
      monster.fromModel(value);
    });

    if (model.objectiveContainers) {
      this.figures = this.figures.filter((figure) => !(figure instanceof ObjectiveContainer) || model.objectiveContainers && model.objectiveContainers.some((value) => value.uuid && value.uuid == figure.uuid));
      model.objectiveContainers.forEach((value) => {
        let objectiveContainer = this.figures.find((figure) => figure instanceof ObjectiveContainer && figure.uuid == value.uuid) as ObjectiveContainer;
        if (!objectiveContainer) {
          objectiveContainer = new ObjectiveContainer(value.uuid, value.additionalObjectiveId || value.objectiveId);
          this.figures.push(objectiveContainer);
        }
        objectiveContainer.fromModel(value);
      });
    }

    this.figures.sort((a, b) => model.figures.indexOf(a.edition + '-' + (a instanceof ObjectiveContainer ? a.uuid : a.name)) - model.figures.indexOf(b.edition + '-' + (b instanceof ObjectiveContainer ? b.uuid : b.name)));

    this.state = model.state;

    if (model.scenario) {
      const scenarioData = gameManager.scenarioManager.scenarioDataForModel(model.scenario);
      if (scenarioData) {
        this.scenario = new Scenario(scenarioData, model.scenario.revealedRooms || [], model.scenario.additionalSections || [], model.scenario.isCustom);
      } else {
        this.scenario = undefined;
      }
    } else {
      this.scenario = undefined;
    }

    this.sections = [];
    model.sections.forEach((value) => {
      const sectionModelData = gameManager.scenarioManager.sectionDataForModel(value);
      if (sectionModelData) {
        this.sections.push(new Scenario(sectionModelData, value.revealedRooms || []));
      }
    })
    this.level = model.level;

    this.scenarioRules = [];

    if (model.scenarioRules) {
      model.scenarioRules.forEach((identifier) => {
        const scenario = gameManager.scenarioRulesManager.getScenarioForRule((identifier)).scenario;
        if (scenario) {
          if (scenario.rules && scenario.rules.length > identifier.index && identifier.index >= 0) {
            if (scenario.rules[identifier.index].spawns) {
              scenario.rules[identifier.index].spawns.forEach((spawn) => { if (spawn.manual && !spawn.count) { spawn.count = "1"; } });
            }
            this.scenarioRules.push({ identifier: identifier, rule: scenario.rules[identifier.index] });
          } else if (scenario.errata && identifier.index < 0 && scenario.errata.split('|')[identifier.index * -1 - 1]) {
            this.scenarioRules.push({ identifier: identifier, rule: gameManager.scenarioRulesManager.createErrataRule(scenario.edition, scenario.errata.split('|')[identifier.index * -1 - 1]) });
          }
        }
      })
    }

    this.appliedScenarioRules = model.appliedScenarioRules || [];
    this.discardedScenarioRules = model.discardedScenarioRules || model.disgardedScenarioRules || [];

    this.levelCalculation = model.levelCalculation;
    this.levelAdjustment = model.levelAdjustment;
    this.bonusAdjustment = model.bonusAdjustment;
    this.ge5Player = model.ge5Player;
    this.playerCount = model.playerCount || -1;

    this.round = model.round;
    this.roundResets = model.roundResets || [];
    this.roundResetsHidden = model.roundResetsHidden || [];
    if (server && !model.server || model.playSeconds > this.playSeconds) {
      this.playSeconds = model.playSeconds;
    }
    if (server && !model.server || model.totalSeconds > this.totalSeconds) {
      this.totalSeconds = model.totalSeconds;
    }
    this.monsterAttackModifierDeck = this.monsterAttackModifierDeck || new AttackModifierDeck();
    if (model.monsterAttackModifierDeck && model.monsterAttackModifierDeck.cards && model.monsterAttackModifierDeck.cards.length > 0) {
      gameManager.attackModifierManager.fromModel(this.monsterAttackModifierDeck, model.monsterAttackModifierDeck);
    }

    this.allyAttackModifierDeck = this.allyAttackModifierDeck || new AttackModifierDeck();
    if (model.allyAttackModifierDeck && model.allyAttackModifierDeck.cards && model.allyAttackModifierDeck.cards.length > 0) {
      gameManager.attackModifierManager.fromModel(this.allyAttackModifierDeck, model.allyAttackModifierDeck);
    }

    this.elementBoard = this.elementBoard || defaultElementBoard;

    if (model.elementBoard) {
      model.elementBoard.forEach((element, index) => this.elementBoard[index].state = element.state);
    }

    this.solo = model.solo;
    this.party = model.party ? JSON.parse(JSON.stringify(model.party)) : new Party();

    // migration
    if (this.party.achievementsList) {
      const partyAchievementsLabel = settingsManager.label.data.partyAchievements;
      this.party.achievementsList = this.party.achievementsList.filter((item) => item);
      this.party.achievementsList = this.party.achievementsList.map((value) => {
        let achievement = value;
        Object.keys(partyAchievementsLabel).forEach((key) => {
          if (partyAchievementsLabel[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          }
        })
        return achievement;
      })
    }

    if (this.party.globalAchievementsList) {
      const globalAchievementsLabel = settingsManager.label.data.globalAchievements;
      this.party.globalAchievementsList = this.party.globalAchievementsList.filter((item) => item);
      this.party.globalAchievementsList = this.party.globalAchievementsList.map((value) => {
        let achievement = value;
        Object.keys(globalAchievementsLabel).forEach((key) => {
          if (globalAchievementsLabel[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          }
        })
        return achievement;
      })
    }

    if (this.party.campaignStickers) {
      this.party.campaignStickers = this.party.campaignStickers.filter((item) => item).map((value) => {
        let sticker = value;
        Object.keys(settingsManager.label.data.campaignSticker).forEach((key) => {
          if (settingsManager.label.data.campaignSticker[key] == sticker) {
            sticker = key;
            return;
          }
        })
        return sticker;
      })
    }

    // migrate randomScenarios to randomScenariosFh
    if (this.party.manualScenarios) {
      let removeManual: GameScenarioModel[] = [];
      this.party.manualScenarios.forEach((model) => {
        if (model.edition == 'fh' && !model.group && !model.custom) {
          const conclusion = gameManager.sectionData('fh').find((sectionData) => sectionData.random && sectionData.unlocks && sectionData.unlocks.indexOf(model.index) != -1);
          if (conclusion) {
            if (!this.party.conclusions.find((conclusionModel) => conclusionModel.edition == conclusion.edition && conclusionModel.group == conclusion.group && conclusionModel.index == conclusion.index)) {
              this.party.conclusions.push(new GameScenarioModel('' + conclusion.index, conclusion.edition, conclusion.group));
              removeManual.push(model);
            }
          }
        }
      })
      this.party.manualScenarios = this.party.manualScenarios.filter((model) => removeManual.indexOf(model) == -1);
    }

    this.party.players = this.party.players || [];
    this.party.casualScenarios = this.party.casualScenarios || [];
    this.party.pets = this.party.pets || [];

    this.parties = [this.party];
    if (model.parties) {
      model.parties.forEach((party) => {
        if (party.id != this.party.id) {
          // migration
          if (party.achievements) {
            party.achievementsList.push(...party.achievements.split("\n"));
            party.achievements = "";
          }

          if (party.globalAchievements) {
            party.globalAchievementsList.push(...party.globalAchievements.split("\n"));
            party.globalAchievements = "";
          }

          this.parties.push(Object.assign(new Party(), party));
        }
      })
    }

    if (model.lootDeck) {
      if (!this.lootDeck) {
        this.lootDeck = model.lootDeck;
      } else {
        this.lootDeck.fromModel(model.lootDeck);
      }
    } else {
      this.lootDeck = new LootDeck();
    }

    this.lootDeckEnhancements = model.lootDeckEnhancements || [];
    this.lootDeckFixed = model.lootDeckFixed || [];
    this.lootDeckSections = model.lootDeckSections || [];

    this.favors = model.favors || [];
    this.favorPoints = model.favorPoints || [];
    this.keepFavors = model.keepFavors || false;

    // migration 
    this.lootDeckEnhancements.forEach((loot) => {
      if (loot.value) {
        if (!isNaN(+loot.value)) {
          loot.value4P = +loot.value;
          loot.value3P = +loot.value;
          loot.value2P = +loot.value;
        } else if (loot.value == "%game.loot.player.3-4% +1/%game.loot.player.2% +2") {
          loot.value4P = 1;
          loot.value3P = 1;
          loot.value2P = 2;
        } else if (loot.value == "%game.loot.player.4% +1/%game.loot.player.2-3% +2") {
          loot.value4P = 1;
          loot.value3P = 2;
          loot.value2P = 2;
        } else {
          console.warn("Cannot migrate loot: " + loot.value);
        }

        loot.value = undefined;
      }
    })

    lootCardIdMigration(this.lootDeck.cards);
    lootCardIdMigration(this.lootDeckEnhancements);

    this.unlockedCharacters = model.unlockedCharacters || [];
    this.challengeDeck = this.challengeDeck || new ChallengeDeck();
    if (model.challengeDeck) {
      this.challengeDeck.fromModel(model.challengeDeck);
    }

    // migration
    if (settingsManager.settings.spoilers) {
      gameManager.charactersData().filter((characterData) => characterData.spoiler).forEach((characterData) => {
        const index = settingsManager.settings.spoilers.indexOf(characterData.name);
        if (index != -1) {
          if (this.unlockedCharacters.indexOf(characterData.name) == -1) {
            this.unlockedCharacters.push(characterData.name);
          }
          settingsManager.settings.spoilers.splice(index, 1);
        }
      })
    }

    this.server = model.server;
    this.finish = model.finish;
    if (settingsManager.settings.gameClockMerge) {
      this.gameClock = gameManager.mergeGameClocks(this.gameClock, model.gameClock);
    } else if (!server) {
      this.gameClock = model.gameClock;
    }
  }
}

export enum GameState {
  draw = "draw",
  next = "next",
}

export class GameClockTimestamp {
  clockIn: number;
  clockOut: number | undefined;

  constructor(clockIn: number,
    clockOut: number | undefined = undefined) {
    this.clockIn = clockIn;
    this.clockOut = clockOut;
  }
}

export class GameModel {

  revision: number;
  revisionOffset: number;
  edition: string | undefined;
  conditions: ConditionName[];
  battleGoalEditions: string[];
  filteredBattleGoals: Identifier[];
  figures: string[];
  entitiesCounter: EntityCounter[];
  characters: GameCharacterModel[];
  monsters: GameMonsterModel[];
  objectiveContainers: GameObjectiveContainerModel[] | undefined;
  state: GameState;
  scenario: GameScenarioModel | undefined;
  sections: GameScenarioModel[];
  scenarioRules: ScenarioRuleIdentifier[];
  appliedScenarioRules: ScenarioRuleIdentifier[];
  discardedScenarioRules: ScenarioRuleIdentifier[];
  level: number;
  levelCalculation: boolean;
  levelAdjustment: number;
  bonusAdjustment: number;
  ge5Player: boolean;
  playerCount: number;
  round: number;
  roundResets: number[];
  roundResetsHidden: number[];
  playSeconds: number;
  totalSeconds: number;
  monsterAttackModifierDeck: GameAttackModifierDeckModel;
  allyAttackModifierDeck: GameAttackModifierDeckModel;
  elementBoard: ElementModel[];
  solo: boolean;
  party: Party;
  parties: Party[];
  lootDeck: LootDeck;
  lootDeckEnhancements: Loot[];
  lootDeckFixed: LootType[];
  lootDeckSections: string[];
  unlockedCharacters: string[];
  server: boolean;
  finish: ScenarioFinish | undefined;
  gameClock: GameClockTimestamp[];
  challengeDeck: GameChallengeDeckModel;
  favors: Identifier[];
  favorPoints: number[];
  keepFavors: boolean;
  // migration
  disgardedScenarioRules: ScenarioRuleIdentifier[];

  constructor(
    revision: number = 0,
    revisionOffset: number = 0,
    edition: string | undefined = undefined,
    conditions: ConditionName[] = [],
    battleGoalEditions: string[] = [],
    filteredBattleGoals: Identifier[] = [],
    figures: string[] = [],
    entitiesCounter: EntityCounter[] = [],
    characters: GameCharacterModel[] = [],
    monsters: GameMonsterModel[] = [],
    objectiveContainers: GameObjectiveContainerModel[] | undefined = undefined,
    state: GameState = GameState.next,
    scenario: GameScenarioModel | undefined = undefined,
    sections: GameScenarioModel[] = [],
    scenarioRules: ScenarioRuleIdentifier[] = [],
    appliedScenarioRules: ScenarioRuleIdentifier[] = [],
    discardedScenarioRules: ScenarioRuleIdentifier[] = [],
    level: number = 0,
    levelCalculation: boolean = true,
    levelAdjustment: number = 0,
    bonusAdjustment: number = 0,
    ge5Player: boolean = true,
    playerCount: number = -1,
    round: number = 0,
    roundResets: number[] = [],
    roundResetsHidden: number[] = [],
    playSeconds: number = 0,
    totalSeconds: number = 0,
    monsterAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards, [], true),
    allyAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards, [], true),
    elementBoard: ElementModel[] = [],
    solo: boolean = false,
    party: Party = new Party(),
    parties: Party[] = [],
    lootDeck: LootDeck = new LootDeck(),
    lootDeckEnhancements: Loot[] = [],
    lootDeckFixed: LootType[] = [],
    lootDeckSections: string[] = [],
    unlockedCharacters: string[] = [],
    server: boolean = false,
    finish: ScenarioFinish | undefined = undefined,
    gameClock: GameClockTimestamp[] = [],
    challengeDeck: GameChallengeDeckModel = new GameChallengeDeckModel(),
    favors: Identifier[] = [],
    favorPoints: number[] = [],
    keepFavors: boolean = false) {
    this.revision = revision;
    this.revisionOffset = revisionOffset;
    this.edition = edition;
    this.conditions = conditions;
    this.battleGoalEditions = battleGoalEditions;
    this.filteredBattleGoals = filteredBattleGoals;
    this.figures = figures;
    this.entitiesCounter = JSON.parse(JSON.stringify(entitiesCounter));
    this.characters = characters;
    this.monsters = monsters;
    this.objectiveContainers = objectiveContainers;
    this.state = state;
    this.scenario = scenario;
    this.sections = sections;
    this.scenarioRules = JSON.parse(JSON.stringify(scenarioRules));
    this.appliedScenarioRules = JSON.parse(JSON.stringify(appliedScenarioRules));
    this.discardedScenarioRules = JSON.parse(JSON.stringify(discardedScenarioRules));
    this.level = level;
    this.levelCalculation = levelCalculation;
    this.levelAdjustment = levelAdjustment;
    this.bonusAdjustment = bonusAdjustment;
    this.ge5Player = ge5Player;
    this.playerCount = playerCount;
    this.round = round;
    this.roundResets = JSON.parse(JSON.stringify(roundResets));
    this.roundResetsHidden = JSON.parse(JSON.stringify(roundResetsHidden));
    this.playSeconds = playSeconds;
    this.totalSeconds = totalSeconds;
    this.monsterAttackModifierDeck = monsterAttackModifierDeck;
    this.allyAttackModifierDeck = allyAttackModifierDeck;
    this.elementBoard = JSON.parse(JSON.stringify(elementBoard));
    this.solo = solo;
    this.party = JSON.parse(JSON.stringify(party));
    this.party.players = this.party.players.map((value) => value || "");
    this.parties = JSON.parse(JSON.stringify(parties));
    this.parties.forEach((party) => {
      party.players = party.players.map((value) => value || "");
    })
    this.lootDeck = JSON.parse(JSON.stringify(lootDeck));
    this.lootDeckEnhancements = JSON.parse(JSON.stringify(lootDeckEnhancements));
    this.lootDeckFixed = JSON.parse(JSON.stringify(lootDeckFixed));
    this.lootDeckSections = JSON.parse(JSON.stringify(lootDeckSections));
    this.unlockedCharacters = JSON.parse(JSON.stringify(unlockedCharacters));
    this.server = server;
    this.finish = finish ? JSON.parse(JSON.stringify(finish)) : undefined;
    this.gameClock = gameClock;
    this.challengeDeck = challengeDeck;
    this.favors = JSON.parse(JSON.stringify(favors));
    this.favorPoints = JSON.parse(JSON.stringify(favorPoints));
    this.keepFavors = keepFavors;
    // migration
    this.disgardedScenarioRules = JSON.parse(JSON.stringify(discardedScenarioRules));
  }

}
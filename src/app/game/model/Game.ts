import { gameManager } from "../businesslogic/GameManager";
import { settingsManager } from "../businesslogic/SettingsManager";
import { AttackModifierDeck, AttackModifierType, defaultAttackModifierCards, GameAttackModifierDeckModel } from "./AttackModifier";
import { Character, GameCharacterModel } from "./Character";
import { GameScenarioModel, ScenarioData, ScenarioRuleIdentifier } from "./data/ScenarioData";
import { defeaultElementBoard, Element, ElementModel, ElementState } from "./Element";
import { Figure } from "./Figure";
import { Loot, LootDeck } from "./Loot";
import { GameMonsterModel, Monster } from "./Monster";
import { GameObjectiveModel, Objective } from "./Objective";
import { Party } from "./Party";
import { Scenario } from "./Scenario";

export class Game {
  edition: string | undefined = undefined;
  figures: Figure[] = [];
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  sections: ScenarioData[] = [];
  scenarioRules: ScenarioRuleIdentifier[] = [];
  level: number = 1;
  levelCalculation: boolean = true;
  levelAdjustment: number = 0;
  bonusAdjustment: number = 0;
  ge5Player: boolean = true;
  round: number = 0;
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

  constructor() {
    this.elementBoard = JSON.parse(JSON.stringify(defeaultElementBoard));
    this.party = new Party();
    this.parties = [this.party];
  }

  toModel(): GameModel {
    return new GameModel(this.edition, this.figures.map((figure) => figure.name), this.figures.filter((figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel())), this.figures.filter((figure) => figure instanceof Monster).map((figure) => ((figure as Monster).toModel())), this.figures.filter((figure) => figure instanceof Objective).map((figure) => ((figure as Objective).toModel())), this.state, this.scenario && gameManager.scenarioManager.toModel(this.scenario, this.scenario.custom, this.scenario.custom ? this.scenario.name : "") || undefined, this.sections.map((sectionData) => gameManager.scenarioManager.toModel(sectionData)), this.scenarioRules, this.level, this.levelCalculation, this.levelAdjustment, this.bonusAdjustment, this.ge5Player, this.round, this.playSeconds, this.totalSeconds, this.monsterAttackModifierDeck.toModel(), this.allyAttackModifierDeck.toModel(), this.elementBoard, this.solo, this.party, this.parties, this.lootDeck, this.lootDeckEnhancements);
  }

  fromModel(model: GameModel, server: boolean = false) {
    this.edition = model.edition;
    this.figures = this.figures.filter((figure) =>
      model.characters.map((gcm) => gcm.name).indexOf(figure.name) != -1 ||
      model.monsters.map((gmm) => gmm.name).indexOf(figure.name) != -1 ||
      model.objectives.map((gom) => gom.name).indexOf(figure.name) != -1
    );

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

    model.objectives.forEach((value) => {
      let objective = this.figures.find((figure) => figure instanceof Objective && figure.id == value.id) as Objective;
      if (!objective) {
        if (!value.id) {
          value.id = 0;
          while (this.figures.some((figure) => figure instanceof Objective && figure.id == value.id)) {
            value.id++;
          }
        }

        objective = new Objective(value.id);
        this.figures.push(objective);
      }
      objective.fromModel(value);
    });

    this.figures = this.figures.filter((figure) => !(figure instanceof Objective) || model.objectives.some((obj) => obj.id == figure.id));

    this.figures.sort((a, b) => model.figures.indexOf(a.name) - model.figures.indexOf(b.name));

    this.state = model.state;

    if (model.scenario) {
      const scenarioData = gameManager.scenarioManager.scenarioDataForModel(model.scenario);
      if (scenarioData) {
        this.scenario = new Scenario(scenarioData, model.scenario.isCustom);
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
        this.sections.push(sectionModelData);
      }
    })
    this.level = model.level;

    this.scenarioRules = model.scenarioRules || [];

    // migration
    if (settingsManager.settings.levelCalculation != undefined) {
      model.levelCalculation = settingsManager.settings.levelCalculation;
      settingsManager.settings.levelCalculation = undefined;
      settingsManager.storeSettings();
    }
    if (settingsManager.settings.levelAdjustment != undefined) {
      model.levelAdjustment = settingsManager.settings.levelAdjustment;
      settingsManager.settings.levelAdjustment = undefined;
      settingsManager.storeSettings();
    }
    if (settingsManager.settings.bonusAdjustment != undefined) {
      model.bonusAdjustment = settingsManager.settings.bonusAdjustment;
      settingsManager.settings.bonusAdjustment = undefined;
      settingsManager.storeSettings();
    }
    if (settingsManager.settings.ge5Player != undefined) {
      model.ge5Player = settingsManager.settings.ge5Player;
      settingsManager.settings.ge5Player = undefined;
      settingsManager.storeSettings();
    }

    this.levelCalculation = model.levelCalculation;
    this.levelAdjustment = model.levelAdjustment;
    this.bonusAdjustment = model.bonusAdjustment;
    this.ge5Player = model.ge5Player;

    this.round = model.round;
    if (model.playSeconds > this.playSeconds) {
      this.playSeconds = model.playSeconds;
    }
    if (model.totalSeconds > this.totalSeconds) {
      this.totalSeconds = model.totalSeconds;
    }
    this.monsterAttackModifierDeck = this.monsterAttackModifierDeck || new AttackModifierDeck();
    if (model.monsterAttackModifierDeck && model.monsterAttackModifierDeck.cards && model.monsterAttackModifierDeck.cards.length > 0) {
      this.monsterAttackModifierDeck.fromModel(model.monsterAttackModifierDeck);
    }

    // Migration
    if (model.attackModifier && model.attackModifiers) {
      this.monsterAttackModifierDeck.fromModel(new GameAttackModifierDeckModel(model.attackModifier, model.attackModifiers))
    }

    this.allyAttackModifierDeck = this.allyAttackModifierDeck || new AttackModifierDeck();
    if (model.allyAttackModifierDeck && model.allyAttackModifierDeck.cards && model.allyAttackModifierDeck.cards.length > 0) {
      this.allyAttackModifierDeck.fromModel(model.allyAttackModifierDeck);
    }

    this.elementBoard = this.elementBoard || defeaultElementBoard;

    if (model.elementBoard) {
      model.elementBoard.forEach((element, index) => this.elementBoard[index].state = element.state);
    }

    // migration
    model.newElements.forEach((element) => {
      const elementModel = this.elementBoard.find((elementModel) => elementModel.type == element);
      if (elementModel) {
        elementModel.state = ElementState.new;
      }
    })

    model.strongElements.forEach((element) => {
      const elementModel = this.elementBoard.find((elementModel) => elementModel.type == element);
      if (elementModel) {
        elementModel.state = ElementState.strong;
      }
    })

    model.elements.forEach((element) => {
      const elementModel = this.elementBoard.find((elementModel) => elementModel.type == element);
      if (elementModel) {
        elementModel.state = ElementState.waning;
      }
    })

    this.solo = model.solo;
    this.party = model.party ? Object.assign(new Party(), model.party) : new Party();
    this.parties = [this.party];
    if (model.parties) {
      model.parties.forEach((party) => {
        if (party.id != this.party.id) {
          this.parties.push(Object.assign(new Party(), party));
        }
      })
    }


    this.lootDeck = model.lootDeck ? Object.assign(new LootDeck(), model.lootDeck) : new LootDeck();

    this.lootDeckEnhancements = model.lootDeckEnhancements || [];
  }
}

export enum GameState {
  draw = "draw",
  next = "next",
}

export class GameModel {

  edition: string | undefined;
  figures: string[];
  characters: GameCharacterModel[];
  monsters: GameMonsterModel[];
  objectives: GameObjectiveModel[];
  state: GameState;
  scenario: GameScenarioModel | undefined;
  sections: GameScenarioModel[];
  scenarioRules: ScenarioRuleIdentifier[];
  level: number;
  levelCalculation: boolean;
  levelAdjustment: number;
  bonusAdjustment: number;
  ge5Player: boolean;
  round: number;
  playSeconds: number;
  totalSeconds: number;
  monsterAttackModifierDeck: GameAttackModifierDeckModel;
  allyAttackModifierDeck: GameAttackModifierDeckModel;
  attackModifier: number | undefined;
  attackModifiers: AttackModifierType[] | undefined;
  elementBoard: ElementModel[];
  newElements: Element[] = [];
  strongElements: Element[] = [];
  elements: Element[] = [];
  solo: boolean;
  party: Party;
  parties: Party[];
  lootDeck: LootDeck;
  lootDeckEnhancements: Loot[];

  constructor(edition: string | undefined = undefined,
    figures: string[] = [],
    characters: GameCharacterModel[] = [],
    monsters: GameMonsterModel[] = [],
    objectives: GameObjectiveModel[] = [],
    state: GameState = GameState.next,
    scenario: GameScenarioModel | undefined = undefined,
    sections: GameScenarioModel[] = [],
    scenarioRules: ScenarioRuleIdentifier[] = [],
    level: number = 0,
    levelCalculation: boolean = true,
    levelAdjustment: number = 0,
    bonusAdjustment: number = 0,
    ge5Player: boolean = true,
    round: number = 0,
    playSeconds: number = 0,
    totalSeconds: number = 0,
    monsterAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards),
    allyAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards),
    elementBoard: ElementModel[] = [],
    solo: boolean = false,
    party: Party = new Party(),
    parties: Party[] = [],
    lootDeck: LootDeck = new LootDeck(),
    lootDeckEnhancements: Loot[] = []) {
    this.edition = edition;
    this.figures = figures;
    this.characters = characters;
    this.monsters = monsters;
    this.objectives = objectives;
    this.state = state;
    this.scenario = scenario;
    this.sections = sections;
    this.scenarioRules = JSON.parse(JSON.stringify(scenarioRules));
    this.level = level;
    this.levelCalculation = levelCalculation;
    this.levelAdjustment = levelAdjustment;
    this.bonusAdjustment = bonusAdjustment;
    this.ge5Player = ge5Player;
    this.round = round;
    this.playSeconds = playSeconds;
    this.totalSeconds = totalSeconds;
    this.monsterAttackModifierDeck = monsterAttackModifierDeck;
    this.allyAttackModifierDeck = allyAttackModifierDeck;
    this.elementBoard = JSON.parse(JSON.stringify(elementBoard));
    this.solo = solo;
    this.party = JSON.parse(JSON.stringify(party));
    this.parties = JSON.parse(JSON.stringify(parties));
    this.lootDeck = JSON.parse(JSON.stringify(lootDeck));
    this.lootDeckEnhancements = JSON.parse(JSON.stringify(lootDeckEnhancements))
  }

}
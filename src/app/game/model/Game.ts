import { gameManager } from "../businesslogic/GameManager";
import { AttackModifierDeck, defaultAttackModifierCards, GameAttackModifierDeckModel } from "./AttackModifier";
import { Character, GameCharacterModel } from "./Character";
import { ScenarioRule, ScenarioRuleIdentifier } from "./data/ScenarioRule";
import { defaultElementBoard, ElementModel, } from "./Element";
import { Figure } from "./Figure";
import { Loot, lootCardIdMigration, LootDeck, LootType } from "./Loot";
import { GameMonsterModel, Monster } from "./Monster";
import { GameObjectiveModel, Objective } from "./Objective";
import { Party } from "./Party";
import { GameScenarioModel, Scenario } from "./Scenario";

export class Game {
  revision: number = 0;
  edition: string | undefined = undefined;
  figures: Figure[] = [];
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  sections: Scenario[] = [];
  scenarioRules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];
  disgardedScenarioRules: ScenarioRuleIdentifier[] = [];
  level: number = 1;
  levelCalculation: boolean = true;
  levelAdjustment: number = 0;
  bonusAdjustment: number = 0;
  ge5Player: boolean = true;
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
  server: boolean = false;

  constructor() {
    this.elementBoard = JSON.parse(JSON.stringify(defaultElementBoard));
    this.party = new Party();
    this.parties = [this.party];
  }

  toModel(): GameModel {
    return new GameModel(this.revision, this.edition, this.figures.map((figure) => figure.name), this.figures.filter((figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel())), this.figures.filter((figure) => figure instanceof Monster).map((figure) => ((figure as Monster).toModel())), this.figures.filter((figure) => figure instanceof Objective).map((figure) => ((figure as Objective).toModel())), this.state, this.scenario && gameManager.scenarioManager.toModel(this.scenario, this.scenario.revealedRooms, this.scenario.custom, this.scenario.custom ? this.scenario.name : "") || undefined, this.sections.map((section) => gameManager.scenarioManager.toModel(section, section.revealedRooms)), this.scenarioRules.map((value) => value.identifier), this.disgardedScenarioRules, this.level, this.levelCalculation, this.levelAdjustment, this.bonusAdjustment, this.ge5Player, this.round, this.roundResets,this.roundResetsHidden, this.playSeconds, this.totalSeconds, this.monsterAttackModifierDeck.toModel(), this.allyAttackModifierDeck.toModel(), this.elementBoard, this.solo, this.party, this.parties, this.lootDeck, this.lootDeckEnhancements, this.lootDeckFixed, this.lootDeckSections, this.server);
  }

  fromModel(model: GameModel, server: boolean = false) {
    this.revision = model.revision || 0;
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

      // < 0.43 migration
      switch (value.name) {
        case 'ancient-artillery-133':
          value.name = 'ancient-artillery-section-133';
          break;
        case 'the-husk-66':
          value.name = 'the-husk-section-66';
          break;
        case 'the-husk-128':
          value.name = 'the-husk-section-128';
          break;
        case 'frozen-corpse-65':
          value.name = 'frozen-corpse-scenario-65';
          break;
        case 'living-bones-65':
          value.name = 'living-bones-scenario-65';
          break;
        case 'snow-imp-65':
          value.name = 'snow-imp-scenario-65';
          break;
        case 'cave-bear-54':
          value.name = 'cave-bear-scenario-54';
          break;
        case 'cultist-78':
          value.name = 'cultist-scenario-78';
          break;
        case 'cultist-89':
          value.name = 'cultist-scenario-89';
          break;
        case 'prime-demon-36':
          value.name = 'prime-demon-scenario-36';
          break;
        case 'vermling-raider-22':
          value.name = 'vermling-raider-scenario-223';
          break;
        case 'giant-viper-21':
          value.name = 'giant-viper-scenario-21';
          break;
        case 'rat-monstrosity-16-1':
          value.name = 'rat-monstrosity-scenario-16-1';
          break;
        case 'rat-monstrosity-16-2':
          value.name = 'rat-monstrosity-scenario-16-2';
          break;
        case 'stone-golem-22':
          value.name = 'stone-golem-scenario-22';
          break;
        case 'vermling-raider-22':
          value.name = 'vermling-raider-scenario-22';
          break;
      }


      let monster = this.figures.find((figure) => figure instanceof Monster && figure.name == value.name && figure.edition == value.edition) as Monster;
      if (!monster) {
        monster = new Monster(gameManager.getMonsterData(value.name, value.edition));
        this.figures.push(monster);
      }
      monster.fromModel(value);
    });

    model.objectives.forEach((value) => {
      let objective = this.figures.find((figure) => figure instanceof Objective && figure.id == value.id && figure.name == value.name && figure.marker == value.marker && (!figure.tags || figure.tags.every((tag, index, self) => index == self.indexOf(tag))) && (!figure.objectiveId && !value.objectiveId || figure.objectiveId && value.objectiveId && figure.objectiveId.edition == value.objectiveId.edition && figure.objectiveId.scenario == value.objectiveId.scenario && figure.objectiveId.group == value.objectiveId.group && figure.objectiveId.index == value.objectiveId.index && figure.objectiveId.section == value.objectiveId.section)) as Objective;
      if (!objective) {
        if (!value.id) {
          value.id = 0;
          while (this.figures.some((figure) => figure instanceof Objective && figure.id == value.id)) {
            value.id++;
          }
        }

        objective = new Objective(value.id, value.objectiveId);
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
        this.scenario = new Scenario(scenarioData, model.scenario.revealedRooms || [], model.scenario.isCustom);
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
        const scenario = gameManager.scenarioManager.getScenarioForRule((identifier)).scenario;
        if (scenario && scenario.rules && scenario.rules.length > identifier.index) {
          if (scenario.rules[identifier.index].spawns) {
            scenario.rules[identifier.index].spawns.forEach((spawn) => { if (spawn.manual && !spawn.count) { spawn.count = "1"; } });
          }
          this.scenarioRules.push({ identifier: identifier, rule: scenario.rules[identifier.index] });
        }
      })
    }

    this.disgardedScenarioRules = model.disgardedScenarioRules;

    this.levelCalculation = model.levelCalculation;
    this.levelAdjustment = model.levelAdjustment;
    this.bonusAdjustment = model.bonusAdjustment;
    this.ge5Player = model.ge5Player;

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
      this.monsterAttackModifierDeck.fromModel(model.monsterAttackModifierDeck);
    }

    this.allyAttackModifierDeck = this.allyAttackModifierDeck || new AttackModifierDeck();
    if (model.allyAttackModifierDeck && model.allyAttackModifierDeck.cards && model.allyAttackModifierDeck.cards.length > 0) {
      this.allyAttackModifierDeck.fromModel(model.allyAttackModifierDeck);
    }

    this.elementBoard = this.elementBoard || defaultElementBoard;

    if (model.elementBoard) {
      model.elementBoard.forEach((element, index) => this.elementBoard[index].state = element.state);
    }

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

    this.server = model.server;
  }
}

export enum GameState {
  draw = "draw",
  next = "next",
}

export class GameModel {

  revision: number;
  edition: string | undefined;
  figures: string[];
  characters: GameCharacterModel[];
  monsters: GameMonsterModel[];
  objectives: GameObjectiveModel[];
  state: GameState;
  scenario: GameScenarioModel | undefined;
  sections: GameScenarioModel[];
  scenarioRules: ScenarioRuleIdentifier[];
  disgardedScenarioRules: ScenarioRuleIdentifier[];
  level: number;
  levelCalculation: boolean;
  levelAdjustment: number;
  bonusAdjustment: number;
  ge5Player: boolean;
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
  server: boolean;

  constructor(revision: number = 0, edition: string | undefined = undefined,
    figures: string[] = [],
    characters: GameCharacterModel[] = [],
    monsters: GameMonsterModel[] = [],
    objectives: GameObjectiveModel[] = [],
    state: GameState = GameState.next,
    scenario: GameScenarioModel | undefined = undefined,
    sections: GameScenarioModel[] = [],
    scenarioRules: ScenarioRuleIdentifier[] = [],
    disgardedScenarioRules: ScenarioRuleIdentifier[] = [],
    level: number = 0,
    levelCalculation: boolean = true,
    levelAdjustment: number = 0,
    bonusAdjustment: number = 0,
    ge5Player: boolean = true,
    round: number = 0,
    roundResets: number[] = [],
    roundResetsHidden: number[] = [],
    playSeconds: number = 0,
    totalSeconds: number = 0,
    monsterAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards, []),
    allyAttackModifierDeck: GameAttackModifierDeckModel = new GameAttackModifierDeckModel(-1, defaultAttackModifierCards, []),
    elementBoard: ElementModel[] = [],
    solo: boolean = false,
    party: Party = new Party(),
    parties: Party[] = [],
    lootDeck: LootDeck = new LootDeck(),
    lootDeckEnhancements: Loot[] = [],
    lootDeckFixed: LootType[] = [],
    lootDeckSections: string[] = [],
    server: boolean = false) {
    this.revision = revision;
    this.edition = edition;
    this.figures = figures;
    this.characters = characters;
    this.monsters = monsters;
    this.objectives = objectives;
    this.state = state;
    this.scenario = scenario;
    this.sections = sections;
    this.scenarioRules = JSON.parse(JSON.stringify(scenarioRules));
    this.disgardedScenarioRules = JSON.parse(JSON.stringify(disgardedScenarioRules));
    this.level = level;
    this.levelCalculation = levelCalculation;
    this.levelAdjustment = levelAdjustment;
    this.bonusAdjustment = bonusAdjustment;
    this.ge5Player = ge5Player;
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
    this.parties = JSON.parse(JSON.stringify(parties));
    this.lootDeck = JSON.parse(JSON.stringify(lootDeck));
    this.lootDeckEnhancements = JSON.parse(JSON.stringify(lootDeckEnhancements));
    this.lootDeckFixed = JSON.parse(JSON.stringify(lootDeckFixed));
    this.lootDeckSections = JSON.parse(JSON.stringify(lootDeckSections));
    this.server = server;
  }

}
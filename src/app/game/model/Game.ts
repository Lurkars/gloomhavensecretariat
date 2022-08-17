import { gameManager } from "../businesslogic/GameManager";
import { AttackModifier, AttackModifierType, defaultAttackModifier } from "./AttackModifier";
import { Character, GameCharacterModel } from "./Character";
import { SectionData } from "./data/SectionData";
import { Element } from "./Element";
import { Figure } from "./Figure";
import { GameMonsterModel, Monster } from "./Monster";
import { GameObjectiveModel, Objective } from "./Objective";
import { Party } from "./Party";
import { Scenario } from "./Scenario";

export class Game {
  edition: string | undefined = undefined;
  figures: Figure[] = [];
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  sections: SectionData[] = [];
  level: number = 1;
  round: number = 0;
  playSeconds: number = 0;
  totalSeconds: number = 0;
  attackModifier: number = -1;
  attackModifiers: AttackModifier[] = defaultAttackModifier;
  newElements: Element[] = [];
  strongElements: Element[] = [];
  elements: Element[] = [];
  solo: boolean = false;
  party: Party | undefined = undefined;


  toModel(): GameModel {
    return new GameModel(this.edition, this.figures.map((figure) => figure.name), this.figures.filter((figure: Figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel())), this.figures.filter((figure: Figure) => figure instanceof Monster).map((figure) => ((figure as Monster).toModel())), this.figures.filter((figure: Figure) => figure instanceof Objective).map((figure) => ((figure as Objective).toModel())), this.state, this.scenario, this.sections, this.level, this.round, this.playSeconds, this.totalSeconds, this.attackModifier, this.attackModifiers.map((value) => value.type), this.newElements, this.strongElements, this.elements, this.solo, this.party);
  }

  fromModel(model: GameModel) {
    this.edition = model.edition;
    this.figures = this.figures.filter((figure: Figure) =>
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

    this.figures.sort((a: Figure, b: Figure) => model.figures.indexOf(a.name) - model.figures.indexOf(b.name));

    this.state = model.state;
    this.scenario = model.scenario;
    this.sections = model.sections || [];
    this.level = model.level;
    this.round = model.round;
    this.playSeconds = model.playSeconds;
    this.totalSeconds = model.totalSeconds;
    this.attackModifier = model.attackModifier;
    this.attackModifiers = model.attackModifiers.map((value) => new AttackModifier(value));
    if (!this.attackModifiers || this.attackModifiers.length == 0) {
      this.attackModifiers = defaultAttackModifier;
    }
    this.newElements = model.newElements;
    this.strongElements = model.strongElements;
    this.elements = model.elements;
    this.solo = model.solo;
    this.party = model.party;
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
  scenario: Scenario | undefined;
  sections: SectionData[] = [];
  level: number;
  round: number;
  playSeconds: number;
  totalSeconds: number;
  attackModifier: number;
  attackModifiers: AttackModifierType[];
  newElements: Element[];
  strongElements: Element[];
  elements: Element[];
  solo: boolean;
  party: Party | undefined;

  constructor(edition: string | undefined = undefined,
    figures: string[] = [],
    characters: GameCharacterModel[] = [],
    monsters: GameMonsterModel[] = [],
    objectives: GameObjectiveModel[] = [],
    state: GameState = GameState.next,
    scenario: Scenario | undefined = undefined,
    sections: SectionData[] = [],
    level: number = 0,
    round: number = 0,
    playSeconds: number = 0,
    totalSeconds: number = 0,
    attackModifier: number = -1,
    attackModifiers: AttackModifierType[] = [],
    newElements: Element[] = [],
    strongElements: Element[] = [],
    elements: Element[] = [],
    solo: boolean = false,
    party: Party | undefined = undefined) {
    this.edition = edition;
    this.figures = figures;
    this.characters = characters;
    this.monsters = monsters;
    this.objectives = objectives;
    this.state = state;
    this.scenario = scenario;
    this.sections = sections;
    this.level = level;
    this.round = round;
    this.playSeconds = playSeconds;
    this.totalSeconds = totalSeconds;
    this.attackModifier = attackModifier;
    this.attackModifiers = attackModifiers;
    this.newElements = newElements;
    this.strongElements = strongElements;
    this.elements = elements;
    this.solo = solo;
    this.party = party;
  }

}
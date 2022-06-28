import { gameManager } from "../businesslogic/GameManager";
import { AttackModifier, AttackModifierType, defaultAttackModifier } from "./AttackModifier";
import { Character, GameCharacterModel } from "./Character";
import { Element } from "./Element";
import { Figure } from "./Figure";
import { GameMonsterModel, Monster } from "./Monster";
import { GameObjectiveModel, Objective } from "./Objective";
import { Scenario } from "./Scenario";

export class Game {
  edition: string | undefined = undefined;
  figures: Figure[] = [];
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  level: number = 1;
  round: number = 0;
  attackModifier: number = -1;
  attackModifiers: AttackModifier[] = defaultAttackModifier;
  newElements: Element[] = [];
  strongElements: Element[] = [];
  elements: Element[] = [];


  toModel(): GameModel {
    return new GameModel(this.edition, this.figures.map((figure: Figure) => figure.name), this.figures.filter((figure: Figure) => figure instanceof Character).map((figure: Figure) => ((figure as Character).toModel())), this.figures.filter((figure: Figure) => figure instanceof Monster).map((figure: Figure) => ((figure as Monster).toModel())), this.figures.filter((figure: Figure) => figure instanceof Objective).map((figure: Figure) => ((figure as Objective).toModel())), this.state, this.scenario, this.level, this.round, this.attackModifier, this.attackModifiers.map((value: AttackModifier) => value.type), this.newElements, this.strongElements, this.elements);
  }

  fromModel(model: GameModel) {
    this.edition = model.edition;
    this.figures = this.figures.filter((figure: Figure) =>
      model.characters.map((gcm: GameCharacterModel) => gcm.name).indexOf(figure.name) != -1 ||
      model.monsters.map((gmm: GameMonsterModel) => gmm.name).indexOf(figure.name) != -1 ||
      model.objectives.map((gom: GameObjectiveModel) => gom.name).indexOf(figure.name) != -1
    );

    model.characters.forEach((value: GameCharacterModel) => {
      let character = this.figures.find((figure: Figure) => figure instanceof Character && figure.name == value.name && figure.edition == value.edition) as Character;
      if (!character) {
        character = new Character(gameManager.getCharacterData(value.name, value.edition), value.level);
        this.figures.push(character);
      }
      character.fromModel(value);
    });

    model.monsters.forEach((value: GameMonsterModel) => {
      let monster = this.figures.find((figure: Figure) => figure instanceof Monster && figure.name == value.name && figure.edition == value.edition) as Monster;
      if (!monster) {
        monster = new Monster(gameManager.getMonsterData(value.name, value.edition));
        this.figures.push(monster);
      }
      monster.fromModel(value);
    });

    model.objectives.forEach((value: GameObjectiveModel) => {
      let objective = this.figures.find((figure: Figure) => figure instanceof Objective && figure.id == value.id) as Objective;
      if (!objective) {
        if (!value.id) {
          value.id = 0;
          while (this.figures.some((figure: Figure) => figure instanceof Objective && figure.id == value.id)) {
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
    this.level = model.level;
    this.round = model.round;
    this.attackModifier = model.attackModifier;
    this.attackModifiers = model.attackModifiers.map((value: AttackModifierType) => new AttackModifier(value));
    if (!this.attackModifiers || this.attackModifiers.length == 0) {
      this.attackModifiers = defaultAttackModifier;
    }
    this.strongElements = model.strongElements;
    this.elements = model.elements;
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
  level: number;
  round: number;
  attackModifier: number;
  attackModifiers: AttackModifierType[];
  newElements: Element[];
  strongElements: Element[];
  elements: Element[];

  constructor(edition: string | undefined = undefined,
    figures: string[] = [],
    characters: GameCharacterModel[] = [],
    monsters: GameMonsterModel[] = [],
    objectives: GameObjectiveModel[] = [],
    state: GameState = GameState.next,
    scenario: Scenario | undefined = undefined,
    level: number = 0,
    round: number = 0,
    attackModifier: number = -1,
    attackModifieres: AttackModifierType[] = [],
    newElements: Element[] = [],
    strongElements: Element[] = [],
    elements: Element[] = []) {
    this.edition = edition;
    this.figures = figures;
    this.characters = characters;
    this.monsters = monsters;
    this.objectives = objectives;
    this.state = state;
    this.scenario = scenario;
    this.level = level;
    this.round = round;
    this.attackModifier = attackModifier;
    this.attackModifiers = attackModifieres;
    this.newElements = newElements;
    this.strongElements = strongElements;
    this.elements = elements;
  }

}
import { gameManager } from "../businesslogic/GameManager";
import { AttackModifier, AttackModifierType } from "./AttackModifier";
import { CharacterEntity, GameCharacterEntityModel } from "./CharacterEntity";
import { Element } from "./Element";
import { Figure } from "./Figure";
import { GameMonsterModel, Monster } from "./Monster";
import { Scenario } from "./Scenario";

export class Game {
  edition: string | undefined = undefined;
  figures: Figure[] = [];
  state: GameState = GameState.draw;
  scenario: Scenario | undefined = undefined;
  level: number = 1;
  round: number = 0;
  attackModifier: number = -1;
  attackModifiers: AttackModifier[] = [];
  newElements: Element[] = [];
  strongElements: Element[] = [];
  elements: Element[] = [];


  toModel(): GameModel {
    return new GameModel(this.edition, this.figures.filter((figure: Figure) => figure instanceof CharacterEntity).map((figure: Figure) => ((figure as CharacterEntity).toModel())), this.figures.filter((figure: Figure) => figure instanceof Monster).map((figure: Figure) => ((figure as Monster).toModel())), this.state, this.scenario, this.level, this.round,  this.attackModifier, this.attackModifiers.map((value: AttackModifier) => value.type), this.newElements, this.strongElements, this.elements);
  }

  fromModel(model: GameModel) {
    this.edition = model.edition;
    this.figures = [];

    model.characters.forEach((value: GameCharacterEntityModel) => {
      let character = new CharacterEntity(gameManager.getCharacterData(value.name), value.level);
      character.fromModel(value);
      this.figures.push(character);
    });

    model.monsters.forEach((value: GameMonsterModel) => {
      let monster = new Monster(gameManager.getMonsterData(value.name));
      monster.fromModel(value);
      this.figures.push(monster);
    });

    this.state = model.state;
    this.scenario = model.scenario;
    this.level = model.level;
    this.round = model.round;
    this.attackModifier = model.attackModifier;
    this.attackModifiers = model.attackModifiers.map((value: AttackModifierType) => new AttackModifier(value));
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
  characters: GameCharacterEntityModel[];
  monsters: GameMonsterModel[];
  state: GameState;
  scenario: Scenario | undefined;
  level: number;
  round: number;
  attackModifier: number;
  attackModifiers: AttackModifierType[];
  newElements: Element[];
  strongElements: Element[];
  elements: Element[];

  constructor(edition: string | undefined,
    characters: GameCharacterEntityModel[],
    monsters: GameMonsterModel[],
    state: GameState,
    scenario: Scenario | undefined,
    level: number,
    round: number,
    attackModifier: number,
    attackModifieres: AttackModifierType[],
    newElements: Element[],
    strongElements: Element[],
    elements: Element[]) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
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
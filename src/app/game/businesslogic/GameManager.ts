import { Ability } from "../model/Ability";
import { Character } from "../model/Character";
import { Condition, EntityCondition } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { DeckData } from "../model/data/DeckData";
import { EditionData } from "../model/data/EditionData";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioData } from "../model/data/ScenarioData";
import { Element } from "../model/Element";
import { FigureError } from "../model/FigureError";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterType } from "../model/MonsterType";
import { Objective } from "../model/Objective";
import { Scenario } from "../model/Scenario";
import { AttackModifierManager } from "./AttackModifierManager";
import { CharacterManager } from "./CharacterManager";
import { MonsterManager } from "./MonsterManager";
import { settingsManager } from "./SettingsManager";
import { StateManager } from "./StateManager";


export class GameManager {

  game: Game = new Game();
  editionData: EditionData[] = [];
  stateManager: StateManager;
  characterManager: CharacterManager;
  monsterManager: MonsterManager;
  attackModifierManager: AttackModifierManager;
  working: boolean = false;

  constructor() {
    this.stateManager = new StateManager(this.game);
    this.characterManager = new CharacterManager(this.game);
    this.monsterManager = new MonsterManager(this.game);
    this.attackModifierManager = new AttackModifierManager(this.game);
  }

  editions(): string[] {
    return this.editionData.map((editionData: EditionData) => editionData.edition);
  }

  charactersData(all: boolean = false): CharacterData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.characters).flat();
  }

  monstersData(all: boolean = false): MonsterData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.monsters).flat();
  }

  decksData(all: boolean = false): DeckData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.decks).flat();
  }

  scenarioData(all: boolean = false): ScenarioData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.scenarios).flat();
  }

  conditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return Object.values(EntityCondition);
    }

    return this.editionData.filter((editionData: EditionData) => editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.conditions).flat().filter((value: Condition, index: number, self: Condition[]) => self.indexOf(value) == index);
  }

  nextGameState(): void {
    this.working = true;
    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      this.characterManager.draw();
      this.monsterManager.draw();
      this.attackModifierManager.draw();

      if (settingsManager.settings.moveElements) {
        this.game.elements = [];
        this.game.strongElements.forEach((element: Element) => {
          this.game.elements.push(element);
        });
        this.game.strongElements = [];
      }

      this.sortFigures();

      this.game.figures.forEach((figure: Figure) => figure.active = false);

    } else if (this.nextAvailable()) {
      this.game.state = GameState.next;
      this.game.round++;
      this.characterManager.next();
      this.monsterManager.next();
      this.attackModifierManager.next();

      if (settingsManager.settings.moveElements) {
        this.game.newElements.forEach((element: Element) => {
          this.game.strongElements.push(element);
        });
        this.game.newElements = [];
      }

      this.sortFigures();

      if (this.game.figures.length > 0) {
        this.game.figures[ 0 ].active = true;
      }
    }
    setTimeout(() => this.working = false, 1);
  }

  sortFigures() {
    if (this.game.state == GameState.draw) {
      this.game.figures.sort((a: Figure, b: Figure) => {
        let aName = a.name.toLowerCase();
        if (a instanceof Character) {
          aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
        } else if (a instanceof Monster) {
          aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
        } else if (a instanceof Objective) {
          aName = a.title.toLowerCase() || settingsManager.getLabel(a.name).toLowerCase();
        }

        let bName = b.name.toLowerCase();
        if (b instanceof Character) {
          bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
        } else if (b instanceof Monster) {
          bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
        } else if (b instanceof Objective) {
          bName = b.title.toLowerCase() || settingsManager.getLabel(b.name).toLowerCase();
        }

        if (a instanceof Character && b instanceof Monster) {
          return -1;
        } else if (a instanceof Monster && b instanceof Character) {
          return 1;
        }
        return aName < bName ? -1 : 1;
      })
    } else {
      this.game.figures.sort((a: Figure, b: Figure) => {
        if (a instanceof Character && a.exhausted) {
          return 99;
        }

        if (b instanceof Character && b.exhausted) {
          return 99;
        }
        return a.getInitiative() - b.getInitiative();
      });
    }
  }

  abilities(figure: MonsterData | CharacterData): Ability[] {
    const abilities = this.decksData(true).find((deck: DeckData) => deck.name == figure.name && deck.edition == figure.edition)?.abilities;
    if (!abilities) {
      console.error("Unknwon deck: " + figure.name + " for " + figure.edition);
      if (figure.errors.indexOf(FigureError.deck) == -1) {
        figure.errors.push(FigureError.deck);
      }
      return [];
    }
    return abilities;
  }

  nextAvailable(): boolean {
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure: Figure) => figure instanceof Monster || figure instanceof Objective || figure instanceof Character && (figure.getInitiative() > 0 || figure.exhausted)
    ));
  }

  getCharacterData(name: string, edition: string): CharacterData {
    let characterData = this.charactersData(true).find((value: CharacterData) => value.name == name && value.edition == edition)
    if (!characterData) {
      console.error("unknown character: " + name);
      characterData = new CharacterData(name, [], "")
      characterData.errors.push(FigureError.unknown);
      return characterData;
    }
    return characterData;
  }

  isCharacter(figure: Figure): boolean {
    return figure instanceof Character;
  }

  isObjective(figure: Figure): boolean {
    return figure instanceof Objective;
  }

  isMonster(figure: Figure): boolean {
    return figure instanceof Monster;
  }

  toCharacter(figure: Figure): Character {
    return figure as Character;
  }

  toObjective(figure: Figure): Objective {
    return figure as Objective;
  }

  toMonster(figure: Figure): Monster {
    return figure as Monster;
  }

  getEdition(figure: any): string {
    if (this.game.figures.some((value: any) => typeof (figure) == typeof (value) && figure.name == value.name && figure.edition != value.edition || this.game.edition && figure.edition != this.game.edition)) {
      return figure.edition;
    }
    return "";
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData(true).find((value: MonsterData) => value.name == name && value.edition == edition);
    if (!monsterData) {
      console.error("unknown monster '" + name + "' for edition '" + edition + "'");
      monsterData = new MonsterData(name, 0, new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0), [], "");
      monsterData.errors.push(FigureError.unknown);
      return monsterData;
    }

    return monsterData;
  }

  toggleOff(figure: Figure) {
    const figures: Figure[] = this.game.figures;
    const index = figures.indexOf(figure);

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    if (!figure.active && !figure.off) {
      figure.active = true;
    } else if (figure.active && !figure.off) {
      figure.off = true;
      figure.active = false;
    } else {
      figure.off = false;
      figure.active = !figures.some((other: Figure, otherIndex: number) => otherIndex < index && other.active);
    }

    for (let i = 0; i < figures.length; i++) {
      if (figure.active) {
        if (i != index) {
          figures[ i ].active = false;
        }
        if (i < index) {
          figures[ i ].off = true;
        } else {
          figures[ i ].off = false;
        }
      }
      if (figure.off) {
        if (i < index) {
          figures[ i ].off = true;
          figures[ i ].active = false;
        }
        if (i > index) {
          figures[ i ].off = false;
          if (i == index + 1) {
            figures[ i ].active = true;
          } else {
            figures[ i ].active = false;
          }
        }
      }
    }

  }

  toggleElement(element: Element) {
    if (this.game.state == GameState.draw) {
      if (this.game.newElements.indexOf(element) != -1) {
        this.game.newElements.splice(this.game.newElements.indexOf(element), 1);
        this.game.elements.push(element);
      } else if (this.game.elements.indexOf(element) != -1) {
        this.game.elements.splice(this.game.elements.indexOf(element), 1);
      } else {
        this.game.newElements.push(element);
      }
    } else {
      if (this.game.strongElements.indexOf(element) != -1) {
        this.game.strongElements.splice(this.game.strongElements.indexOf(element), 1);
        this.game.elements.push(element);
      } else if (this.game.elements.indexOf(element) != -1) {
        this.game.elements.splice(this.game.elements.indexOf(element), 1);
      } else {
        this.game.strongElements.push(element);
      }
    }
  }

  setLevel(level: number) {
    this.game.level = level;

    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Monster) {
        figure.level = level;
        figure.entities.forEach((monsterEntity: MonsterEntity) => {
          monsterEntity.level = level
        })
      }
    })

  }

  szenarioLevel(): number {
    let charLevel = 0;
    let charCount = 0;

    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Character) {
        charLevel += figure.level;
        charCount += 1;
      }
    })

    if (charCount == 0) {
      return 0;
    }

    return Math.ceil(charLevel / charCount / 2);
  }

  setScenario(scenario: Scenario | undefined) {
    this.game.scenario = scenario;
    if (scenario && !scenario.custom) {
      this.game.figures = this.game.figures.filter((figure: Figure) => figure instanceof CharacterData);
      scenario.monsters.forEach((name: string) => {
        const monsterData = this.monstersData(true).find((monsterData: MonsterData) => monsterData.name == name && monsterData.edition == scenario.edition);
        if (monsterData) {
          this.monsterManager.addMonster(monsterData);
        }
      });
    }
  }

}

export const gameManager: GameManager = new GameManager();
import { Ability } from "../model/Ability";
import { Character } from "../model/Character";
import { CharacterCondition, Condition, EntityCondition, RoundCondition, StackableCondition, UpgradeCondition } from "../model/Condition";
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
import { SectionData } from "../model/data/SectionData";
import { ObjectiveData } from "../model/data/ObjectiveData";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Summon, SummonState } from "../model/Summon";


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

  editionExtensions(edition: string): string[] {
    const editionData = this.editionData.find((editionData: EditionData) => editionData.edition == edition);
    return editionData && editionData.extentions || [];
  }

  charactersData(all: boolean = false): CharacterData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extentions && editionData.extentions.indexOf(this.game.edition) != -1).map((editionData: EditionData) => editionData.characters).flat();
  }

  monstersData(all: boolean = false): MonsterData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extentions && editionData.extentions.indexOf(this.game.edition) != -1).map((editionData: EditionData) => editionData.monsters).flat();
  }

  decksData(all: boolean = false): DeckData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extentions && editionData.extentions.indexOf(this.game.edition) != -1).map((editionData: EditionData) => editionData.decks).flat();
  }

  scenarioData(all: boolean = false): ScenarioData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extentions && editionData.extentions.indexOf(this.game.edition) != -1).map((editionData: EditionData) => editionData.scenarios).flat();
  }

  sectionData(all: boolean = false): SectionData[] {
    return this.editionData.filter((editionData: EditionData) => all || !this.game.edition || editionData.edition == this.game.edition || editionData.extentions && editionData.extentions.indexOf(this.game.edition) != -1).map((editionData: EditionData) => editionData.sections).flat();
  }


  characterConditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return [ ...Object.values(EntityCondition), ...Object.values(CharacterCondition) ];
    }

    return this.editionData.filter((editionData: EditionData) => editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.conditions).flat().filter((value: Condition) => value in EntityCondition || value in CharacterCondition);
  }

  monsterConditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return [ ...Object.values(EntityCondition) ];
    }

    return this.editionData.filter((editionData: EditionData) => editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.conditions).flat().filter((value: Condition) => value in EntityCondition);
  }

  upgradeConditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return Object.values(UpgradeCondition);
    }

    return this.editionData.filter((editionData: EditionData) => editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.conditions).flat().filter((value: Condition) => value in UpgradeCondition);
  }

  stackableConditions(all: boolean = false): Condition[] {
    if (all || !this.game.edition) {
      return Object.values(StackableCondition);
    }

    return this.editionData.filter((editionData: EditionData) => editionData.edition == this.game.edition).map((editionData: EditionData) => editionData.conditions).flat().filter((value: Condition) => value in StackableCondition);
  }

  markers(): string[] {
    return this.game.figures.filter((figure: Figure) => figure instanceof Character && figure.marker).map((figure: Figure) => (figure as Character).edition + '-' + figure.name);
  }

  nextGameState(): void {
    this.working = true;
    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      this.characterManager.next();
      this.monsterManager.next();
      this.attackModifierManager.next();

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
      this.characterManager.draw();
      this.monsterManager.draw();
      this.attackModifierManager.draw();

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
    this.game.figures.sort((a: Figure, b: Figure) => {

      if (this.game.state == GameState.draw) {
        let aName = a.name.toLowerCase();
        if (a instanceof Character) {
          aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
        } else if (a instanceof Monster) {
          aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
        } else if (a instanceof Objective) {
          aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective')).toLowerCase());
        }

        let bName = b.name.toLowerCase();
        if (b instanceof Character) {
          bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
        } else if (b instanceof Monster) {
          bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
        } else if (b instanceof Objective) {
          bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective')).toLowerCase());
        }
        if (a instanceof Character && b instanceof Monster) {
          return -1;
        } else if (a instanceof Monster && b instanceof Character) {
          return 1;
        }
        return aName < bName ? -1 : 1;
      } else {
        return a.getInitiative() - b.getInitiative();
      }
    });
  }


  deckData(figure: MonsterData | CharacterData): DeckData {
    let deckData = this.decksData(true).find((deck: DeckData) => (deck.name == figure.deck || deck.name == figure.name) && deck.edition == figure.edition);

    // find extensions decks
    if (!deckData) {
      deckData = this.decksData(true).find((deck: DeckData) => (deck.name == figure.deck || deck.name == figure.name) && this.editionExtensions(figure.edition).indexOf(deck.edition) != -1);
    }

    if (!deckData) {
      console.error("Unknwon deck: " + figure.name + (figure.deck ? "[" + figure.deck + "]" : "") + " for " + figure.edition);
      if (figure.errors.indexOf(FigureError.deck) == -1) {
        figure.errors.push(FigureError.deck);
      }
      return new DeckData('', [], '');
    }

    return deckData;
  }

  abilities(figure: MonsterData | CharacterData): Ability[] {
    return this.deckData(figure).abilities;
  }

  nextAvailable(): boolean {
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure: Figure) => figure instanceof Monster || figure instanceof Objective || figure instanceof Character && (figure.getInitiative() > 0 || figure.exhausted)
    ));
  }

  getCharacterData(name: string, edition: string): CharacterData {
    let characterData = this.charactersData(true).find((value: CharacterData) => value.name == name && value.edition == edition);
    if (!characterData) {
      console.error("unknown character: " + name);
      characterData = this.charactersData(true).find((value: CharacterData) => value.name == name);
      if (!characterData) {
        characterData = new CharacterData(name, [], "")
        characterData.errors.push(FigureError.unknown);
      }
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
      monsterData = this.monstersData(true).find((value: MonsterData) => value.name == name);
      if (!monsterData) {
        monsterData = new MonsterData(name, 0, new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0), [], "");
        monsterData.errors.push(FigureError.unknown);
      }
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
      this.endTurn(figure)
    } else {
      this.beforeTurn(figure);
      figure.active = !figures.some((other: Figure, otherIndex: number) => otherIndex < index && other.active);
    }

    for (let i = 0; i < figures.length; i++) {

      const otherFigure = figures[ i ];

      if (figure.active) {
        if (i != index) {
          otherFigure.active = false;
        }
        if (i < index) {
          this.endTurn(otherFigure);
        } else if (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0)) {
          this.beforeTurn(otherFigure);
        }
      }
      if (figure.off) {
        if (i < index && !otherFigure.off) {
          otherFigure.active = true;
        } else if (i > index && (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0))) {
          if (!otherFigure.off && i == index + 1) {
            otherFigure.active = true;
          } else {
            otherFigure.active = false;
          }
        }
      }
    }
  }

  permanentDead(figure: Figure): boolean {
    return ((figure instanceof Character || figure instanceof Objective) && (figure.exhausted || figure.health == 0)) || figure instanceof Monster && figure.entities.every((monsterEntity: MonsterEntity) => monsterEntity.dead || monsterEntity.health == 0);
  }

  restoreConditions(entity: Entity) {
    entity.expiredConditions.forEach((condition: Condition) => {
      if (entity.conditions.indexOf(condition) == -1) {
        entity.conditions.push(condition);
      }
      if (entity.turnConditions.indexOf(condition) == -1) {
        entity.turnConditions.push(condition);
      } else {
        entity.turnConditions.splice(entity.turnConditions.indexOf(condition), 1);
      }
    });

    entity.expiredConditions = [];
  }

  beforeTurn(figure: Figure) {
    if (figure.off && !this.permanentDead(figure)) {
      figure.off = false;
      if (settingsManager.settings.expireConditions) {
        if (figure instanceof Character) {
          this.restoreConditions(figure);
          figure.summons.forEach((summon: Summon) => {
            this.restoreConditions(summon);
          });
        } if (figure instanceof Objective) {
          this.restoreConditions(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity: MonsterEntity) => {
            this.restoreConditions(monsterEntity);
          });
        }
      }
    }
  }

  expireConditions(entity: Entity) {
    for (let roundCondition in RoundCondition) {
      if (entity.conditions.indexOf(roundCondition as Condition) != -1 && entity.turnConditions.indexOf(roundCondition as Condition) == -1) {
        entity.turnConditions.push(roundCondition as Condition);
        entity.expiredConditions.push(roundCondition as Condition);
      } else if (entity.turnConditions.indexOf(roundCondition as Condition) != -1) {
        entity.conditions.splice(entity.conditions.indexOf(roundCondition as Condition), 1);
        entity.turnConditions.splice(entity.turnConditions.indexOf(roundCondition as Condition), 1);
        entity.expiredConditions.push(roundCondition as Condition);
      }
    }
  }

  endTurn(figure: Figure) {
    if (!figure.off) {
      figure.off = true;
      figure.active = false;
      if (settingsManager.settings.expireConditions) {
        if (figure instanceof Character) {
          this.expireConditions(figure);
          figure.summons.forEach((summon: Summon) => {
            this.expireConditions(summon);
          });
        } if (figure instanceof Objective) {
          this.expireConditions(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity: MonsterEntity) => {
            this.expireConditions(monsterEntity);
          });
        }
      }

      if (figure instanceof Character) {
        for (let summon of figure.summons) {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        }
      } else if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity: MonsterEntity) => {
          if (monsterEntity.summon == SummonState.new) {
            monsterEntity.summon = SummonState.true;
          }
        })
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
      const editionData: EditionData | undefined = this.editionData.find((value: EditionData) => value.edition == scenario.edition);
      if (!editionData) {
        console.error("Could not find edition data!");
        return;
      }
      this.game.figures = this.game.figures.filter((figure: Figure) => figure instanceof CharacterData);
      this.applyScenarioData(editionData, scenario);
    }
  }

  addSection(section: SectionData) {
    const editionData: EditionData | undefined = this.editionData.find((value: EditionData) => value.edition == section.edition);
    if (!editionData) {
      console.error("Could not find edition data!");
      return;
    }

    if (!this.game.sections.some((value: SectionData) => value.edition == section.edition && value.index == section.index)) {
      this.game.sections.push(section);
      this.applyScenarioData(editionData, section);
    }
  }

  applyScenarioData(editionData: EditionData, scenarioData: ScenarioData) {
    if (scenarioData.monsters) {
      scenarioData.monsters.forEach((name: string) => {
        const monsterData = this.monstersData(true).find((monsterData: MonsterData) => monsterData.name == name && (monsterData.edition == editionData.edition || editionData.extentions && editionData.extentions.indexOf(monsterData.edition) != -1));
        if (monsterData) {
          this.monsterManager.addMonster(monsterData);
        }
      });
    }

    if (scenarioData.objectives) {
      scenarioData.objectives.forEach((objectiveData: ObjectiveData) => {
        this.characterManager.addObjective(objectiveData)
      })
    }
  }

}

export const gameManager: GameManager = new GameManager();
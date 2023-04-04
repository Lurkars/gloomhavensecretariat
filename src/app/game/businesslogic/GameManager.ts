import { Ability } from "../model/data/Ability";
import { Character } from "../model/Character";
import { CharacterData } from "../model/data/CharacterData";
import { DeckData } from "../model/data/DeckData";
import { EditionData, FH_PROSPERITY_STEPS, GH_PROSPERITY_STEPS } from "../model/data/EditionData";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioData } from "../model/data/ScenarioData";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterStat } from "../model/data/MonsterStat";
import { MonsterType } from "../model/data/MonsterType";
import { Objective } from "../model/Objective";
import { AttackModifierManager } from "./AttackModifierManager";
import { CharacterManager } from "./CharacterManager";
import { MonsterManager } from "./MonsterManager";
import { settingsManager } from "./SettingsManager";
import { StateManager } from "./StateManager";
import { Condition, Conditions, ConditionType } from "../model/Condition";
import { EntityManager } from "./EntityManager";
import { EventEmitter } from "@angular/core";
import { ItemData } from "../model/data/ItemData";
import { LevelManager } from "./LevelManager";
import { ScenarioManager } from "./ScenarioManager";
import { RoundManager } from "./RoundManager";
import { Entity, EntityCounter } from "../model/Entity";
import { MonsterEntity } from "../model/MonsterEntity";
import { Summon } from "../model/Summon";
import { LootManager } from "./LootManager";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";


export class GameManager {

  game: Game = new Game();
  editionData: EditionData[] = [];
  stateManager: StateManager;
  entityManager: EntityManager;
  characterManager: CharacterManager;
  monsterManager: MonsterManager;
  attackModifierManager: AttackModifierManager;
  levelManager: LevelManager;
  scenarioManager: ScenarioManager;
  roundManager: RoundManager;
  lootManager: LootManager;

  uiChange = new EventEmitter<boolean>();

  constructor() {
    this.stateManager = new StateManager(this.game);
    this.entityManager = new EntityManager(this.game);
    this.characterManager = new CharacterManager(this.game);
    this.monsterManager = new MonsterManager(this.game);
    this.attackModifierManager = new AttackModifierManager(this.game);
    this.levelManager = new LevelManager(this.game);
    this.scenarioManager = new ScenarioManager(this.game);
    this.roundManager = new RoundManager(this.game);
    this.lootManager = new LootManager(this.game);
    this.uiChange.subscribe({
      next: () => {
        this.checkEntitiesKilled();
        if (this.game.levelCalculation) {
          this.levelManager.calculateScenarioLevel();
        }
        if (settingsManager.settings.scenarioRules) {
          if (this.game.round > 0) {
            this.scenarioManager.addScenarioRulesAlways();
          };
        }
      }
    })
  }

  editions(all: boolean = false, additional: boolean = false): string[] {
    return this.editionData.filter((editionData) => (all || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (additional || !editionData.additional)).map((editionData) => editionData.edition);
  }

  currentEditions(additional: boolean = false): string[] {
    if (!this.game.edition) {
      return this.editions(false, additional);
    }

    return [this.game.edition, ...this.editionExtensions(this.game.edition)];
  }

  currentEdition(fallback: string | undefined = undefined): string {
    if (this.game.edition) {
      return this.game.edition;
    }

    if (this.game.scenario) {
      return this.game.scenario.edition;
    }

    const charEditions = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure.edition);

    if (charEditions.length > 0 && charEditions.every((edition, index, self) => index == 0 || self[index - 1] == edition)) {
      return charEditions[0];
    }

    return fallback || this.editions()[0];
  }

  editionExtensions(edition: string, all: boolean = false): string[] {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    let extensions: string[] = [];
    if (editionData && editionData.extensions) {
      editionData.extensions.forEach((extension) => {
        if (extensions.indexOf(extension) == -1 && this.editions(all, true).indexOf(extension) != -1) {
          extensions.push(extension);
        }
        this.editionExtensions(extension).forEach((extExt) => {
          if (extensions.indexOf(extExt) == -1 && this.editions(all, true).indexOf(extension) != -1) {
            extensions.push(extExt);
          }
        })
      })
    }

    return extensions;
  }

  newAmStyle(edition: string): boolean {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && (editionData.newAmStyle || editionData.extensions && editionData.extensions.some((edition) => this.newAmStyle(edition)))) {
      return true;
    }

    return false;
  }

  charactersData(edition: string | undefined = undefined): CharacterData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.characters).flat().filter((characterData, index, characters) => (!edition || characterData.edition == edition) && (characterData.replace || !characterData.replace && !characters.find((characterDataReplacement) => characterDataReplacement.replace && characterDataReplacement.name == characterData.name && characterDataReplacement.edition == characterData.edition)));
  }

  monstersData(edition: string | undefined = undefined): MonsterData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.monsters).flat().filter((monsterData, index, monsters) => monsterData.replace || !monsterData.replace && !monsters.find((monsterDataReplacement) => monsterDataReplacement.replace && monsterDataReplacement.name == monsterData.name && monsterDataReplacement.edition == monsterData.edition));
  }

  decksData(edition: string | undefined = undefined): DeckData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.decks).flat();
  }

  scenarioData(edition: string | undefined = undefined): ScenarioData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.scenarios).flat();
  }

  sectionData(edition: string | undefined = undefined): ScenarioData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.sections).flat();
  }

  itemData(edition: string | undefined = undefined, all: boolean = false): ItemData[] {
    const prosperityLevel = this.prosperityLevel();
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.items).flat().filter((itemData) => {
      if (all || !this.game.party.campaignMode || edition == 'fh') {
        return true;
      }

      if (this.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition)) {
        return true;
      }

      if (itemData.unlockProsperity > 0 && itemData.unlockProsperity <= prosperityLevel) {
        return true;
      }

      if (itemData.unlockScenario && this.scenarioData(edition).find((scenarioData) => itemData.unlockScenario && scenarioData.index == itemData.unlockScenario.name && scenarioData.edition == itemData.unlockScenario.edition)) {
        return true;
      }

      if (itemData.requiredBuilding && this.game.party.buildings.find((buildingModel) => buildingModel.name == itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel)) {
        return true;
      }

      return false;

    });
  }

  item(id: number, edition: string, all: boolean): ItemData | undefined {
    let item = this.itemData(edition, all).find((itemData) => itemData && itemData.id == id && itemData.edition == edition);
    if (!item) {
      item = this.itemData(undefined, all).find((itemData) => itemData && itemData.id == id && this.editionExtensions(edition).indexOf(itemData.edition) != -1);
    }
    return item;
  }

  maxItemIndex(edition: string): number {
    return Math.max(...this.itemData(edition).map((itemData) => itemData.id));
  }

  conditions(edition: string | undefined = undefined): Condition[] {
    if (!edition) {
      return Conditions;
    }

    return this.editionData.filter((editionData) => (editionData.edition == edition || this.editionExtensions(edition).indexOf(editionData.edition) != -1) && editionData.conditions && editionData.conditions.length > 0).map((other) => other.conditions).flat().filter((value, index, self) => self.indexOf(value) == index).map((value) => {
      if (value.split(':').length > 1) {
        return new Condition(value.split(':')[0], + value.split(':')[1]);
      } else {
        return new Condition(value);
      }
    })
  }

  objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier: ScenarioObjectiveIdentifier): ObjectiveData | undefined {
    const scenarioData = (objectiveIdentifier.section ? this.sectionData(objectiveIdentifier.edition).find((sectionData) => sectionData.index == objectiveIdentifier.scenario && sectionData.group == objectiveIdentifier.group) : this.scenarioData(objectiveIdentifier.edition).find((scenarioData) => scenarioData.index == objectiveIdentifier.scenario && scenarioData.group == objectiveIdentifier.group));
    if (scenarioData) {
      if (objectiveIdentifier.section && !scenarioData.objectives) {
        const parent = this.scenarioData(objectiveIdentifier.edition).find((scenario) => scenario.index == scenarioData.parent && scenario.group == scenarioData.group);
        if (parent && parent.objectives && parent.objectives.length > objectiveIdentifier.index) {
          return parent.objectives[objectiveIdentifier.index];
        }
      } else if (scenarioData.objectives.length > objectiveIdentifier.index) {
        return scenarioData.objectives[objectiveIdentifier.index];
      }
    }

    return undefined;
  }

  conditionsForTypes(...types: string[]): Condition[] {
    return this.conditions(this.game.edition).filter((condition) => types.every((type) => condition.types.indexOf(type as ConditionType) != -1));
  }

  allConditionsForTypes(...types: string[]): Condition[] {
    return this.conditions().filter((condition) => types.every((type) => condition.types.indexOf(type as ConditionType) != -1));
  }

  markers(): string[] {
    return this.game.figures.filter((figure) => figure instanceof Character && !figure.absent && (figure.marker || this.game.state == GameState.next && figure.active)).map((figure) => figure as Character).sort((a, b) => {
      if (a.marker && !b.marker) {
        return -1;
      } else if (!a.marker && b.marker) {
        return 1;
      }

      return 0;
    }).map((figure) => (figure as Character).edition + '-' + figure.name);
  }

  sortFigures() {
    this.game.figures.sort((a, b) => {
      if (settingsManager.settings.disableSortFigures) {
        return 0;
      }

      if (this.game.state == GameState.draw) {
        return this.sortFiguresByTypeAndName(a, b);
      } else if (settingsManager.settings.initiativeRequired || a.getInitiative() > 0 && b.getInitiative() > 0) {
        if (a.getInitiative() == b.getInitiative()) {
          return this.sortFiguresByTypeAndName(a, b);
        }
        return a.getInitiative() - b.getInitiative();
      } else if (a.getInitiative() > 0) {
        return 1;
      } else if (b.getInitiative() > 0) {
        return -1;
      }

      return this.sortFiguresByTypeAndName(a, b);
    });
  }

  sortFiguresByTypeAndName(a: Figure, b: Figure): number {
    if (a.off && !b.off) {
      return 1;
    } else if (!a.off && b.off) {
      return -1;
    }

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
    } else if (a instanceof Character && b instanceof Objective) {
      return -1;
    } else if (a instanceof Objective && b instanceof Character) {
      return 1;
    } else if (a instanceof Monster && b instanceof Objective) {
      return -1;
    } else if (a instanceof Objective && b instanceof Monster) {
      return 1;
    } else if (a instanceof Monster && b instanceof Monster) {
      return 0;
    } else if (a instanceof Objective && b instanceof Objective && a.name == b.name) {
      return a.id - b.id;
    }

    return aName < bName ? -1 : 1;
  }

  deckData(figure: Monster | Character): DeckData {
    let deckData = this.decksData(figure.edition).find((deck) => (deck.name == figure.deck || deck.name == figure.name));

    // find extensions decks
    if (!deckData) {
      deckData = this.decksData().find((deck) => (deck.name == figure.deck || deck.name == figure.name) && this.editionExtensions(figure.edition).indexOf(deck.edition) != -1);
    }

    // find other
    if (!deckData) {
      deckData = this.decksData().find((deck) => (deck.name == figure.deck || deck.name == figure.name) && deck.edition == figure.edition);
    }

    if (!deckData) {
      figure.errors = figure.errors || [];
      if (!figure.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !figure.errors.find((figureError) => figureError.type == FigureErrorType.deck)) {
        console.error("Unknwon deck: " + figure.name + (figure.deck ? "[" + figure.deck + "]" : "") + " for " + figure.edition);
        figure.errors.push(new FigureError(FigureErrorType.deck, figure instanceof Character ? "character" : "monster", figure.name, figure.edition, figure.deck));
      }
      return new DeckData('', [], '');
    }

    return deckData;
  }

  abilities(figure: Monster | Character): Ability[] {
    return this.deckData(figure).abilities || [];
  }

  hasBottomAbility(ability: Ability | undefined): boolean {
    return ability && ability.bottomActions && ability.bottomActions.length > 0 || false;
  }

  getCharacterData(name: string, edition: string = ''): CharacterData {
    let characterData = this.charactersData().find((value) => value.name == name && (!edition || value.edition == edition));
    if (!characterData) {
      characterData = this.charactersData().find((value) => value.name == name);
      if (!characterData) {
        characterData = new CharacterData();
        characterData.name = name;
        characterData.edition = edition;
        characterData.errors = characterData.errors || [];
        if (!characterData.errors.find((figureError) => figureError.type == FigureErrorType.unknown)) {
          console.error("unknown character '" + name + "' for edition '" + edition + "'");
          characterData.errors.push(new FigureError(FigureErrorType.unknown, "character", name, edition));
        }
      }
      return characterData;
    }
    return characterData;
  }

  isCharacter(figure: Figure | Entity): boolean {
    return figure instanceof Character;
  }

  isObjective(figure: Figure | Entity): boolean {
    return figure instanceof Objective;
  }

  isMonster(figure: Figure): boolean {
    return figure instanceof Monster;
  }

  isMonsterEntity(entity: Entity): boolean {
    return entity instanceof MonsterEntity;
  }

  isSummon(entity: Entity): boolean {
    return entity instanceof Summon;
  }

  toCharacter(figure: Figure | Entity): Character {
    return figure as Character;
  }

  toObjective(figure: Figure | Entity): Objective {
    return figure as Objective;
  }

  toMonster(figure: Figure): Monster {
    return figure as Monster;
  }

  toMonsterEntity(entity: Entity): MonsterEntity {
    return entity as MonsterEntity;
  }

  toSummon(entity: Entity): Summon {
    return entity as Summon;
  }

  getEdition(figure: any): string {
    if (this.game.figures.some((value) => typeof (figure) == typeof (value) && figure.name == value.name && figure.edition != value.edition || this.game.edition && figure.edition != this.game.edition && this.editionExtensions(this.game.edition).indexOf(figure.edition) == -1)) {
      return figure.edition;
    }
    return "";
  }

  gameplayFigure(figure: Figure) {
    return figure instanceof Monster && this.entityManager.entities(figure).length > 0 || figure instanceof Character && gameManager.entityManager.isAlive(figure) || figure instanceof Objective && gameManager.entityManager.isAlive(figure);
  }

  figuresByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean = false): Figure[] {
    if (identifier && identifier.type) {
      const type = identifier.type;
      if (type == "all") {
        return scenarioEffect ? this.game.figures.filter((figure) => {
          if (!(figure instanceof Character)) {
            return true
          } else {
            return !this.characterManager.ignoreNegativeScenarioffects(figure);
          }
        }) : this.game.figures;
      }
      if (identifier.name) {
        const edition = identifier.edition;
        const name = new RegExp('^' + identifier.name + '$');
        switch (type) {
          case "monster":
            return this.game.figures.filter((figure) => figure instanceof Monster && (!edition || figure.edition == edition) && figure.name.match(name) && (!identifier.marker || figure.entities.some((entity) => entity.marker == identifier.marker)) && (!identifier.tags || identifier.tags.length == 0 || figure.entities.some((entity) => identifier.tags && identifier.tags.every((tag) => entity.tags.indexOf(tag) != -1))));
          case "character":
            return this.game.figures.filter((figure) => {
              if (figure instanceof Character && (!edition || figure.edition == edition) && figure.name.match(name) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags && identifier.tags.every((tag) => figure.tags && figure.tags.indexOf(tag) != -1))) {
                if (scenarioEffect) {
                  return !this.characterManager.ignoreNegativeScenarioffects(figure);
                } else {
                  return true;
                }
              } else {
                return false;
              }
            });
          case "objective":
            return this.game.figures.filter((figure) => figure instanceof Objective && figure.name.match(name) && (edition != "escort" || figure.escort) && (!identifier.marker || figure.marker == identifier.marker) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => figure.tags && figure.tags.indexOf(tag) != -1)));
        }
      }
    }

    return [];
  }

  entitiesByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean): Entity[] {
    let figures = this.figuresByIdentifier(identifier, scenarioEffect);
    return figures.map((figure) => {
      if (figure instanceof Monster) {
        return figure.entities;
      } else if (figure instanceof Character || figure instanceof Objective) {
        return figure as Entity;
      } else {
        return undefined;
      }
    }).flat().filter((value) => value != undefined).map((value) => value as Entity);
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData().find((value) => value.name == name && value.edition == edition);
    if (!monsterData) {
      monsterData = this.monstersData().find((value) => value.name == name);
      if (!monsterData) {
        monsterData = new MonsterData(name, 0, undefined, undefined, undefined, new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0), [], "");
        monsterData.errors = monsterData.errors || [];
        monsterData.name = name;
        monsterData.edition = edition;
        if (!monsterData.errors.find((figureError) => figureError.type == FigureErrorType.unknown)) {
          console.error("unknown monster '" + name + "' for edition '" + edition + "'");
          monsterData.errors.push(new FigureError(FigureErrorType.unknown, "monster", name, edition));
        }
      }
      return monsterData;
    }

    return monsterData;
  }

  prosperityLevel(): number {
    let prosperityLevel = 1;
    const prosperitySteps = this.fhRules() ? FH_PROSPERITY_STEPS : GH_PROSPERITY_STEPS;
    prosperitySteps.forEach((step) => {
      if (this.game.party.prosperity >= step) {
        prosperityLevel++;
      }
    })
    return prosperityLevel;
  }

  fhRules(): boolean {
    return this.editionRules('fh');
  }

  editionRules(edition: string): boolean {
    return this.currentEdition() == edition || this.editionExtensions(this.currentEdition()).indexOf(edition) != -1;
  }

  additionalIdentifier(figure: Figure, entity: Entity | undefined = undefined): AdditionalIdentifier {
    if (figure instanceof Character) {
      return new AdditionalIdentifier("character", figure.name, figure.edition, undefined, figure.tags);
    } else if (figure instanceof Objective) {
      return new AdditionalIdentifier("objective", figure.name, figure.escort ? "escort" : "objective", figure.marker, figure.tags);
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      return new AdditionalIdentifier("monster", figure.name, figure.edition, entity.marker, entity.tags);
    }

    return new AdditionalIdentifier(undefined, figure.name, figure.edition, undefined, entity && entity.tags || []);
  }

  entityCounter(identifier: AdditionalIdentifier): EntityCounter | undefined {
    return this.game.entitiesCounter.find((entityCounter) => identifier.type == entityCounter.identifier.type && identifier.name == entityCounter.identifier.name && identifier.edition == entityCounter.identifier.edition && (!identifier.marker || identifier.marker == entityCounter.identifier.marker) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => entityCounter.identifier.tags && entityCounter.identifier.tags.indexOf(tag) != -1)));
  }

  addEntityCount(figure: Figure, entity: Entity | undefined = undefined) {

    const identifier = this.additionalIdentifier(figure, entity);
    let counter = this.entityCounter(identifier);

    if (!counter) {
      counter = { identifier: identifier, total: 0, killed: 0 };
      this.game.entitiesCounter.push(counter);
    }

    counter.total++;
  }

  checkEntitiesKilled() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character || figure instanceof Objective) {
        if (!this.entityCounter(this.additionalIdentifier(figure))) {
          this.addEntityCount(figure);
        }
      } else if (figure instanceof Monster) {
        figure.entities.forEach((entity) => {
          if (this.entityManager.isAlive(entity) && !this.entityCounter(this.additionalIdentifier(figure, entity))) {
            this.addEntityCount(figure, entity);
          }

        })
      }
    })

    this.game.entitiesCounter.forEach((entityCounter) => {
      let figures = this.figuresByIdentifier(entityCounter.identifier);
      if (figures.length == 0 && entityCounter.total > entityCounter.killed) {
        entityCounter.killed = entityCounter.total;
      } else {
        if (figures.every((figure) => figure instanceof Character || figure instanceof Objective)) {
          figures = figures.filter((figure) => (figure instanceof Character || figure instanceof Objective) && this.entityManager.isAlive(figure));
          if (figures.length + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - figures.length
          } else if (figures.length + entityCounter.killed > entityCounter.total) {
            console.warn("More killed then figures counted", entityCounter.identifier, figures.length, entityCounter.killed, entityCounter.total);
            entityCounter.total = figures.length + entityCounter.killed;
          }
        } else if (figures.every((figure) => figure instanceof Monster)) {
          const count = figures.map((figure) => this.monsterManager.monsterEntityCountIdentifier(figure as Monster, entityCounter.identifier)).reduce((a, b) => a + b);
          if (count + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - count
          } else if (count + entityCounter.killed > entityCounter.total) {
            console.warn("More killed then figures counted", entityCounter.identifier, count, entityCounter.killed, entityCounter.total);
            entityCounter.total = count + entityCounter.killed;
          }
        }
      }
    })
  }

}

export const gameManager: GameManager = new GameManager();

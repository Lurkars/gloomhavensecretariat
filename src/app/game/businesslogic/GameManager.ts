import { Ability } from "../model/Ability";
import { Character } from "../model/Character";
import { CharacterData } from "../model/data/CharacterData";
import { DeckData } from "../model/data/DeckData";
import { EditionData } from "../model/data/EditionData";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioData } from "../model/data/ScenarioData";
import { FigureError, FigureErrorType } from "../model/FigureError";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterStat } from "../model/MonsterStat";
import { MonsterType } from "../model/MonsterType";
import { Objective } from "../model/Objective";
import { AttackModifierManager } from "./AttackModifierManager";
import { CharacterManager } from "./CharacterManager";
import { MonsterManager } from "./MonsterManager";
import { settingsManager } from "./SettingsManager";
import { StateManager } from "./StateManager";
import { Condition, ConditionName, Conditions, ConditionType } from "../model/Condition";
import { EntityManager } from "./EntityManager";
import { EventEmitter } from "@angular/core";
import { ItemData } from "../model/data/ItemData";
import { LevelManager } from "./LevelManager";
import { ScenarioManager } from "./ScenarioManager";
import { RoundManager } from "./RoundManager";
import { Entity, EntityValueFunction } from "../model/Entity";
import { MonsterEntity } from "../model/MonsterEntity";
import { Summon } from "../model/Summon";
import { LootManager } from "./LootManager";
import { FigureIdentifier } from "../model/data/ScenarioRule";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";


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

  uiChange = new EventEmitter();

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

  editions(all: boolean = false): string[] {
    return this.editionData.map((editionData) => editionData.edition).filter((edition) => all || settingsManager.settings.editions.indexOf(edition) != -1);
  }

  currentEditions(): string[] {
    if (!this.game.edition) {
      return this.editions();
    }

    return [this.game.edition, ...this.editionExtensions(this.game.edition)];
  }

  currentEdition(): string {
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

    return this.editions()[0];
  }

  editionExtensions(edition: string): string[] {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    return editionData && editionData.extensions || [];
  }

  newAmStyle(edition: string): boolean {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && (editionData.newAmStyle || editionData.extensions && editionData.extensions.some((edition) => this.newAmStyle(edition)))) {
      return true;
    }

    return false;
  }

  charactersData(edition: string | undefined = undefined): CharacterData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.characters).flat().filter((characterData, index, characters) => characterData.replace || !characterData.replace && !characters.find((characterDataReplacement) => characterDataReplacement.replace && characterDataReplacement.name == characterData.name && characterDataReplacement.edition == characterData.edition));;
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

  itemData(edition: string | undefined = undefined): ItemData[] {
    return this.editionData.filter((editionData) => !edition || editionData.edition == edition || this.editionExtensions(edition).indexOf(edition) != -1).map((editionData) => editionData.items).flat();
  }

  item(id: number, edition: string): ItemData | undefined {
    return this.itemData().find((itemData) => itemData && itemData.id == id && (itemData.edition == edition || this.editionExtensions(edition).indexOf(itemData.edition) != -1));
  }

  maxItemIndex(edition: string): number {
    return Math.max(...this.itemData().filter((itemData) => itemData.edition == edition || this.editionExtensions(edition).indexOf(itemData.edition) != -1).map((itemData) => itemData.id));
  }

  conditions(edition: string | undefined = undefined): Condition[] {
    if (!edition) {
      return Conditions;
    }

    return this.editionData.filter((editionData) => (editionData.edition == edition || this.editionExtensions(edition).indexOf(editionData.edition) != -1) && editionData.conditions && editionData.conditions.length > 0).map((other) => other.conditions).flat().filter((value, index, self) => self.indexOf(value) == index).map((value) => {
      if (value.split(':').length > 1) {
        return new Condition(value.split(':')[0] as ConditionName, + value.split(':')[1]);
      } else {
        return new Condition(value as ConditionName);
      }
    })
  }

  objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier: ScenarioObjectiveIdentifier): ObjectiveData | undefined {
    const scenarioData = (objectiveIdentifier.section ? this.sectionData(objectiveIdentifier.edition).find((sectionData) => sectionData.index == objectiveIdentifier.scenario && sectionData.group == objectiveIdentifier.group) : this.scenarioData(objectiveIdentifier.edition).find((scenarioData) => scenarioData.index == objectiveIdentifier.scenario && scenarioData.group == objectiveIdentifier.group));

    if (scenarioData && scenarioData.objectives.length > objectiveIdentifier.index) {
      return scenarioData.objectives[objectiveIdentifier.index];
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
    return this.game.figures.filter((figure) => figure instanceof Character && (figure.marker || this.game.state == GameState.next && figure.active)).map((figure) => figure as Character).sort((a, b) => {
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
      if (this.game.state == GameState.draw) {
        return this.sortFiguresByTypeAndName(a, b);
      } else if (settingsManager.settings.initiativeRequired) {
        if (a.getInitiative() == b.getInitiative()) {
          return this.sortFiguresByTypeAndName(a, b);
        }
        return a.getInitiative() - b.getInitiative();
      }

      return 0;
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
    if (this.game.figures.some((value) => typeof (figure) == typeof (value) && figure.name == value.name && figure.edition != value.edition || this.game.edition && figure.edition != this.game.edition)) {
      return figure.edition;
    }
    return "";
  }

  gameplayFigure(figure: Figure) {
    return figure instanceof Monster && figure.entities.length > 0 && figure.entities.some((entity) => !entity.dead && entity.health > 0) || figure instanceof Character && !figure.absent && !figure.exhausted && (figure.health > 0 || EntityValueFunction(figure.maxHealth) == 0) || figure instanceof Objective && !figure.exhausted && (figure.health > 0 || EntityValueFunction(figure.maxHealth) == 0);
  }

  figuresByIdentifier(identifier: FigureIdentifier, scenarioEffect: boolean): Figure[] {
    if (identifier && identifier.type) {
      const type = identifier.type;
      if (type == "all") {
        return scenarioEffect ? this.game.figures.filter((figure) => {
          if (!(figure instanceof Character)) {
            return true
          }
          const perk = figure.perks.find((perk) => perk.custom == '%game.custom.perks.ignoreNegativeScenario%');
          if (!perk) {
            return true;
          } else {
            const perkIndex = figure.perks.indexOf(perk);
            return !figure.progress.perks[perkIndex] || perk.combined ? (figure.progress.perks[perkIndex] != perk.count) : figure.progress.perks[perkIndex] < 1;
          }
        }) : this.game.figures;
      }
      if (identifier.edition && identifier.name) {
        const edition = identifier.edition;
        const name = new RegExp('^' + identifier.name + '$');
        const marker = identifier.marker;
        switch (type) {
          case "monster":
            return this.game.figures.filter((figure) => figure instanceof Monster && figure.edition == edition && figure.name.match(name) && (!identifier.marker || figure.entities.some((entity) => entity.marker == identifier.marker)));
          case "character":
            return this.game.figures.filter((figure) => {
              if (figure instanceof Character && figure.edition == edition && figure.name.match(name)) {
                if (scenarioEffect) {
                  const perk = figure.perks.find((perk) => perk.custom == '%game.custom.perks.ignoreNegativeScenario%');
                  if (!perk) {
                    return true;
                  } else {
                    const perkIndex = figure.perks.indexOf(perk);
                    return !figure.progress.perks[perkIndex] || perk.combined ? (figure.progress.perks[perkIndex] != perk.count) : figure.progress.perks[perkIndex] < 1;
                  }
                } else {
                  return true;
                }
              } else {
                return false;
              }
            });
          case "objective":
            return this.game.figures.filter((figure) => figure instanceof Objective && figure.name.match(name) && (edition != "escort" || figure.escort) && (!marker || figure.marker == marker));
        }
      }
    }

    return [];
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData().find((value) => value.name == name && value.edition == edition);
    if (!monsterData) {
      monsterData = this.monstersData().find((value) => value.name == name);
      if (!monsterData) {
        monsterData = new MonsterData(name, 0, new MonsterStat(MonsterType.normal, 0, 0, 0, 0, 0), [], "");
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

  fhRules(): boolean {
    return this.game.edition && (this.game.edition == 'fh' || gameManager.editionExtensions(this.game.edition).indexOf('fh') != -1) || this.game.scenario && (this.game.scenario.edition == 'fh' || gameManager.editionExtensions(this.game.scenario.edition).indexOf('fh') != -1) || this.game.lootDeck.cards.length > 0 || false;
  }

}

export const gameManager: GameManager = new GameManager();

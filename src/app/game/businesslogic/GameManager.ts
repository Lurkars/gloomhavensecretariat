import { EventEmitter } from "@angular/core";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { Entity, EntityCounter } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameClockTimestamp, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { Party } from "../model/Party";
import { Summon } from "../model/Summon";
import { Ability } from "../model/data/Ability";
import { Action, ActionType } from "../model/data/Action";
import { ChallengeCard } from "../model/data/Challenges";
import { CharacterData } from "../model/data/CharacterData";
import { Condition, ConditionName, ConditionType, Conditions } from "../model/data/Condition";
import { DeckData } from "../model/data/DeckData";
import { CampaignData, EditionData, FH_PROSPERITY_STEPS, GH_PROSPERITY_STEPS } from "../model/data/EditionData";
import { ElementModel, ElementState } from "../model/data/Element";
import { ItemData } from "../model/data/ItemData";
import { MonsterData } from "../model/data/MonsterData";
import { MonsterStat } from "../model/data/MonsterStat";
import { ScenarioData } from "../model/data/ScenarioData";
import { ActionsManager } from "./ActionsManager";
import { AttackModifierManager } from "./AttackModifierManager";
import { BattleGoalManager } from "./BattleGoalManager";
import { BuildingsManager } from "./BuildingsManager";
import { ChallengesManager } from "./ChallengesManager";
import { CharacterManager } from "./CharacterManager";
import { EntityManager } from "./EntityManager";
import { EventCardManager } from "./EventCardManager";
import { ItemManager } from "./ItemManager";
import { LevelManager } from "./LevelManager";
import { LootManager } from "./LootManager";
import { MonsterManager } from "./MonsterManager";
import { ObjectiveManager } from "./ObjectiveManager";
import { RoundManager } from "./RoundManager";
import { ScenarioManager } from "./ScenarioManager";
import { ScenarioRulesManager } from "./ScenarioRulesManager";
import { ScenarioStatsManager } from "./ScenarioStatsManager";
import { settingsManager } from "./SettingsManager";
import { StateManager } from "./StateManager";
import { TrialsManager } from "./TrialsManager";

declare global {
  interface Window { gameManager: GameManager }
}

export class GameManager {

  game: Game = new Game();
  editionData: EditionData[] = [];
  editionMapping: Record<string, string[]> = {};
  editionMappingAll: Record<string, string[]> = {};
  editionScenarioMapping: Record<string, string[]> = {};
  editionScenarioMappingAll: Record<string, string[]> = {};
  stateManager: StateManager;
  entityManager: EntityManager;
  characterManager: CharacterManager;
  monsterManager: MonsterManager;
  objectiveManager: ObjectiveManager;
  attackModifierManager: AttackModifierManager;
  actionsManager: ActionsManager;
  levelManager: LevelManager;
  scenarioManager: ScenarioManager;
  scenarioRulesManager: ScenarioRulesManager;
  roundManager: RoundManager;
  lootManager: LootManager;
  itemManager: ItemManager;
  battleGoalManager: BattleGoalManager;
  eventCardManager: EventCardManager;
  buildingsManager: BuildingsManager;
  challengesManager: ChallengesManager;
  scenarioStatsManager: ScenarioStatsManager;
  trialsManager: TrialsManager;

  uiChange = new EventEmitter<boolean>();

  constructor() {
    this.stateManager = new StateManager(this.game);
    this.entityManager = new EntityManager(this.game);
    this.characterManager = new CharacterManager(this.game);
    this.monsterManager = new MonsterManager(this.game);
    this.objectiveManager = new ObjectiveManager(this.game);
    this.attackModifierManager = new AttackModifierManager(this.game);
    this.actionsManager = new ActionsManager();
    this.levelManager = new LevelManager(this.game);
    this.scenarioManager = new ScenarioManager(this.game);
    this.scenarioRulesManager = new ScenarioRulesManager(this.game);
    this.roundManager = new RoundManager(this.game);
    this.itemManager = new ItemManager(this.game);
    this.lootManager = new LootManager(this.game);
    this.battleGoalManager = new BattleGoalManager(this.game);
    this.eventCardManager = new EventCardManager(this.game);
    this.buildingsManager = new BuildingsManager(this.game);
    this.challengesManager = new ChallengesManager(this.game);
    this.scenarioStatsManager = new ScenarioStatsManager(this.game);
    this.trialsManager = new TrialsManager(this.game);
    this.uiChange.subscribe({
      next: () => {
        this.checkEntitiesKilled();
        if (this.game.levelCalculation) {
          this.levelManager.calculateScenarioLevel();
        }
        if (settingsManager.settings.scenarioRules) {
          this.scenarioRulesManager.addScenarioRulesAlways();
          this.scenarioRulesManager.applyScenarioRulesAlways();
        }
        this.roundManager.firstRound = this.game.round == 0 && this.game.roundResets.length == 0 && this.game.roundResetsHidden.length == 0;
        this.buildingsManager.update();
        this.challengesManager.update();
        this.trialsManager.update();
      }
    })
  }

  editions(all: boolean = false, additional: boolean = false): string[] {
    return this.editionData.filter((editionData) => (all || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (additional || !editionData.additional)).map((editionData) => editionData.edition);
  }

  editionsData(all: boolean = false, additional: boolean = false): EditionData[] {
    const editions: string[] = this.editions(all, additional);
    return this.editionData.filter((editionData) => editions.indexOf(editionData.edition) != -1);
  }

  editionLogo(edition: string): string {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && editionData.logoUrl) {
      return editionData.logoUrl;
    }
    return "";
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

    if (this.game.scenario && this.game.scenario.edition) {
      return this.game.scenario.edition;
    }

    const charEditions = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure.edition);

    if (charEditions.length > 0 && charEditions.every((edition, index, self) => index == 0 || self[index - 1] == edition)) {
      return charEditions[0];
    }

    return fallback != undefined ? fallback : this.editions()[0];
  }

  editionExtensions(edition: string, all: boolean = false): string[] {

    if (all && this.editionMappingAll[edition]) {
      return this.editionMappingAll[edition];
    } else if (!all && this.editionMapping[edition]) {
      return this.editionMapping[edition];
    }

    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    let extensions: string[] = [];
    if (editionData && editionData.extensions) {
      editionData.extensions.forEach((extension) => {
        if (extensions.indexOf(extension) == -1 && this.editions(all, true).indexOf(extension) != -1) {
          extensions.push(extension);
        }
        this.editionExtensions(extension, all).forEach((extExt) => {
          if (extensions.indexOf(extExt) == -1 && this.editions(all, true).indexOf(extension) != -1) {
            extensions.push(extExt);
          }
        })
      })
    }

    if (all) {
      this.editionMappingAll[edition] = extensions;
    } else {
      this.editionMapping[edition] = extensions;
    }

    return extensions;
  }

  editionScenarioExtensions(edition: string, all: boolean = false): string[] {

    if (all && this.editionScenarioMappingAll[edition]) {
      return this.editionScenarioMappingAll[edition];
    } else if (!all && this.editionScenarioMapping[edition]) {
      return this.editionScenarioMapping[edition];
    }

    const extensions = this.editionData.filter((additional) => (all || settingsManager.settings.editions.indexOf(additional.edition) != -1) && additional.additional && additional.scenarios && additional.scenarios.length && additional.scenarios.some((scenarioData) => scenarioData.edition == additional.edition) && additional.extensions.indexOf(edition) != -1).map((additional) => additional.edition);

    if (all) {
      this.editionScenarioMappingAll[edition] = extensions;
    } else {
      this.editionScenarioMapping[edition] = extensions;
    }

    return extensions;
  }

  resetEditionMapping() {
    this.editionMapping = {};
    this.editionMappingAll = {};
    this.editionScenarioMapping = {};
    this.editionScenarioMappingAll = {};
  }

  newAmStyle(edition: string): boolean {
    const editionData = this.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && (editionData.newAmStyle || editionData.extensions && editionData.extensions.some((edition) => this.newAmStyle(edition)))) {
      return true;
    }

    return false;
  }

  charactersData(edition: string | undefined = undefined): CharacterData[] {
    const characters = this.editionData.filter((editionData) => (!edition || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition).indexOf(edition) != -1)).flatMap((editionData) => editionData.characters);

    const merges = characters.filter((characterData) => characterData.merge);

    return characters.filter((characterData) => (!edition || characterData.edition == edition) && !characterData.merge && (characterData.replace || !characterData.replace && !characters.find((characterDataReplacement) => characterDataReplacement.replace && characterDataReplacement.name === characterData.name && characterDataReplacement.edition === characterData.edition))).map((characterData) => {
      const merge = merges.find((characterDataMerge) => characterDataMerge.name === characterData.name && characterDataMerge.edition === characterData.edition);
      if (merge) {
        return Object.assign(new CharacterData(characterData), merge);
      }

      return new CharacterData(characterData);
    });
  }

  monstersData(edition: string | undefined = undefined): MonsterData[] {
    return this.editionData.filter((editionData) => (!edition || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition).indexOf(edition) != -1)).flatMap((editionData) => editionData.monsters).filter((monsterData, index, monsters) => (!edition || monsterData.edition == edition) && (monsterData.replace || !monsterData.replace && !monsters.find((monsterDataReplacement) => monsterDataReplacement.replace && monsterDataReplacement.name == monsterData.name && monsterDataReplacement.edition == monsterData.edition)));
  }

  decksData(edition: string | undefined = undefined): DeckData[] {
    return this.editionData.filter((editionData) => (!edition || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition).indexOf(edition) != -1)).flatMap((editionData) => editionData.decks).filter((deckData) => !edition || deckData.edition == edition);;
  }

  scenarioData(edition: string | undefined = undefined): ScenarioData[] {
    return this.editionData.filter((editionData) => (!edition || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition).indexOf(edition) != -1)).flatMap((editionData) => editionData.scenarios).filter((scenarioData) => !edition || scenarioData.edition == edition);
  }

  sectionData(edition: string | undefined = undefined, extension: boolean = false): ScenarioData[] {
    return this.editionData.filter((editionData) => (!edition || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || editionData.additional && this.editionExtensions(editionData.edition).indexOf(edition) != -1 || extension && this.editionExtensions(edition).indexOf(editionData.edition) != -1)).flatMap((editionData) => editionData.sections).filter((sectionData) => !edition || sectionData.edition == edition || extension).map((sectionData) => {
      if (!settingsManager.settings.fhSecondEdition || sectionData.edition != 'fh') {
        return sectionData;
      } else if (sectionData.index == '6.2') {
        let section = new ScenarioData(sectionData);
        section.index = "60.2";
        return section;
      } else if (sectionData.index == '60.2') {
        let section = new ScenarioData(sectionData);
        section.index = "6.2";
        return section;
      }
      return sectionData;
    });
  }

  itemData(edition: string | undefined = undefined, all: boolean = false): ItemData[] {
    return this.editionData.filter((editionData) => (all || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition, true).indexOf(edition) != -1)).flatMap((editionData) => editionData.items).filter((itemData, index, items) => (itemData.replace || !itemData.replace && !items.find((itemDataReplacement) => itemDataReplacement.replace && itemDataReplacement.id == itemData.id && itemDataReplacement.edition == itemData.edition)));
  }

  challengesData(edition: string | undefined = undefined, all: boolean = false): ChallengeCard[] {
    return this.editionData.filter((editionData) => (all || settingsManager.settings.editions.indexOf(editionData.edition) != -1) && (!edition || editionData.edition == edition || this.editionExtensions(editionData.edition, true).indexOf(edition) != -1)).flatMap((editionData) => editionData.challenges);
  }

  conditions(edition: string | undefined = undefined, forceEdition: boolean = false): Condition[] {
    if (!edition) {
      return Conditions;
    }

    let conditions = this.editionData.filter((editionData) => (editionData.edition == edition || this.editionExtensions(edition).indexOf(editionData.edition) != -1) && editionData.conditions && editionData.conditions.length > 0).flatMap((other) => other.conditions);

    if (!forceEdition && this.game.conditions) {
      conditions.push(...this.game.conditions);
    }

    return conditions.filter((value, index, self) => self.indexOf(value) == index).map((value) => {
      if (value.split(':').length > 1) {
        return new Condition(value.split(':')[0], + value.split(':')[1]);
      } else {
        return new Condition(value);
      }
    });
  }

  figureConditions(figure: Figure, entity: Entity | undefined = undefined): ConditionName[] {
    let conditions: ConditionName[] = [];

    if (figure instanceof Character) {
      if (figure.summons) {
        figure.summons.forEach((summon) => {
          if (summon.action) {
            this.actionConditions(summon.action).forEach((condition) => {
              if (!conditions.find((name) => name == condition)) {
                conditions.push(condition);
              }
            })
          }

          if (summon.additionalAction) {
            this.actionConditions(summon.additionalAction).forEach((condition) => {
              if (!conditions.find((name) => name == condition)) {
                conditions.push(condition);
              }
            })
          }
        })
      }
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat: MonsterStat = gameManager.monsterManager.getStat(figure, entity.type);
      const ability: Ability | undefined = gameManager.monsterManager.getAbility(figure);
      if (ability) {
        ability.actions.forEach((action) => {
          this.actionConditions(action, stat).forEach((condition) => {
            if (!conditions.find((name) => name == condition)) {
              conditions.push(condition);
            }
          })
        })
      }
    }

    return conditions;
  }

  actionConditions(action: Action, stat: MonsterStat | undefined = undefined): ConditionName[] {
    let conditions: ConditionName[] = [];
    if (action.type == ActionType.condition) {
      conditions.push(action.value as ConditionName);
    } else if (stat && action.type == ActionType.attack && stat.actions) {
      stat.actions.forEach((statAction) => {
        if (statAction.type == ActionType.condition) {
          conditions.push(statAction.value as ConditionName);
        }
      })
    }

    if (action.subActions) {
      action.subActions.forEach((subAction) => {
        conditions.push(...this.actionConditions(subAction, stat));
      })
    }

    return conditions;
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

  sortFigures(figure: Figure | undefined = undefined) {
    this.game.figures.sort((a, b) => {
      if (!settingsManager.settings.sortFigures) {
        return 0;
      }

      if (this.game.state == GameState.draw) {
        return this.sortFiguresByTypeAndName(a, b);
      } else if (figure && figure != a && figure != b) {
        return 0;
      } else if (settingsManager.settings.initiativeRequired || a.getInitiative() > 0 && b.getInitiative() > 0) {
        if (a.getInitiative() == b.getInitiative()) {
          return this.sortFiguresByTypeAndName(a, b);
        }

        // apply Challenge #1491
        if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1491, 'fh')) {
          return b.getInitiative() - a.getInitiative();
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
      aName = gameManager.characterManager.characterName(a).toLowerCase();
    } else if (a instanceof Monster) {
      aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
    } else if (a instanceof ObjectiveContainer) {
      aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective')).toLowerCase());
    }

    let bName = b.name.toLowerCase();
    if (b instanceof Character) {
      bName = gameManager.characterManager.characterName(b).toLowerCase();
    } else if (b instanceof Monster) {
      bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
    } else if (b instanceof ObjectiveContainer) {
      bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective')).toLowerCase());
    }
    if (a instanceof Character && b instanceof Monster) {
      return -1;
    } else if (a instanceof Monster && b instanceof Character) {
      return 1;
    } else if (a instanceof Character && b instanceof ObjectiveContainer) {
      return -1;
    } else if (a instanceof ObjectiveContainer && b instanceof Character) {
      return 1;
    } else if (a instanceof Monster && b instanceof ObjectiveContainer) {
      return -1;
    } else if (a instanceof ObjectiveContainer && b instanceof Monster) {
      return 1;
    } else if (a instanceof Monster && b instanceof Monster) {
      return 0;
    } else if (a instanceof ObjectiveContainer && b instanceof ObjectiveContainer && aName == bName) {
      if (a.marker && b.marker) {
        return a.marker < b.marker ? -1 : 1;
      } else if (a.marker) {
        return 1;
      } else if (b.marker) {
        return -1;
      }
    }

    if (a instanceof Character && b instanceof Character && settingsManager.settings.characterSortIndex) {
      return a.number - b.number;
    }

    return aName < bName ? -1 : 1;
  }

  deckData(figure: Monster | Character, ignoreError: boolean = false): DeckData {
    let deckData: DeckData | undefined

    // find stat effect deck
    if (figure instanceof Monster && figure.statEffect && figure.statEffect.deck) {
      deckData = this.decksData().find((deck) => (figure instanceof Monster && figure.statEffect && figure.statEffect.deck && figure.statEffect.deck == deck.name) && (deck.edition == figure.edition || deck.edition == gameManager.currentEdition() || this.editionExtensions(deck.edition).indexOf(gameManager.currentEdition(figure.edition)) != -1));
      if (deckData && figure.abilities.length != deckData.abilities.length) {
        figure.abilities = deckData.abilities.filter((ability) => isNaN(+ability.level) || +ability.level <= (figure && figure.level || 0)).map((ability) => deckData ? deckData.abilities.indexOf(ability) : -1);
        ghsShuffleArray(figure.abilities);
        if (this.game.state == GameState.next) {
          figure.ability = 0;
        }
      }
    }

    if (!deckData) {
      deckData = this.decksData(figure.edition).find((deck) => (deck.name == figure.deck || deck.name == figure.name));
    }

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
      if (!ignoreError && !figure.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !figure.errors.find((figureError) => figureError.type == FigureErrorType.deck)) {
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

      if (!characterData && !edition) {
        edition = name.split('-')[0];
        name = name.split('-').slice(1).join('-');
        characterData = this.charactersData().find((value) => value.name == name && value.edition == edition);
        while (name && !characterData) {
          edition = edition + '-' + name.split('-')[0];
          name = name.split('-').slice(1).join('-');
          characterData = this.charactersData().find((value) => value.name == name && value.edition == edition);
        }
      }

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

  isMonster(figure: Figure): boolean {
    return figure instanceof Monster;
  }

  isMonsterEntity(entity: Entity): boolean {
    return entity instanceof MonsterEntity;
  }

  isSummon(entity: Entity): boolean {
    return entity instanceof Summon;
  }

  isObjectiveContainer(figure: Figure): boolean {
    return figure instanceof ObjectiveContainer;
  }

  isObjectiveEntity(entity: Entity): boolean {
    return entity instanceof ObjectiveEntity;
  }

  toCharacter(figure: Figure | Entity): Character {
    return figure as Character;
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

  toObjectiveContainer(figure: Figure): ObjectiveContainer {
    return figure as ObjectiveContainer;
  }

  toObjectiveEntity(entity: Entity): ObjectiveEntity {
    return entity as ObjectiveEntity;
  }

  getEdition(figure: any, fallback: string = ""): string {
    const edition = this.currentEdition(fallback);
    if (figure.edition != edition && this.editionExtensions(edition).indexOf(figure.edition) == -1) {
      return figure.edition;
    }
    return "";
  }

  gameplayFigure(figure: Figure) {
    return (figure instanceof Monster || figure instanceof ObjectiveContainer) && this.entityManager.entitiesAll(figure, true).length > 0 || figure instanceof Character && gameManager.entityManager.isAlive(figure);
  }

  figuresByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean = false, figures: Figure[] = []): Figure[] {
    if (figures.length == 0) {
      figures = this.game.figures;
    }
    if (identifier && identifier.type) {
      const type = identifier.type;
      if (type == "all") {
        return scenarioEffect ? figures.filter((figure) => {
          if (!(figure instanceof Character)) {
            return true
          } else {
            return !this.characterManager.ignoreNegativeScenarioffects(figure);
          }
        }) : figures;
      }
      if (identifier.name) {
        const edition = identifier.edition;
        const name = new RegExp('^' + identifier.name + '$');
        switch (type) {
          case "monster":
            return figures.filter((figure) => figure instanceof Monster && (!edition || figure.edition == edition) && figure.name.match(name) && (!identifier.marker || figure.entities.some((entity) => entity.marker == identifier.marker)) && (!identifier.tags || identifier.tags.length == 0 || figure.entities.some((entity) => identifier.tags && identifier.tags.every((tag) => entity.tags && entity.tags.indexOf(tag) != -1))));
          case "character":
          case "characterWithSummon":
            return figures.filter((figure) => {
              if (figure instanceof Character && !figure.absent && (!edition || figure.edition == edition) && figure.name.match(name) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags && identifier.tags.every((tag) => figure.tags && figure.tags.indexOf(tag) != -1))) {
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
            return this.game.figures.filter((figure) => figure instanceof ObjectiveContainer && figure.name.match(name) && (edition != "escort" || figure.escort) && (!identifier.marker || figure.entities.some((entity) => entity.marker == identifier.marker)) && (!identifier.tags || identifier.tags.length == 0 || figure.entities.some((entity) => identifier.tags && identifier.tags.every((tag) => entity.tags && entity.tags.indexOf(tag) != -1))));
        }
      }
    }

    return [];
  }

  entitiesByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean): Entity[] {
    let figures = this.figuresByIdentifier(identifier, scenarioEffect);
    return figures.map((figure) => {
      if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
        return figure.entities;
      } else if (figure instanceof Character) {
        if (identifier && identifier.type == "characterWithSummon") {
          return [figure as Entity, ...figure.summons];
        }
        return figure as Entity;
      } else {
        return undefined;
      }
    }).flat().filter((value) => value != undefined).map((value) => value as Entity).filter((entity) => !identifier || (!identifier.marker || !(entity instanceof MonsterEntity) || entity.marker == identifier.marker) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => entity.tags.indexOf(tag) != -1)));
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData().find((value) => value.name == name && value.edition == edition);
    if (!monsterData) {
      monsterData = this.monstersData().find((value) => value.name == name);
      if (!monsterData) {
        monsterData = new MonsterData();
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
      if (this.prosperityTicks() > step) {
        prosperityLevel++;
      }
    })
    return prosperityLevel;
  }

  prosperityTicks(): number {
    let ticks = this.game.party.prosperity;
    if (this.game.party.envelopeB && this.editionRules('gh')) {
      ticks += 1;
      if (this.game.party.donations > 10) {
        ticks += Math.floor(Math.min(this.game.party.donations - 10, 30) / 5);
      }

      if (this.game.party.donations > 40) {
        ticks += Math.floor((this.game.party.donations - 40) / 10);
      }
    }

    return ticks;
  }

  fhRules(gh2e: boolean = false): boolean {
    return this.editionRules('fh') || gh2e && this.editionRules('gh2e');
  }

  bbRules(): boolean {
    return this.editionRules('bb');
  }

  editionRules(edition: string, current: boolean = true): boolean {
    const currentEdition = current ? this.currentEdition() : this.game.edition;
    return currentEdition && (currentEdition == edition || this.editionExtensions(currentEdition).indexOf(edition) != -1) || false;
  }

  additionalIdentifier(figure: Figure, entity: Entity | undefined = undefined): AdditionalIdentifier {
    if (figure instanceof Character) {
      return new AdditionalIdentifier(figure.name, figure.edition, "character", undefined, figure.tags);
    } else if (figure instanceof Monster) {
      if (entity instanceof MonsterEntity) {
        return new AdditionalIdentifier(figure.name, figure.edition, "monster", entity.marker, entity.tags);
      }
      return new AdditionalIdentifier(figure.name, figure.edition, "monster", undefined, figure.tags);
    } else if (figure instanceof ObjectiveContainer) {
      if (entity instanceof ObjectiveEntity) {
        return new AdditionalIdentifier(figure.name, figure.escort ? "escort" : "objective", "objective", entity.marker, entity.tags);
      }
      return new AdditionalIdentifier(figure.name, figure.escort ? "escort" : "objective", "objective", undefined, []);
    }

    return new AdditionalIdentifier(figure.name, figure.edition, undefined, undefined, entity && entity.tags || []);
  }

  entityCounter(identifier: AdditionalIdentifier): EntityCounter | undefined {
    return this.entityCounters(identifier)[0] || undefined;
  }

  entityCounters(identifier: AdditionalIdentifier): EntityCounter[] {
    const name = new RegExp('^' + identifier.name + '$');
    return this.game.entitiesCounter.filter((entityCounter) =>
      // match type
      (!identifier.type || identifier.type == entityCounter.identifier.type) &&
      // match name
      entityCounter.identifier.name.match(name) &&
      // match edition
      (!identifier.edition || identifier.edition == entityCounter.identifier.edition) &&
      // match marker
      (!identifier.marker || identifier.marker == entityCounter.identifier.marker) &&
      // match tags
      (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => entityCounter.identifier.tags && entityCounter.identifier.tags.indexOf(tag) != -1)));
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
      if (figure instanceof Character) {
        if (!this.entityCounter(this.additionalIdentifier(figure))) {
          this.addEntityCount(figure);
        }
      } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
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
        if (figures.every((figure) => figure instanceof Character)) {
          figures = figures.filter((figure) => figure instanceof Character && this.entityManager.isAlive(figure));
          if (figures.length + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - figures.length
          } else if (figures.length + entityCounter.killed > entityCounter.total) {
            console.warn("More killed then figures counted", entityCounter.identifier, "total: " + entityCounter.total, "killed: " + entityCounter.killed, "current: " + figures.length);
            entityCounter.total = figures.length + entityCounter.killed;
          }
        } else if (figures.every((figure) => figure instanceof Monster)) {
          const count = figures.map((figure) => this.monsterManager.monsterEntityCountIdentifier(figure as Monster, entityCounter.identifier)).reduce((a, b) => a + b);
          if (count + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - count
          } else if (count + entityCounter.killed > entityCounter.total) {
            console.warn("More killed then figures counted", entityCounter.identifier, "total: " + entityCounter.total, "killed: " + entityCounter.killed, "current: " + count);
            entityCounter.total = count + entityCounter.killed;
          }
        } else if (figures.every((figure) => figure instanceof ObjectiveContainer)) {
          const count = figures.map((figure) => this.objectiveManager.objectiveEntityCountIdentifier(figure as ObjectiveContainer, entityCounter.identifier)).reduce((a, b) => a + b);
          if (count + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - count
          } else if (count + entityCounter.killed > entityCounter.total) {
            console.warn("More killed then figures counted", entityCounter.identifier, "total: " + entityCounter.total, "killed: " + entityCounter.killed, "current: " + count);
            entityCounter.total = count + entityCounter.killed;
          }
        }
      }
    })
  }

  nextElementState(element: ElementModel, double: boolean = false, draw: boolean = false): ElementState {
    if (gameManager.bbRules()) {
      if (element.state != ElementState.strong) {
        return ElementState.strong;
      } else {
        return ElementState.inert;
      }
    }

    if (gameManager.game.state == GameState.draw || draw) {
      if (element.state == ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      }
      if (element.state == ElementState.new || element.state == ElementState.strong) {
        if (!double) {
          return ElementState.waning;
        }
      } else if (element.state == ElementState.waning) {
        return ElementState.inert;
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    } else {
      if (element.state == ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      } if (element.state == ElementState.strong) {
        if (double) {
          return ElementState.waning;
        }
      } else if (element.state == ElementState.waning) {
        if (double) {
          return ElementState.new;
        }
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    }

    return ElementState.inert;
  }

  campaignData(): CampaignData {
    const editionData = this.editionData.find((editionData) => editionData.edition == this.currentEdition());

    if (editionData && editionData.campaign) {
      return editionData.campaign;
    }

    return new CampaignData();
  }

  changeParty(party: Party) {
    if (settingsManager.settings.automaticTheme) {
      if (this.game.edition != 'fh' && party.edition == 'fh') {
        settingsManager.set('fhStyle', true);
      } else if (this.game.edition == 'fh' && party.edition != 'fh') {
        settingsManager.set('fhStyle', false);
      }
    }

    this.game.party.characters = this.game.figures.filter((figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel()));
    this.game.party.edition = this.game.edition;
    this.game.party.conditions = this.game.conditions;
    this.game.party.battleGoalEditions = this.game.battleGoalEditions;
    this.game.party.filteredBattleGoals = this.game.filteredBattleGoals;
    this.game.party.unlockedCharacters = this.game.unlockedCharacters;
    this.game.party.level = this.game.level;
    this.game.party.levelCalculation = this.game.levelCalculation;
    this.game.party.levelAdjustment = this.game.levelAdjustment
    this.game.party.bonusAdjustment = this.game.bonusAdjustment;
    this.game.party.ge5Player = this.game.ge5Player;
    this.game.party.playerCount = this.game.playerCount;
    this.game.party.solo = this.game.solo;
    this.game.party.lootDeckEnhancements = this.game.lootDeckEnhancements;
    this.game.party.lootDeckFixed = this.game.lootDeckFixed;
    this.game.party.lootDeckSections = this.game.lootDeckSections;

    this.game.party = party;
    this.game.edition = this.game.party.edition;
    this.game.conditions = this.game.party.conditions || [];
    this.game.battleGoalEditions = this.game.party.battleGoalEditions || [];
    this.game.filteredBattleGoals = this.game.party.filteredBattleGoals || [];
    this.game.unlockedCharacters = this.game.party.unlockedCharacters || [];
    this.game.level = this.game.party.level == 0 ? 0 : this.game.party.level || this.game.level;
    this.game.levelCalculation = this.game.party.levelCalculation == false ? false : this.game.party.levelCalculation || this.game.levelCalculation;
    this.game.levelAdjustment = this.game.party.levelAdjustment == 0 ? 0 : this.game.party.levelAdjustment || this.game.levelAdjustment;
    this.game.bonusAdjustment = this.game.party.bonusAdjustment == 0 ? 0 : this.game.party.bonusAdjustment || this.game.bonusAdjustment;
    this.game.ge5Player = this.game.party.ge5Player == false ? false : this.game.party.ge5Player || this.game.ge5Player;
    this.game.playerCount = this.game.party.playerCount || this.game.playerCount;
    this.game.solo = this.game.party.solo == false ? false : this.game.party.solo || this.game.solo;
    this.game.lootDeckEnhancements = this.game.party.lootDeckEnhancements || [];
    this.game.lootDeckFixed = this.game.party.lootDeckFixed || [];
    this.game.lootDeckSections = this.game.party.lootDeckSections || [];

    this.game.figures = this.game.figures.filter((figure) => !(figure instanceof Character));
    this.scenarioManager.setScenario(undefined);
    party.characters.forEach((value) => {
      let character = new Character(this.getCharacterData(value.name, value.edition), value.level);
      character.fromModel(value);
      this.game.figures.push(character);
    });
  }

  resetCampaign() {
    this.game.figures = [];
    this.game.party.characters = [];
    this.game.party.location = "";
    this.game.party.achievements = "";
    this.game.party.achievementsList = [];
    this.game.party.reputation = 0;
    this.game.party.prosperity = 0;
    this.game.party.scenarios = [];
    this.game.party.conclusions = [];
    this.game.party.casualScenarios = [];
    this.game.party.manualScenarios = [];
    this.game.party.globalAchievements = "";
    this.game.party.globalAchievementsList = [];
    this.game.party.treasures = [];
    this.game.party.donations = 0;
    this.game.party.retirements = [];
    this.game.party.unlockedItems = [];
    this.game.party.unlockedCharacters = [];
    this.game.party.envelopeB = false;
    this.game.party.weeks = 0;
    this.game.party.weekSections = [];
    this.game.party.loot = {};
    this.game.party.randomItemLooted = [];
    this.game.party.inspiration = 0;
    this.game.party.defense = 0;
    this.game.party.soldiers = 0;
    this.game.party.morale = 0;
    this.game.party.townGuardPerks = 0;
    this.game.party.townGuardPerkSections = [];
    this.game.party.campaignStickers = [];
    this.game.party.townGuardDeck = undefined;
    this.game.party.buildings = [];
    this.game.party.lootDeckEnhancements = [];
    this.game.party.lootDeckFixed = [];
    this.game.party.lootDeckSections = [];
  }

  toggleGameClock() {
    this.game.gameClock = this.game.gameClock || [];
    let last: GameClockTimestamp | undefined = this.game.gameClock.length ? this.game.gameClock[0] : undefined;
    if (last) {
      if (!last.clockIn) {
        console.warn("Timestamp with invalid clock:", last);
        last.clockIn = new Date().getTime();
      } else if (!last.clockOut) {
        last.clockOut = new Date().getTime();
      } else {
        last = undefined;
      }
    }

    if (!last) {
      this.game.gameClock.unshift(new GameClockTimestamp(new Date().getTime()));
    }
    this.stateManager.saveLocal();
  }

  mergeGameClocks(gameClockA: GameClockTimestamp[], gameClockB: GameClockTimestamp[]): GameClockTimestamp[] {
    let gameClock: GameClockTimestamp[] = [];

    gameClockA.forEach((value) => {
      const matchingValue = gameClockB.find((other) => other.clockIn <= value.clockIn && (other.clockOut && value.clockOut && other.clockOut >= value.clockOut || !other.clockOut));
      if (matchingValue) {
        gameClock.push(matchingValue);
      } else {
        gameClock.push(value);
      }
    })

    gameClockB.forEach((value) => {
      if (!gameClock.find(((other) => other.clockIn <= value.clockIn && (other.clockOut && value.clockOut && other.clockOut >= value.clockOut || !other.clockOut)))) {
        gameClock.push(value);
      }
    })

    return gameClock.sort((a, b) => b.clockIn - a.clockIn);
  }

}

export const gameManager: GameManager = new GameManager();
window.gameManager = gameManager;

import { LOOT_RANDOM_ITEM_MARKER } from 'src/app/game/businesslogic/LootManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { ScenarioStats } from 'src/app/game/model/CharacterProgress';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { ElementState } from 'src/app/game/model/data/Element';
import { LootDeck } from 'src/app/game/model/data/Loot';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Scenario } from 'src/app/game/model/Scenario';

export class RoundManager {
  game: Game;
  working: boolean = false;
  firstRound: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  drawAvailable(): boolean {
    return (
      this.game.figures.length > 0 &&
      (this.game.state === GameState.next ||
        this.game.figures.every(
          (figure) =>
            figure instanceof Monster ||
            (figure instanceof ObjectiveContainer && (figure.getInitiative() > 0 || !settingsManager.settings.initiativeRequired)) ||
            (figure instanceof Character &&
              (figure.getInitiative() > 0 || figure.exhausted || figure.absent || !settingsManager.settings.initiativeRequired))
        ))
    );
  }

  validInitiative(initiative: number): boolean {
    return (
      initiative >= 0 &&
      initiative <= 99 &&
      (initiative > 0 || this.game.state === GameState.draw || !settingsManager.settings.initiativeRequired)
    );
  }

  clampInitiative(initiative: number): number {
    const value = Math.min(99, Math.max(0, initiative));
    return value === 0 && this.game.state === GameState.next && settingsManager.settings.initiativeRequired ? 1 : value;
  }

  setInitiative(figure: Character | ObjectiveContainer, initiative: number): boolean {
    if (!this.validInitiative(initiative)) {
      return false;
    }
    figure.initiative = initiative;
    if (figure instanceof Character) {
      figure.initiativeVisible = true;
      if (initiative === 99) {
        figure.longRest = true;
      } else if (!initiative || !gameManager.specialActionsManager.keepInitiativeOnLongRest(figure)) {
        figure.longRest = false;
      }
    }
    if (this.game.state === GameState.next) {
      gameManager.roundManager.sortFigures(figure);
    }
    return true;
  }

  setLongRest(character: Character, longRest: boolean) {
    if (character.longRest === longRest) {
      return;
    }
    if (longRest) {
      gameManager.characterAbilityManager.clearSelection(character);
    }
    if (longRest && character.initiative !== 99 && !gameManager.specialActionsManager.keepInitiativeOnLongRest(character)) {
      character.initiative = 99;
      character.initiativeVisible = true;
    }
    character.longRest = longRest;
    if (this.game.state === GameState.next) {
      gameManager.roundManager.sortFigures(character);
    }
  }

  missingInitiative(): boolean {
    return (
      settingsManager.settings.initiativeRequired &&
      this.game.figures.some(
        (figure) =>
          ((figure instanceof Character && gameManager.entityManager.isAlive(figure) && !figure.absent) ||
            figure instanceof ObjectiveContainer) &&
          figure.getInitiative() <= 0
      )
    );
  }

  hasActiveFigure(): boolean {
    return this.game.figures.some((figure) => figure.active && !figure.off && (!(figure instanceof Character) || !figure.absent));
  }

  turnConfirmationPending(): boolean {
    return (
      this.hasActiveFigure() &&
      settingsManager.settings.turnConfirmation &&
      (settingsManager.settings.expireConditions || settingsManager.settings.applyConditions)
    );
  }

  battleGoalsPending(): boolean {
    return (
      !this.missingInitiative() &&
      settingsManager.settings.battleGoals &&
      settingsManager.settings.battleGoalsReminder &&
      this.game.scenario !== undefined &&
      this.firstRound &&
      !this.game.figures.every((figure) => !(figure instanceof Character) || figure.battleGoal || figure.absent) &&
      !gameManager.bbRules()
    );
  }

  eventDrawPending(): boolean {
    return (
      !this.missingInitiative() &&
      !settingsManager.settings.eventsDraw &&
      settingsManager.settings.eventsDrawReminder &&
      this.game.scenario !== undefined &&
      this.firstRound &&
      this.game.eventDraw !== undefined
    );
  }

  scenarioFailed(): boolean {
    return (
      !this.hasActiveFigure() &&
      this.game.figures.some((figure) => figure instanceof Character) &&
      this.game.figures.every((figure) => !(figure instanceof Character) || !gameManager.entityManager.isAlive(figure) || figure.absent)
    );
  }

  drawBlocked(): boolean {
    return (
      this.game.figures.length === 0 ||
      this.missingInitiative() ||
      this.battleGoalsPending() ||
      this.scenarioFailed() ||
      this.eventDrawPending()
    );
  }

  nextBlocked(): boolean {
    return this.turnConfirmationPending() || this.scenarioFailed();
  }

  endAllTurns() {
    this.game.figures.forEach((figure) => gameManager.turnManager.afterTurn(figure));
  }

  canNextRound(force: boolean = false): boolean {
    return force || (this.game.state === GameState.draw ? !this.drawBlocked() : !this.nextBlocked());
  }

  nextRound(force: boolean = false): boolean {
    if (!this.canNextRound(force)) {
      return false;
    }
    if (this.game.state === GameState.next) {
      if (settingsManager.settings.turnConfirmation) {
        const activeFigure = this.game.figures.find((figure) => figure.active && !figure.off);
        if (!this.turnConfirmationPending() && activeFigure) {
          gameManager.turnManager.afterTurn(activeFigure);
        }
      } else {
        let lastActive = this.game.figures.find((figure) => gameManager.entityManager.gameplayFigure(figure) && !figure.off);
        while (lastActive) {
          gameManager.turnManager.toggleFigure(lastActive, true);
          lastActive = this.game.figures.find((figure) => gameManager.entityManager.gameplayFigure(figure) && !figure.off);
        }
      }
    }
    this.nextGameState();
    return true;
  }

  nextGameState(force: boolean = false) {
    this.working = true;
    this.game.totalSeconds += this.game.playSeconds;
    this.game.playSeconds = 0;

    if (settingsManager.settings.scenarioRules) {
      gameManager.scenarioRulesManager.addScenarioRules();
    }

    if (this.game.state === GameState.next) {
      this.endRound();
    } else if (this.drawAvailable() || force) {
      this.startRound();
    }

    if (settingsManager.settings.removeUnusedMonster) {
      this.game.figures
        .filter(
          (figure) => figure instanceof Monster && figure.off && figure.entities.length === 0 && !figure.tags.includes('addedManually')
        )
        .forEach((figure) => {
          gameManager.monsterManager.removeMonster(figure as Monster);
        });
    }

    gameManager.triggerUiChange(false);
    setTimeout(() => (this.working = false), 1);
  }

  private endRound() {
    this.game.state = GameState.draw;
    gameManager.entityManager.next();
    gameManager.characterManager.next();
    gameManager.monsterManager.next();
    gameManager.objectiveManager.next();
    gameManager.attackModifierManager.next();

    if (settingsManager.settings.moveElements) {
      this.game.elementBoard.forEach((element) => {
        if (element.state !== ElementState.always) {
          if (gameManager.bbRules()) {
            element.state = ElementState.inert;
          } else {
            if (element.state === ElementState.strong || element.state === ElementState.new) {
              if (!gameManager.specialActionsManager.preventElementWaning(element.type)) {
                element.state = ElementState.waning;
              }
            } else if (element.state === ElementState.waning) {
              element.state = ElementState.inert;
            }
          }
        }
      });
    }

    gameManager.roundManager.sortFigures();

    this.game.figures.forEach((figure) => {
      figure.active = false;
      if (
        settingsManager.settings.characterAttackModifierDeckActiveBottom &&
        settingsManager.settings.characterAttackModifierDeckPermanentActive
      ) {
        if (figure instanceof Character) {
          figure.attackModifierDeckVisible = false;
        }
      }
    });
  }

  private startRound() {
    if (this.firstRound) {
      gameManager.attackModifierManager.firstRound();
      gameManager.lootManager.firstRound();
      if (gameManager.challengesManager.enabled) {
        gameManager.challengesManager.clearDrawn(this.game.challengeDeck, true);
        gameManager.challengesManager.applyCardsStart();
      }
      if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
        gameManager.trialsManager.applyFavorPoints();
      }
      this.game.challengeDeck.active = false;
      let scenario = new Scenario(new ScenarioData(), [], [], true);
      if (this.game.scenario) {
        scenario = this.game.scenario;
      } else {
        this.game.scenario = scenario;
      }

      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          if (this.game.scenario && settingsManager.settings.characterItemsApply) {
            gameManager.itemManager.applyEquippedItemEffects(figure);
          }
          if (settingsManager.settings.scenarioStats) {
            figure.scenarioStats = new ScenarioStats();
          }
        }
      });
    }
    this.game.state = GameState.next;
    this.game.round++;
    gameManager.characterManager.draw();
    gameManager.monsterManager.draw();
    gameManager.objectiveManager.draw();

    if (settingsManager.settings.moveElements) {
      this.game.elementBoard.forEach((element) => {
        if (element.state === ElementState.new) {
          element.state = ElementState.strong;
        }
      });
    }

    gameManager.roundManager.sortFigures();
    gameManager.scenarioRulesManager.cleanActiveScenarioRules();

    // apply Challenge #1526
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1526, 'fh')) {
      gameManager.challengesManager.applyCardsTrigger(1526);
    }

    if (this.game.figures.length > 0 && (settingsManager.settings.initiativeRequired || settingsManager.settings.automaticFirstFigure)) {
      let i = 0;
      let firstFigure = this.game.figures.find((figure, index) => index === i && gameManager.entityManager.gameplayFigure(figure));
      while (!firstFigure && i < this.game.figures.length - 1) {
        i++;
        firstFigure = this.game.figures.find((figure, index) => index === i && gameManager.entityManager.gameplayFigure(figure));
      }
      if (firstFigure) {
        gameManager.turnManager.toggleFigure(firstFigure, true);
      }
    }
  }

  setRoundReset(value: number) {
    const hidden = this.game.roundResetsHidden;
    if (hidden.length === 0) {
      if (value !== 0) {
        hidden.push(value);
      }
    } else if (value === 0) {
      hidden.splice(hidden.length - 1, 1);
    } else {
      hidden[hidden.length - 1] = value;
    }
  }

  resetScenario() {
    this.game.playSeconds = 0;
    this.game.sections = [];
    if (this.game.scenario) {
      this.game.scenario.revealedRooms = [];
      this.game.scenario.additionalSections = [];
    }
    this.game.scenarioRules = [];
    this.game.appliedScenarioRules = [];
    this.game.discardedScenarioRules = [];
    this.game.round = 0;
    this.game.roundResets = [];
    this.game.roundResetsHidden = [];
    this.game.eventDraw = undefined;
    this.game.state = GameState.draw;
    this.game.elementBoard.forEach((element) => (element.state = ElementState.inert));

    this.game.monsterAttackModifierDeck = gameManager.attackModifierBuildManager.defaultMonsterAttackModifierDeck();
    this.game.allyAttackModifierDeck = gameManager.attackModifierBuildManager.buildMonsterAttackModifierDeck(true);

    this.game.figures = this.game.figures.filter(
      (figure) => figure instanceof Character || (this.game.scenario && this.game.scenario.custom)
    );
    this.game.entitiesCounter = [];
    this.game.lootDeck.fromModel(new LootDeck());
    this.game.challengeDeck.active = false;
    if (this.game.challengeDeck.cards.length) {
      gameManager.challengesManager.clearDrawn(this.game.challengeDeck);
    }

    if (!this.game.keepFavors) {
      this.game.favors = [];
      this.game.favorPoints = [];
    }

    this.resetScenarioFigures();

    gameManager.roundManager.sortFigures();

    const campaignData = gameManager.campaignManager.campaignData();
    if (this.game.party.townGuardDeck && campaignData.townGuardPerks) {
      const townGuardDeck = gameManager.attackModifierBuildManager.buildTownGuardAttackModifierDeck(this.game.party, campaignData);
      gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
      townGuardDeck.active = false;
      this.game.party.townGuardDeck = townGuardDeck.toModel();
    }

    if (this.game.party.pets) {
      this.game.party.pets.forEach((value) => {
        value.lost = false;
      });
    }

    gameManager.trialsManager.applyTrialCards();

    gameManager.stateManager.standeeDialogCanceled = false;
    gameManager.triggerUiChange(false);
  }

  private resetScenarioFigures() {
    this.game.figures.forEach((figure) => {
      figure.active = false;
      figure.off = false;
      if (figure instanceof Character) {
        figure.specialActions
          .filter((specialAction) => specialAction.expire && figure.tags.includes(specialAction.name))
          .forEach((specialAction) => gameManager.specialActionsManager.removeSpecialAction(figure, figure, specialAction.name));

        figure.health = figure.maxHealth;
        figure.loot = 0;
        figure.lootCards = [];
        figure.treasures = [];
        figure.experience = 0;
        figure.entityConditions = [];
        figure.immunities = [];
        figure.summons = [];
        figure.initiative = 0;
        figure.exhausted = false;
        figure.longRest = false;
        figure.token = 0;
        figure.battleGoal = false;
        figure.battleGoals = [];
        figure.extraActions = [];
        figure.extraActionsPersistent = [];
        gameManager.characterAbilityManager.resetAbilityCards(figure);
        figure.scenarioStats = new ScenarioStats();
        figure.tokenValues = figure.tokens.map(() => 0);

        if (gameManager.fhRules() && figure.tags.includes('new-character')) {
          figure.progress.gold = 0;
        }

        figure.tags = figure.tags.filter((tag) => tag !== 'new-character');

        if (figure.defaultIdentity !== undefined) {
          figure.identity = figure.defaultIdentity;
        }

        gameManager.specialActionsManager.startScenario(figure);

        if (!figure.absent) {
          if (figure.name === 'eclipse' && figure.edition === 'gh2e') {
            const eclipseInvisible = new EntityCondition(ConditionName.invisible);
            eclipseInvisible.permanent = true;
            figure.entityConditions.push(eclipseInvisible);
          }
        }

        figure.availableSummons
          .filter((summonData) => summonData.special)
          .forEach((summonData) => gameManager.summonManager.createSpecialSummon(figure, summonData));

        figure.attackModifierDeck = gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(figure);
        figure.lootCardsVisible = false;

        figure.progress.equippedItems = figure.progress.equippedItems.filter((value) => value.marker !== LOOT_RANDOM_ITEM_MARKER);

        figure.progress.equippedItems.forEach((identifier) => (identifier.tags = []));
        gameManager.characterManager.applyDonations(figure);
      } else if (figure instanceof Monster) {
        figure.entities = [];
        figure.ability = -1;
        figure.abilities = [];
        gameManager.monsterAbilityManager.resetMonsterAbilities(figure);
      } else if (figure instanceof ObjectiveContainer) {
        figure.entities = [];
      }
    });
  }

  sortFigures(figure: Figure | undefined = undefined) {
    this.game.figures.sort((a, b) => {
      if (!settingsManager.settings.sortFigures) {
        return 0;
      }

      if (this.game.state === GameState.draw) {
        return this.sortFiguresByTypeAndName(a, b);
      } else if (figure && figure !== a && figure !== b) {
        return 0;
      } else if (settingsManager.settings.initiativeRequired || a.getInitiative() > 0 || b.getInitiative() > 0) {
        if (a.getInitiative() <= 0 && b.getInitiative() <= 0) {
          return 0;
        }

        const reverse =
          this.game.activeScenarioRules.some((identifier) => {
            const rule = gameManager.scenarioRulesManager.getScenarioRule(identifier);
            return rule?.reverseInitiative;
          }) ||
          (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1491, 'fh')); // apply Challenge #1491

        if (a.getInitiative() === b.getInitiative()) {
          return this.sortFiguresByTypeAndName(a, b, reverse);
        }
        if (reverse) {
          return b.getInitiative() - a.getInitiative();
        }

        return a.getInitiative() - b.getInitiative();
      }

      return 0;
    });
  }

  sortFiguresByTypeAndName(a: Figure, b: Figure, reverse: boolean = false): number {
    if (a instanceof Monster && b instanceof Monster && (a.standeeShare === b.name || a.name === b.standeeShare)) {
      const aE = a.entities.filter((e) => gameManager.entityManager.isAlive(e))[0];
      const bE = b.entities.filter((e) => gameManager.entityManager.isAlive(e))[0];
      if (aE && bE) {
        if (aE.type === bE.type) {
          return reverse ? bE.number - aE.number : aE.number - bE.number;
        }
        return aE.type === MonsterType.elite ? (reverse ? 1 : -1) : reverse ? -1 : 1;
      }
    } else if (a.off && !b.off) {
      return reverse ? -1 : 1;
    } else if (!a.off && b.off) {
      return reverse ? 1 : -1;
    }

    let aName = a.name.toLowerCase();
    if (a instanceof Character) {
      aName = gameManager.characterManager.characterName(a).toLowerCase();
    } else if (a instanceof Monster) {
      aName = labelManager.getLabel('data.monster.' + a.name).toLowerCase();
    } else if (a instanceof ObjectiveContainer) {
      aName = a.title
        ? a.title
        : labelManager.getLabel(a.name ? 'data.objective.' + a.name : a.escort ? 'escort' : 'objective').toLowerCase();
    }

    let bName = b.name.toLowerCase();
    if (b instanceof Character) {
      bName = gameManager.characterManager.characterName(b).toLowerCase();
    } else if (b instanceof Monster) {
      bName = labelManager.getLabel('data.monster.' + b.name).toLowerCase();
    } else if (b instanceof ObjectiveContainer) {
      bName = b.title
        ? b.title
        : labelManager.getLabel(b.name ? 'data.objective.' + b.name : b.escort ? 'escort' : 'objective').toLowerCase();
    }
    if (a instanceof Character && b instanceof Monster) {
      return reverse ? 1 : -1;
    } else if (a instanceof Monster && b instanceof Character) {
      return reverse ? -1 : 1;
    } else if (a instanceof Character && b instanceof ObjectiveContainer) {
      return reverse ? 1 : -1;
    } else if (a instanceof ObjectiveContainer && b instanceof Character) {
      return reverse ? -1 : 1;
    } else if (a instanceof Monster && b instanceof ObjectiveContainer) {
      return reverse ? 1 : -1;
    } else if (a instanceof ObjectiveContainer && b instanceof Monster) {
      return reverse ? -1 : 1;
    } else if (a instanceof ObjectiveContainer && b instanceof ObjectiveContainer && aName === bName) {
      if (a.marker && b.marker) {
        return a.marker < b.marker ? (reverse ? 1 : -1) : reverse ? -1 : 1;
      } else if (a.marker) {
        return reverse ? -1 : 1;
      } else if (b.marker) {
        return reverse ? 1 : -1;
      }
    }

    if (a instanceof Character && b instanceof Character && settingsManager.settings.characterSortIndex) {
      return reverse ? b.number - a.number : a.number - b.number;
    }

    return aName < bName ? (reverse ? 1 : -1) : reverse ? -1 : 1;
  }
}

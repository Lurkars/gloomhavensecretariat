import { AttackModifier, AttackModifierDeck, AttackModifierType } from "src/app/game/model/data/AttackModifier";
import { Character } from "../model/Character";
import { ScenarioStats } from "../model/CharacterProgress";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { Scenario } from "../model/Scenario";
import { Summon, SummonState } from "../model/Summon";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "../model/data/Condition";
import { ElementState } from "../model/data/Element";
import { ItemFlags } from "../model/data/ItemData";
import { LootDeck } from "../model/data/Loot";
import { ScenarioData } from "../model/data/ScenarioData";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class RoundManager {

  game: Game;
  working: boolean = false;
  firstRound: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  drawAvailable(): boolean {
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure) => figure instanceof Monster || figure instanceof ObjectiveContainer && (figure.getInitiative() > 0 || !settingsManager.settings.initiativeRequired) || figure instanceof Character && (figure.getInitiative() > 0 || figure.exhausted || figure.absent || !settingsManager.settings.initiativeRequired)
    ));
  }

  nextGameState(force: boolean = false) {
    this.working = true;
    this.game.totalSeconds += this.game.playSeconds;
    this.game.playSeconds = 0;

    if (settingsManager.settings.scenarioRules) {
      gameManager.scenarioRulesManager.addScenarioRules();
    }

    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      gameManager.entityManager.next();
      gameManager.characterManager.next();
      gameManager.objectiveManager.next();
      gameManager.monsterManager.next();
      gameManager.attackModifierManager.next();

      if (settingsManager.settings.moveElements) {
        this.game.elementBoard.forEach((element) => {
          if (element.state != ElementState.always) {
            if (gameManager.bbRules()) {
              element.state = ElementState.inert;
            } else {
              if (element.state == ElementState.strong || element.state == ElementState.new) {
                element.state = ElementState.waning;
              } else if (element.state == ElementState.waning) {
                element.state = ElementState.inert;
              }
            }
          }
        })
      }

      gameManager.sortFigures();

      this.game.figures.forEach((figure) => {
        figure.active = false;
      });

    } else if (this.drawAvailable() || force) {
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
            if (gameManager.game.scenario && settingsManager.settings.characterItemsApply) {
              gameManager.itemManager.applyEquippedItemEffects(figure);
            }
            if (settingsManager.settings.scenarioStats) {
              figure.scenarioStats = new ScenarioStats();
            }
          }
        })
      }
      this.game.state = GameState.next;
      this.game.round++;
      gameManager.characterManager.draw();
      gameManager.objectiveManager.draw();
      gameManager.monsterManager.draw();

      if (settingsManager.settings.moveElements) {
        this.game.elementBoard.forEach((element) => {
          if (element.state == ElementState.new) {
            element.state = ElementState.strong;
          }
        })
      }

      gameManager.sortFigures();

      // apply Challenge #1526
      if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1526, 'fh')) {
        gameManager.challengesManager.applyCardsTrigger(1526);
      }

      if (this.game.figures.length > 0) {
        let i = 0;
        let firstFigure = this.game.figures.find((figure, index) => index == i && gameManager.gameplayFigure(figure));
        while (!firstFigure && i < this.game.figures.length - 1) {
          i++;
          firstFigure = this.game.figures.find((figure, index) => index == i && gameManager.gameplayFigure(figure));
        }
        if (firstFigure) {
          this.toggleFigure(firstFigure, true);
        }
      }

    }

    if (settingsManager.settings.removeUnusedMonster) {
      this.game.figures.filter((figure) => figure instanceof Monster && figure.off && figure.entities.length == 0 && figure.tags.indexOf('addedManually') == -1).forEach((figure) => {
        gameManager.monsterManager.removeMonster(figure as Monster);
      })
    }

    gameManager.uiChange.emit();
    setTimeout(() => this.working = false, 1);
  }

  toggleFigure(toggleFigure: Figure, initial: boolean = false) {
    const figures: Figure[] = this.game.figures;
    let index = figures.indexOf(toggleFigure);

    let lastActive = figures.find((other) => other.active);
    let lastIndex = lastActive ? figures.indexOf(lastActive) : -1;

    if (!lastActive && figures.every((figure) => figure.off)) {
      lastIndex = figures.length - 1;
      lastActive = figures[lastIndex];
      while (lastActive && !gameManager.gameplayFigure(lastActive)) {
        lastIndex--;
        if (lastIndex == -1) {
          lastActive = undefined;
        } else {
          lastActive = figures[lastIndex];
        }
      }
    }

    const skipObjectives = toggleFigure.active || !gameManager.objectiveManager.skipObjective(toggleFigure) || initial;

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    let figure: Figure | undefined = toggleFigure;

    const next = toggleFigure.active && (!(toggleFigure instanceof Character) || !settingsManager.settings.activeSummons || !toggleFigure.summons.find((summon) => summon.active));
    if (next) {
      this.afterTurn(toggleFigure);
      figure = figures.find((other, otherIndex) => gameManager.gameplayFigure(other) && !other.off && otherIndex != index);

      if (!toggleFigure.off && toggleFigure instanceof Monster && toggleFigure.bb && toggleFigure.tags.indexOf('bb-elite') != -1) {
        if (!figure || figure.getInitiative() > toggleFigure.getInitiative()) {
          figure = toggleFigure;
        }
        gameManager.sortFigures();
      }
    }

    if (skipObjectives) {
      while (figure && gameManager.objectiveManager.skipObjective(figure)) {
        index = figures.indexOf(figure);
        this.turn(figure);
        this.afterTurn(figure);
        figure = figures.find((other, otherIndex) => gameManager.gameplayFigure(other) && !other.off && otherIndex != index);
      }
    }

    if (figure) {
      index = figures.indexOf(figure);
      for (let i = 0; i < figures.length; i++) {
        const other = figures[i];
        if (gameManager.gameplayFigure(other)) {
          if (i < index && i >= lastIndex && !other.off) {
            if (i > lastIndex) {
              this.beforeTurn(other);
              this.turn(other, true);
            }
            this.afterTurn(other);
          } else if (i == index) {
            if (!other.active) {
              this.beforeTurn(other);
            }
            this.turn(other);
          } else if (!next && i > index && i <= lastIndex) {
            this.beforeTurn(other);
          }
        }
      }
    }
  }


  beforeTurn(figure: Figure) {
    if (figure.off || figure.active) {
      figure.off = false;

      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = figure.active && !monsterEntity.off;
        });
      }

      gameManager.entityManager.entitiesAll(figure, false).forEach((entity) => {
        if (settingsManager.settings.applyConditions) {
          const killReset = (entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead;
          gameManager.entityManager.unapplyConditionsTurn(entity, figure);
          gameManager.entityManager.unapplyConditionsAfter(entity, figure);
          if (killReset && !entity.dead) {
            const identifier = gameManager.additionalIdentifier(figure, entity);
            let counter = gameManager.entityCounter(identifier);
            if (counter) {
              counter.killed--;
            }
          }
        }
      })

      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.restoreConditions(entity);
        }
      })

      if (figure instanceof Character) {
        if (figure.name == 'music-note' && figure.tags.indexOf('song_active') != -1) {
          figure.experience -= 1;
        }
      }
    } else if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        monsterEntity.active = figure.active;
        monsterEntity.off = false;
      });
    }

    if (figure instanceof Character && settingsManager.settings.activeSummons) {
      figure.summons.forEach((summon) => {
        if (summon.active) {
          summon.active = false;
        }
      });
    }

    if (figure instanceof Character && figure.longRest && settingsManager.settings.applyLongRest) {
      const healCondition = figure.entityConditions.find((condition) => condition.name == ConditionName.heal && condition.value && condition.expired);
      if (healCondition) {
        figure.entityConditions = figure.entityConditions.filter((condition) => condition != healCondition);
      }

      if (settingsManager.settings.characterItems) {
        figure.progress.equippedItems.forEach((identifier) => {
          if (identifier.tags) {
            const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
            identifier.tags = identifier.tags.filter((tag) => tag != ItemFlags.spent);
            if (item && item.spent) {
              identifier.tags = identifier.tags.filter((tag) => tag != ItemFlags.slot && tag != ItemFlags.slotBack);
            }
          }
        })
      }
    }

    if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
      figure.off = false;
    }
    figure.active = false;
  }

  turn(figure: Figure, skipSummons: boolean = false) {

    figure.active = true;

    if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        if (!figure.off && monsterEntity.summon != SummonState.new && gameManager.entityManager.isAlive(monsterEntity)) {
          monsterEntity.active = true;
        }
      });
    }

    if (figure instanceof Character && gameManager.entityManager.isAlive(figure)) {
      if (!skipSummons && settingsManager.settings.activeSummons) {
        const activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        const nextSummon = figure.summons.find((summon, index, self) => (!activeSummon || index > self.indexOf(activeSummon)) && gameManager.entityManager.isAlive(summon, true) && summon.tags.indexOf('prism_mode') == -1);

        figure.summons.slice(activeSummon ? figure.summons.indexOf(activeSummon) : 0, nextSummon ? figure.summons.indexOf(nextSummon) : figure.summons.length).forEach((prevSummon, index, self) => {
          prevSummon.active = false;
          if (settingsManager.settings.expireConditions) {
            gameManager.entityManager.expireConditions(prevSummon, figure);
          }
          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(prevSummon, true);
          }
          if (settingsManager.settings.applyConditions && (!activeSummon || index > 0)) {
            gameManager.entityManager.applyConditionsTurn(prevSummon, figure);
            gameManager.entityManager.applyConditionsAfter(prevSummon, figure);
          }
        })

        if (nextSummon) {
          nextSummon.active = true;
          if (settingsManager.settings.applyConditions) {
            gameManager.entityManager.applyConditionsTurn(nextSummon, figure);
          }
          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(nextSummon);
          }
          if (nextSummon.dead) {
            this.turn(figure);
          }
        } else {
          this.game.elementBoard.forEach((element) => {
            if (element.state == ElementState.new) {
              element.state = ElementState.strong;
            }
          })
          figure.summons.forEach((summon) => {
            if (summon.active) {
              summon.active = false;
            }
          });

          if (figure.name == 'lightning' && figure.tags.indexOf('blood-pact') != -1) {
            figure.health -= 1;
            gameManager.entityManager.checkHealth(figure, figure);
          }
        }
      } else {
        figure.summons.forEach((summon) => {
          summon.active = false;
          if (settingsManager.settings.applyConditions) {
            gameManager.entityManager.applyConditionsTurn(summon, figure);
          }
          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(summon);
          }
        })

        if (figure.name == 'lightning' && figure.tags.indexOf('blood-pact') != -1) {
          figure.health -= 1;
          gameManager.entityManager.checkHealth(figure, figure);
        }

      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state == ElementState.new) {
        element.state = ElementState.strong;
      }
    })

    if (!(figure instanceof Character) || skipSummons) {
      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.applyConditions) {
          gameManager.entityManager.applyConditionsTurn(entity, figure);
        }

        if (settingsManager.settings.scenarioRules) {
          gameManager.scenarioRulesManager.applyScenarioRulesTurn(entity);
        }
      })
    } else if (!skipSummons && !figure.summons.some((summon) => summon.active)) {
      if (settingsManager.settings.applyConditions) {
        gameManager.entityManager.applyConditionsTurn(figure, figure);
      }
      if (settingsManager.settings.scenarioRules) {
        gameManager.scenarioRulesManager.applyScenarioRulesTurn(figure);
      }
    }

    if (figure instanceof Character && (skipSummons || !figure.summons.some((summon) => summon.active))) {
      if (figure.name == 'music-note' && figure.tags.indexOf('song_active') != -1) {
        figure.experience += 1;
      }

      if (figure.name == 'prism' && figure.tags.indexOf('repair_mode') != -1 && figure.tags.indexOf('roundAction-repair_mode') == -1) {
        figure.health += 2;
        gameManager.entityManager.addCondition(figure, figure, new Condition(ConditionName.heal, 2));
        gameManager.entityManager.applyCondition(figure, figure, ConditionName.heal, true);
        figure.tags.push('roundAction-repair_mode');
      }
    }

    if (figure instanceof Character && settingsManager.settings.applyLongRest && figure.longRest && (skipSummons || !figure.summons.some((summon) => summon.active))) {
      if (figure.health < figure.maxHealth || figure.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.clearHeal) != -1 && !entityCondition.permanent)) {
        let heal = 2;

        if (figure.name == 'lightning' && figure.edition == 'fh-crossover' && figure.progress.perks[9]) {
          heal += 1;
        }

        figure.health += heal;
        gameManager.entityManager.addCondition(figure, figure, new Condition(ConditionName.heal, heal));
        gameManager.entityManager.applyCondition(figure, figure, ConditionName.heal, true);
      }
    }

    if (figure instanceof Character && !gameManager.entityManager.isAlive(figure) || figure instanceof Monster && figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)) || figure instanceof ObjectiveContainer && figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
      gameManager.roundManager.toggleFigure(figure);
    }
  }

  afterTurn(figure: Figure) {
    if (!figure.off) {
      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = false;
          monsterEntity.off = true;
        });
      }

      if (settingsManager.settings.activeSummons && figure instanceof Character) {
        let activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        while (activeSummon) {
          this.turn(figure);
          activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        }
      }

      if (figure instanceof Character && !settingsManager.settings.activeSummons) {
        figure.summons.forEach((summon) => {
          summon.active = false;
          if (gameManager.entityManager.isAlive(summon)) {
            if (settingsManager.settings.expireConditions) {
              gameManager.entityManager.expireConditions(summon, figure);
            }
            if (settingsManager.settings.applyConditions) {
              gameManager.entityManager.applyConditionsAfter(summon, figure);
            }

            if (settingsManager.settings.scenarioRules) {
              gameManager.scenarioRulesManager.applyScenarioRulesTurn(summon, true);
            }
          }
        })
      }

      if (figure instanceof Character && figure.name == 'fist' && figure.tags.indexOf('gift-of-the-mountain') != -1 && (figure.health < EntityValueFunction(figure.maxHealth, figure.level) || figure.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && !condition.permanent && !condition.expired))) {
        let heal = figure.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.heal);
        if (!heal) {
          heal = new EntityCondition(ConditionName.heal, 2);
          figure.entityConditions.push(heal);
        }
        heal.value = 2;
        heal.expired = false;
        heal.state = EntityConditionState.normal;
        figure.health += 2;
        gameManager.entityManager.applyCondition(figure, figure, ConditionName.heal, true);
      }

      if (figure instanceof Character && figure.name == 'shards' && figure.tags.indexOf('resonance_tokens') != -1 && figure.tokenValues[0] < 5) {
        figure.tokenValues[0] += 1;
      }

      if (figure instanceof Character) {
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.expireConditions(figure, figure);
        }

        if (settingsManager.settings.applyConditions) {
          gameManager.entityManager.applyConditionsAfter(figure, figure);
        }

        if (settingsManager.settings.scenarioRules) {
          gameManager.scenarioRulesManager.applyScenarioRulesTurn(figure, true);
        }
      } else {
        gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
          if (settingsManager.settings.expireConditions) {
            gameManager.entityManager.expireConditions(entity, figure);
          }

          if (settingsManager.settings.applyConditions) {
            gameManager.entityManager.applyConditionsAfter(entity, figure);
          }

          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(entity, true);
          }
        })
      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state == ElementState.new) {
        element.state = ElementState.strong;
      }
      if (element.state == ElementState.consumed || element.state == ElementState.partlyConsumed) {
        element.state = ElementState.inert;
      }
    })

    figure.off = true;
    figure.active = false;

    if (figure instanceof Monster && figure.bb && figure.tags.indexOf('bb-elite') != -1 && figure.tags.indexOf('roundAction-bb-elite') == -1) {
      figure.tags.push('roundAction-bb-elite');
      figure.ability += 1;
      if (figure.ability >= figure.abilities.length) {
        figure.ability = 0;
      }
      figure.off = false;
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
    this.game.state = GameState.draw;
    this.game.elementBoard.forEach((element) => element.state = ElementState.inert);
    gameManager.attackModifierManager.fromModel(this.game.monsterAttackModifierDeck, new AttackModifierDeck().toModel());
    gameManager.attackModifierManager.fromModel(this.game.allyAttackModifierDeck, new AttackModifierDeck().toModel());

    if (gameManager.bbRules()) {
      const editionData = gameManager.editionData.find((editionData) => editionData.edition == 'bb' && editionData.monsterAmTables && editionData.monsterAmTables.length);
      if (editionData) {
        const monsterDifficulty = gameManager.levelManager.bbMonsterDifficutly();
        this.game.monsterAttackModifierDeck = new AttackModifierDeck(editionData.monsterAmTables[monsterDifficulty].map((value) => new AttackModifier(value as AttackModifierType)), settingsManager.settings.bbAm);
      }
    }

    this.game.figures = this.game.figures.filter((figure) => figure instanceof Character || this.game.scenario && this.game.scenario.custom);
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

    this.game.figures.forEach((figure) => {
      figure.active = false;
      figure.off = false;
      if (figure instanceof Character) {
        if (figure.name == 'demolitionist' && figure.tags.find((tag) => tag === 'mech')) {
          const stat = figure.stats.find((stat) => stat.level == figure.level);
          if (stat) {
            figure.maxHealth = stat.health;
          }
        }

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
        figure.tokenValues[figure.primaryToken] = 0;
        figure.battleGoal = false;
        figure.battleGoals = [];
        figure.shield = undefined;
        figure.shieldPersistent = undefined;
        figure.retaliate = [];
        figure.retaliatePersistent = [];
        figure.scenarioStats = new ScenarioStats();

        if (gameManager.fhRules() && figure.tags.indexOf('new-character') != -1) {
          figure.progress.gold = 0;
        }

        figure.tags = figure.tags.filter((tag) => tag != 'new-character' && !figure.specialActions.find((specialAction) => specialAction.name == tag && specialAction.expire));

        if (figure.defaultIdentity != undefined) {
          figure.identity = figure.defaultIdentity;
        }

        if (figure.name == 'blinkblade' && figure.tags.find((tag) => tag === 'time_tokens') && figure.primaryToken == 0) {
          figure.tokenValues[0] += 1;
        }

        if (figure.name == 'kelp' && figure.tags.find((tag) => tag === 'trophy_tokens') && figure.primaryToken == 0) {
          figure.tokenValues[0] += 2;
        }

        if (figure.name == 'shards' && figure.tags.find((tag) => tag === 'resonance_tokens') && figure.primaryToken == 0) {
          figure.tokenValues[0] += 1;
        }

        if (figure.name == 'shards' && figure.tags.find((tag) => tag === 'extra_resonance_tokens') && figure.primaryToken == 0) {
          figure.tokenValues[0] += 2;
          gameManager.entityManager.addCondition(figure, figure, new Condition(ConditionName.brittle));
        }

        figure.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => gameManager.characterManager.createSpecialSummon(figure, summonData));

        figure.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(figure);
        figure.lootCardsVisible = false;

        figure.progress.equippedItems = figure.progress.equippedItems.filter((value) => value.marker != "loot-random-item");

        figure.progress.equippedItems.forEach((identifier) => identifier.tags = []);
        gameManager.characterManager.applyDonations(figure);
      } else if (figure instanceof Monster) {
        figure.entities = [];
        figure.ability = -1;
        figure.abilities = [];
        gameManager.monsterManager.resetMonsterAbilities(figure);
      } else if (figure instanceof ObjectiveContainer) {
        figure.entities = [];
      }
    })

    if (this.game.party.townGuardDeck) {
      const townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.game.party, gameManager.campaignData());
      gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
      townGuardDeck.active = false;
      this.game.party.townGuardDeck = townGuardDeck.toModel();
    }

    if (this.game.party.pets) {
      this.game.party.pets.forEach((value) => {
        value.lost = false;
      })
    }

    gameManager.trialsManager.applyTrialCards();

    gameManager.stateManager.standeeDialogCanceled = false;
    gameManager.uiChange.emit();
  }
}

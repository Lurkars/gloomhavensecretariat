import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Game } from "../model/Game";
import { EventCard, EventCardApplyEffects, EventCardCondition, EventCardConditionType, EventCardEffect, EventCardEffectType, EventCardIdentifier } from "../model/data/EventCard";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { Condition, ConditionName } from "../model/data/Condition";
import { Character } from "../model/Character";
import { AttackModifierType } from "../model/data/AttackModifier";
import { GameScenarioModel } from "../model/Scenario";

export class EventCardManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getEventCardsForEdition(edition: string, type: string): EventCard[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.events).filter((eventCard) => eventCard.type == type);
  }

  getEventCardForEdition(edition: string, type: string, cardId: string): EventCard | undefined {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.events).find((eventCard) => eventCard.type == type && eventCard.cardId == cardId);
  }

  buildPartyDeck(edition: string, type: string, migrate: boolean = false) {
    const campaignData = gameManager.campaignData(edition);
    if (migrate) {
      this.game.party.eventDecks[type] = [];
      // TODO: add migration with scenario rewards
    }

    if (campaignData && campaignData.events && campaignData.events[type]) {
      this.buildEventDeck(type, campaignData.events[type]);
    }
  }

  buildEventDeck(type: string, cardIds: string[]) {
    cardIds.forEach((cardId) => this.addEvent(type, cardId))
  }

  shuffleEvents(type: string) {
    ghsShuffleArray(this.game.party.eventDecks[type] || []);
  }

  addEvent(type: string, cardId: string) {
    if (!this.game.party.eventDecks[type]) {
      this.game.party.eventDecks[type] = [];
    }
    this.game.party.eventDecks[type].push(cardId);
    this.shuffleEvents(type);
  }

  returnEvent(type: string, cardId: string) {
    if (!this.game.party.eventDecks[type]) {
      this.game.party.eventDecks[type] = [];
    }
    this.removeEvent(type, cardId);
    this.game.party.eventDecks[type].push(cardId);
  }

  removeEvent(type: string, cardId: string) {
    if (!this.game.party.eventDecks[type]) {
      this.game.party.eventDecks[type] = [];
    }

    const index = this.game.party.eventDecks[type].indexOf(cardId);
    if (index != -1) {
      this.game.party.eventDecks[type].splice(index, 1);
    }
  }

  applyEvent(eventCard: EventCard, selected: number, subSelections: number[], scenario: boolean): (EventCardEffect | EventCardCondition)[] {
    let results: (EventCardEffect | EventCardCondition)[] = [];
    const option = eventCard.options[selected];
    let returnToDeck = false;
    let removeFromDeck = eventCard.edition == 'fh';
    if (option) {
      if (option.removeFromDeck) {
        removeFromDeck = true;
      } else if (option.returnToDeck) {
        returnToDeck = true;
      } else if (option.outcomes && subSelections) {
        subSelections.forEach((selection) => {
          const outcome = option.outcomes[selection];
          if (outcome) {
            if (outcome.removeFromDeck) {
              removeFromDeck = true;
            } else if (outcome.returnToDeck) {
              returnToDeck = true;
            }
          }
        })
      }

      if (settingsManager.settings.eventsApply) {
        results.push(...this.applyEventOutcomes(eventCard, selected, subSelections, false));
        if (scenario) {
          results.push(...this.applyEventOutcomes(eventCard, selected, subSelections, true));
        }
      }
    }

    if (!returnToDeck && !removeFromDeck || !option) {
      console.warn("Apply event without valid selection", eventCard, selected, subSelections);
    } else if (returnToDeck) {
      this.returnEvent(eventCard.type, eventCard.cardId);
    } else {
      this.removeEvent(eventCard.type, eventCard.cardId);
    }

    this.game.party.eventCards.push(new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, selected, subSelections, !scenario));

    return results;
  }

  applyEventOutcomes(eventCard: EventCard, selected: number, subSelections: number[] = [], scenario: boolean = false): (EventCardEffect | EventCardCondition)[] {
    let results: (EventCardEffect | EventCardCondition)[] = [];
    const option = eventCard.options[selected];

    // apply effects
    if (option && option.outcomes) {
      option.outcomes.forEach((outcome, i) => {
        if (!outcome.condition || subSelections && subSelections.indexOf(i) != -1) {
          if (outcome.condition) {
            const conditionResult = this.applyCondition(outcome.condition);
            if (conditionResult) {
              results.push(conditionResult);
            }
          }
          results.push(... this.applyEffects(eventCard, outcome.effects.filter((e) => typeof e !== 'string'), scenario));
        }
      })
    }

    return results;
  }

  applyEffects(eventCard: EventCard, effects: EventCardEffect[], scenario: boolean): (EventCardEffect | EventCardCondition)[] {
    let results: (EventCardEffect | EventCardCondition)[] = [];
    effects.forEach((effect) => {
      if (EventCardApplyEffects.indexOf(effect.type) != -1 && (!effect.condition || this.resolvableCondition(effect.condition))) {
        let characters = gameManager.characterManager.getActiveCharacters();
        if (effect.condition) {
          const conditionResult = this.applyCondition(effect.condition);
          if (conditionResult) {
            results.push(conditionResult);
          }

          if (typeof effect.condition !== 'string' && effect.condition.type == EventCardConditionType.character) {
            characters = characters.filter((c) => (effect.condition as EventCardCondition).values.indexOf(c.name) != -1);
          }
        }
        if (scenario) {
          switch (effect.type) {
            case EventCardEffectType.scenarioCondition:
              if (effect.values) {
                effect.values.filter((value) => typeof value === 'string').forEach((value) => {
                  const condition = value.split(':')[0] as ConditionName;
                  if (condition != ConditionName.bless && condition != ConditionName.curse) {
                    characters.forEach((c) => {
                      gameManager.entityManager.addCondition(c, c, new Condition(condition));
                    })
                  } else if (condition == ConditionName.curse) {
                    const count = value.split(':')[1] ? +value.split(':')[1] : 1;
                    for (let i = 0; i < count; i++) {
                      characters.forEach((c) => {
                        if (gameManager.attackModifierManager.countUpcomingCurses(false) < 10) {
                          gameManager.attackModifierManager.addModifierByType(c.attackModifierDeck, AttackModifierType.curse);
                        }
                      })
                    }
                  } else if (condition == ConditionName.bless) {
                    const count = value.split(':')[1] ? +value.split(':')[1] : 1;
                    for (let i = 0; i < count; i++) {
                      characters.forEach((c) => {
                        if (gameManager.attackModifierManager.countUpcomingBlesses() < 10) {
                          gameManager.attackModifierManager.addModifierByType(c.attackModifierDeck, AttackModifierType.bless);
                        }
                      })
                    }
                  }
                })
              }
              break;
            case EventCardEffectType.scenarioDamage:
              const damage = +effect.values[0];
              if (damage) {
                characters.forEach((c) => {
                  gameManager.entityManager.changeHealth(c, c, -damage, true);
                })
              }
              break;
            case EventCardEffectType.scenarioSingleMinus1:
              const minus1 = +effect.values[0];
              if (minus1) {
                for (let i = 0; i < minus1; i++) {
                  characters.forEach((c) => {
                    if (gameManager.attackModifierManager.countExtraMinus1() < 15) {
                      gameManager.attackModifierManager.addModifierByType(c.attackModifierDeck, AttackModifierType.minus1extra);
                    }
                  })
                }
              }
              break;
          }

        } else {
          switch (effect.type) {
            case EventCardEffectType.battleGoal:
              characters.forEach((c) => {
                c.progress.battleGoals += +effect.values[0];
              })
              break;
            case EventCardEffectType.campaignSticker:
              this.game.party.campaignStickers.push(...effect.values.filter((v) => typeof v === 'string'));
              break
            case EventCardEffectType.drawAnotherEvent:
            case EventCardEffectType.drawEvent:
              this.game.eventDraw = effect.values[0] as string;
              break;
            case EventCardEffectType.event:
            case EventCardEffectType.eventFH:
              this.addEvent(effect.values[0] as string, effect.values[1] as string);
              break;
            case EventCardEffectType.experience:
              characters.forEach((c) => {
                c.progress.experience += +effect.values[0];
              })
              break;
            case EventCardEffectType.globalAchievement:
              this.game.party.globalAchievementsList.push(...effect.values.filter((v) => typeof v === 'string'));
              break
            case EventCardEffectType.gold:
            case EventCardEffectType.goldAdditional:
              characters.forEach((c) => {
                c.progress.gold += +effect.values[0];
              })
              break;
            case EventCardEffectType.inspiration:
              this.game.party.inspiration += +effect.values[0];
              break;
            case EventCardEffectType.loseBattleGoal:
              characters.forEach((c) => {
                c.progress.battleGoals -= +effect.values[0];
                if (c.progress.battleGoals < 0) {
                  c.progress.battleGoals = 0;
                }
              })
              break;
            case EventCardEffectType.loseGold:
              characters.forEach((c) => {
                c.progress.gold -= +effect.values[0];
                if (c.progress.gold < 0) {
                  c.progress.gold = 0;
                }
              })
              break;
            case EventCardEffectType.loseMorale:
              this.game.party.morale -= +effect.values[0];
              if (this.game.party.morale < 0) {
                this.game.party.morale = 0;
              }
              break;
            case EventCardEffectType.loseProsperity:
              this.game.party.prosperity -= +effect.values[0];
              if (this.game.party.prosperity < 0) {
                this.game.party.prosperity = 0;
              }
              break;
            case EventCardEffectType.loseReputation:
              this.game.party.reputation -= effect.values[0] as number;
              if (this.game.party.reputation < -20) {
                this.game.party.reputation = -20;
              }
              break;
            case EventCardEffectType.morale:
              this.game.party.morale += +effect.values[0];
              if (this.game.party.morale > 20) {
                this.game.party.morale = 20;
              }
              break;
            case EventCardEffectType.removeEvent:
            case EventCardEffectType.removeEventFH:
              this.removeEvent(effect.values[0] as string, effect.values[1] as string);
              break;
            case EventCardEffectType.reputation:
            case EventCardEffectType.reputationAdditional:
              this.game.party.reputation += effect.values[0] as number;
              if (this.game.party.reputation > 20) {
                this.game.party.reputation = 20;
              }
              break;
            case EventCardEffectType.partyAchievement:
              this.game.party.achievementsList.push(...effect.values.filter((v) => typeof v === 'string'));
              break
            case EventCardEffectType.prosperity:
              this.game.party.prosperity += +effect.values[0];
              break;
            case EventCardEffectType.scenarioCondition:
            case EventCardEffectType.scenarioDamage:
            case EventCardEffectType.scenarioSingleMinus1:
              break;
            case EventCardEffectType.soldier:
            case EventCardEffectType.soldiers:
              this.game.party.soldiers += +(effect.values[0] || 1);
              if (this.game.party.soldiers > 10) {
                this.game.party.soldiers = 10;
              }
              break;
            case EventCardEffectType.unlockScenario:
            case EventCardEffectType.unlockScenarioGroup:
              const index = effect.values[0] as string;
              const group = effect.values[1] ? effect.values[1] as string : "";
              this.game.party.manualScenarios.push(new GameScenarioModel(index, eventCard.edition, group));
              break;
            default:
              results.push(effect);
              break;
          }
        }
      } else if (effect.type != EventCardEffectType.noEffect) {
        if (!scenario) {
          results.push(effect);
        }
        console.warn("Missing implementation for applying effect", effect, scenario);
      }
    })

    return results;
  }

  applyCondition(condition: string | EventCardCondition): EventCardCondition | undefined {
    if (typeof condition !== 'string') {
      switch (condition.type) {
        case EventCardConditionType.character:
        case EventCardConditionType.trait:
        case EventCardConditionType.otherwise:
          break;
        default:
          console.warn("Missing implementation for applying condition", condition);
          return condition;
      }
    }
    return undefined;
  }

  resolvableCondition(condition: string | EventCardCondition): boolean {
    if (typeof condition === 'string') {
      return true;
    }

    switch (condition.type) {
      case EventCardConditionType.character:
        return condition.values && this.game.figures.some((figure) => figure instanceof Character && condition.values.indexOf(figure.name) != -1);
      case EventCardConditionType.otherwise:
        return true;
      case EventCardConditionType.reputationGT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.reputation > condition.values[0];
      case EventCardConditionType.reputationLT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.reputation < condition.values[0];
      case EventCardConditionType.trait:
        return condition.values && this.game.figures.some((figure) => figure instanceof Character && figure.traits.some((trait) => condition.values.indexOf(trait) != -1));
      case EventCardConditionType.payGold:
        return condition.values && this.game.figures.filter((figure) => figure instanceof Character && gameManager.gameplayFigure(figure) && !figure.absent).every((figure) => typeof condition.values[0] === 'number' && (figure as Character).progress.gold >= condition.values[0]);
      case EventCardConditionType.payCollectiveGold:
        return condition.values && typeof condition.values[0] === 'number' && this.game.figures.filter((figure) => figure instanceof Character && gameManager.gameplayFigure(figure) && !figure.absent).map((figure) => (figure as Character).progress.gold).reduce((a, b) => a + b) >= condition.values[0];
      case EventCardConditionType.loseCollectiveResource:
      case EventCardConditionType.payCollectiveItem:
      default:
        return false;
    }
  }

}

import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Game } from "../model/Game";
import { EventCard, EventCardApplyEffects, EventCardEffect, EventCardEffectType, EventCardIdentifier } from "../model/data/EventCard";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { Condition, ConditionName } from "../model/data/Condition";
import { Character } from "../model/Character";
import { AttackModifierType } from "../model/data/AttackModifier";

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

  applyEvent(eventCard: EventCard, selected: number, subSelections: number[], scenario: boolean) {
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
        this.applyEventOutcomes(eventCard, selected, subSelections, false);
        if (scenario) {
          this.applyEventOutcomes(eventCard, selected, subSelections, true);
        }
      }
    }

    if (!returnToDeck && !removeFromDeck || !option) {
      console.warn("Apply event without valid selection", eventCard, selected);
    } else if (returnToDeck) {
      this.returnEvent(eventCard.type, eventCard.cardId);
    } else {
      this.removeEvent(eventCard.type, eventCard.cardId);
    }

    this.game.party.eventCards.push(new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, selected, subSelections, !scenario));
  }

  applyEventOutcomes(eventCard: EventCard, selected: number, subSelections: number[] = [], scenario: boolean = false) {
    const option = eventCard.options[selected];

    // apply effects
    if (option && option.outcomes) {
      option.outcomes.forEach((outcome, i) => {
        if (!subSelections || subSelections.length == 0 || subSelections.indexOf(i) != -1) {
          this.applyEffects(outcome.effects.filter((e) => typeof e !== 'string'), scenario);
        }
      })
    }
  }

  applyEffects(effects: EventCardEffect[], scenario: boolean) {
    effects.forEach((effect) => {
      if (EventCardApplyEffects.indexOf(effect.type) != -1) {
        if (scenario) {
          switch (effect.type) {
            case EventCardEffectType.scenarioCondition:
              if (effect.values) {
                effect.values.filter((value) => typeof value === 'string').forEach((value) => {
                  const condition = value.split(':')[0] as ConditionName;
                  if (condition != ConditionName.bless && condition != ConditionName.curse) {
                    this.game.figures.forEach((figure) => {
                      if (figure instanceof Character) {
                        gameManager.entityManager.addCondition(figure, figure, new Condition(condition));
                      }
                    })
                  } else if (condition == ConditionName.curse) {
                    const count = value.split(':')[1] ? +value.split(':')[1] : 1;
                    for (let i = 0; i < count; i++) {
                      this.game.figures.forEach((figure) => {
                        if (figure instanceof Character && gameManager.attackModifierManager.countUpcomingCurses(false) < 10) {
                          gameManager.attackModifierManager.addModifierByType(figure.attackModifierDeck, AttackModifierType.curse);
                        }
                      })
                    }
                  } else if (condition == ConditionName.bless) {
                    const count = value.split(':')[1] ? +value.split(':')[1] : 1;
                    for (let i = 0; i < count; i++) {
                      this.game.figures.forEach((figure) => {
                        if (figure instanceof Character && gameManager.attackModifierManager.countUpcomingBlesses() < 10) {
                          gameManager.attackModifierManager.addModifierByType(figure.attackModifierDeck, AttackModifierType.bless);
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
                this.game.figures.forEach((figure) => {
                  if (figure instanceof Character) {
                    gameManager.entityManager.changeHealth(figure, figure, -damage, true);
                  }
                })
              }
              break;
            case EventCardEffectType.scenarioSingleMinus1:
              const minus1 = +effect.values[0];
              if (minus1) {
                for (let i = 0; i < minus1; i++) {
                  this.game.figures.forEach((figure) => {
                    if (figure instanceof Character && gameManager.attackModifierManager.countExtraMinus1() < 15) {
                      gameManager.attackModifierManager.addModifierByType(figure.attackModifierDeck, AttackModifierType.minus1extra);
                    }
                  })
                }
              }
              break;
          }

        } else {
          switch (effect.type) {
            case EventCardEffectType.drawAnotherEvent:
            case EventCardEffectType.drawEvent:
              this.game.eventDraw = effect.values[0] as string;
              break;
          }
        }
      } else if (effect.type != EventCardEffectType.noEffect) {
        console.warn("Missing implementation for applying effect", effect, scenario);
      }
    })
  }

}

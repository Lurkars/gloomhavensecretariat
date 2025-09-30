import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { BuildingModel } from "../model/Building";
import { Game } from "../model/Game";
import { GameScenarioModel } from "../model/Scenario";
import { AttackModifierType } from "../model/data/AttackModifier";
import { Condition, ConditionName } from "../model/data/Condition";
import { EventCard, EventCardAttack, EventCardCondition, EventCardConditionType, EventCardEffect, EventCardEffectType, EventCardIdentifier } from "../model/data/EventCard";
import { LootType } from "../model/data/Loot";
import { TreasureData, TreasureRewardType } from "../model/data/RoomData";
import { ScenarioData } from "../model/data/ScenarioData";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export const EventCardApplyEffects: EventCardEffectType[] = [EventCardEffectType.additionally, EventCardEffectType.and, EventCardEffectType.battleGoal, EventCardEffectType.campaignSticker, EventCardEffectType.campaignStickerMap, EventCardEffectType.campaignStickerReplace, EventCardEffectType.drawAnotherEvent, EventCardEffectType.drawEvent, EventCardEffectType.event, EventCardEffectType.eventReturn, EventCardEffectType.eventsToTop, EventCardEffectType.experience, EventCardEffectType.globalAchievement, EventCardEffectType.gold, EventCardEffectType.goldAdditional, EventCardEffectType.inspiration, EventCardEffectType.loseBattleGoal, EventCardEffectType.loseGold, EventCardEffectType.loseMorale, EventCardEffectType.loseProsperity, EventCardEffectType.loseReputation, EventCardEffectType.morale, EventCardEffectType.partyAchievement, EventCardEffectType.prosperity, EventCardEffectType.removeEvent, EventCardEffectType.reputation, EventCardEffectType.reputationAdditional, EventCardEffectType.resource, EventCardEffectType.scenarioCondition, EventCardEffectType.scenarioDamage, EventCardEffectType.scenarioSingleMinus1, EventCardEffectType.sectionWeek, EventCardEffectType.sectionWeeks, EventCardEffectType.sectionWeekSeasonFinal, EventCardEffectType.sectionWeeksSeason, EventCardEffectType.soldier, EventCardEffectType.soldiers, EventCardEffectType.townGuardDeckCard, EventCardEffectType.townGuardDeckCardRemove, EventCardEffectType.townGuardDeckCardRemovePermanently, EventCardEffectType.townGuardDeckCards, EventCardEffectType.unlockEnvelope, EventCardEffectType.unlockScenario, EventCardEffectType.unlockScenarioGroup, EventCardEffectType.upgradeBuilding, EventCardEffectType.wreckBuilding];

export class EventCardManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getEventTypesForEdition(edition: string, extension: boolean = true): string[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || extension && gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.events).flatMap((event) => event.type).filter((type, index, self) => index == self.indexOf(type));
  }

  getEventCardsForEdition(edition: string, type: string, extension: boolean = true): EventCard[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || extension && gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.events).filter((eventCard) => eventCard.type == type);
  }

  getEventCardForEdition(edition: string, type: string, cardId: string): EventCard | undefined {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.events).find((eventCard) => eventCard.type == type && eventCard.cardId == cardId);
  }

  buildPartyDeck(edition: string, type: string) {
    const campaignData = gameManager.campaignData(edition);

    if (campaignData && campaignData.events && campaignData.events[type]) {
      this.buildEventDeck(type, campaignData.events[type]);
    }
  }

  buildPartyDeckMigration(edition: string) {
    if (!this.game.party.eventDecks || !Object.keys(this.game.party.eventDecks).length) {
      const campaignData = gameManager.campaignData(edition);
      if (campaignData.events) {
        Object.keys(campaignData.events).forEach((eventType) => {
          if (campaignData.events[eventType] && campaignData.events[eventType].length) {
            this.buildPartyDeck(edition || gameManager.currentEdition(), eventType);
            console.debug("Build " + eventType + " Event Deck");
          }
        })

        if (this.game.party.eventDecks && Object.keys(this.game.party.eventDecks).length) {

          this.game.party.scenarios.filter((s) => s.edition == edition || gameManager.editionExtensions(edition).indexOf(s.edition) != -1).map((s) => gameManager.scenarioManager.getScenario(s.index, s.edition, s.group)).forEach((scenarioData) => this.buildPartyDeckMigrationScenarioHelper(scenarioData));

          this.game.party.conclusions.filter((s) => s.edition == edition || gameManager.editionExtensions(edition).indexOf(s.edition) != -1).map((s) => gameManager.scenarioManager.getSection(s.index, s.edition, s.group, true)).forEach((scenarioData) => this.buildPartyDeckMigrationScenarioHelper(scenarioData));

          this.game.unlockedCharacters.map((unlock) => gameManager.getCharacterData(unlock.split(':')[1], unlock.split(':')[0])).forEach((characterData) => {
            if (characterData.unlockEvent) {
              characterData.unlockEvent.split('|').forEach((unlockEvent) => {
                if (unlockEvent.split(':').length > 1) {
                  this.addEvent(unlockEvent.split(':')[0], unlockEvent.split(':')[1], true)
                } else {
                  this.addEvent('city', unlockEvent, true);
                  this.addEvent('road', unlockEvent, true);
                }
              })
            }
          })

          this.game.party.retirements.map((c) => gameManager.getCharacterData(c.name, c.edition)).forEach((characterData) => {
            if (characterData.retireEvent) {
              characterData.retireEvent.split('|').forEach((retireEvent) => {
                if (retireEvent.split(':').length > 1) {
                  this.addEvent(retireEvent.split(':')[0], retireEvent.split(':')[1], true)
                } else {
                  this.addEvent('city', retireEvent, true);
                  this.addEvent('road', retireEvent, true);
                }
              })
            }
          })

          let treasures = gameManager.editionData.filter((editionData) => editionData.treasures && editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1).flatMap((editionData) => editionData.treasures.map((treasure, i) => new TreasureData(treasure, i + 1 + editionData.treasureOffset || 0)));

          this.game.party.treasures.forEach((id) => {
            if (id.edition == edition || gameManager.editionExtensions(edition).indexOf(id.edition) != -1) {
              const treasure = treasures.find((treasureData) => treasureData.index == +id.name);
              if (treasure && treasure.rewards) {
                treasure.rewards.forEach((reward) => {
                  if (reward.type == TreasureRewardType.event) {
                    if (typeof reward.value === 'string' && reward.value.split('-').length > 1) {
                      this.addEvent(reward.value.split('-')[0], reward.value.split('-')[1], true);
                    }
                  }
                })
              }
            }
          })

          console.debug("Migrated event decks");
        }
      }
    }
  }

  buildPartyDeckMigrationScenarioHelper(scenarioData: ScenarioData | undefined) {
    if (scenarioData && scenarioData.rewards) {
      if (scenarioData.rewards.events) {
        scenarioData.rewards.events.forEach((event) => {
          if (event.split(':').length > 1) {
            this.addEvent(event.split(':')[0], event.split(':')[1], true)
          }
        })
      }

      if (scenarioData.rewards.eventDecks) {
        scenarioData.rewards.eventDecks.forEach((eventDeck) => {
          const type = eventDeck.split(':')[0];
          const events = gameManager.eventCardManager.getEventCardsForEdition(scenarioData.edition, type);
          const startEvent = events.find((e) => scenarioData.rewards && e.cardId == eventDeck.split(':')[1].split('|')[0]);
          const endEvent = events.find((e) => scenarioData.rewards && e.cardId == eventDeck.split(':')[1].split('|')[1]);
          if (startEvent && endEvent) {
            gameManager.eventCardManager.buildEventDeck(type, events.slice(events.indexOf(startEvent), events.indexOf(endEvent) + 1).map((e) => e.cardId));
          } else {
            console.warn("Could not find start and end for: " + eventDeck);
          }
        })
      }
    }
  }

  buildEventDeck(type: string, cardIds: string[]) {
    cardIds.forEach((cardId) => this.addEvent(type, cardId))
  }

  shuffleEvents(type: string) {
    ghsShuffleArray(this.game.party.eventDecks[type] || []);
  }

  addEvent(type: string, cardId: string, newOnly: boolean = false) {
    const edition = (this.game.edition || gameManager.currentEdition());
    if (this.getEventCardForEdition(edition, type, cardId) != undefined) {
      if (!this.game.party.eventDecks[type]) {
        this.game.party.eventDecks[type] = [];
      }

      if (this.game.party.eventDecks[type].indexOf(cardId) == -1 && (!newOnly || !this.game.party.eventCards.find((e) => e.type == type && e.cardId == cardId && e.edition == edition))) {
        this.game.party.eventDecks[type].push(cardId);
        this.shuffleEvents(type);
      }
    } else {
      console.warn("Could not find " + type + " Event " + cardId + "for Edition " + edition);
    }
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

  applyEvent(eventCard: EventCard, selected: number, subSelections: number[], checks: number[], scenario: boolean, attack: boolean, apply: boolean): (EventCardEffect | EventCardCondition | EventCardAttack)[] {
    let results: (EventCardEffect | EventCardCondition | EventCardAttack)[] = [];
    const option = eventCard.options[selected];
    let returnToDeck = false;
    let removeFromDeck = ['fh', 'jotl'].indexOf(eventCard.edition) != -1; // default to remove from deck for JOTL and FH
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

      if (settingsManager.settings.eventsApply && apply) {
        results.push(...this.applyEventOutcomes(eventCard, selected, subSelections, false));

        if (scenario) {
          results.push(...this.applyEventOutcomes(eventCard, selected, subSelections, true));
        }

        if (attack) {
          eventCard.options.filter((option) => !option.label && option.outcomes).forEach((option) => {
            option.outcomes.forEach((outcome) => {
              if (outcome.attack) {
                results.push(outcome.attack);
                if (outcome.attack.effects) {
                  results.push(... this.applyEffects(eventCard, outcome.attack.effects, scenario));
                }
              }
            })
          })
        }
      }
    }

    if (!returnToDeck && ['fh'].indexOf(eventCard.edition) != -1) {
      returnToDeck = eventCard.options.some((o) => !o.label && o.returnToDeck);
    }

    if (!returnToDeck && !removeFromDeck) {
      if (apply && !option) {
        console.warn("Apply event without valid selection", eventCard, selected, subSelections);
      } else {
        console.warn("No remove or return for event", eventCard, selected, subSelections);
      }
    } else if (returnToDeck) {
      this.returnEvent(eventCard.type, eventCard.cardId);
    } else {
      this.removeEvent(eventCard.type, eventCard.cardId);
    }

    this.game.party.eventCards.push(new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, selected, subSelections, checks, attack, !scenario));

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
          if (outcome.effects) {
            results.push(... this.applyEffects(eventCard, outcome.effects, scenario));
          }
        }
      })
    }

    return results;
  }

  applicableEffect(effect: EventCardEffect): boolean {
    return EventCardApplyEffects.indexOf(effect.type) != -1;
  }

  applyEffects(eventCard: EventCard, effects: (string | EventCardEffect)[], scenario: boolean): (EventCardEffect | EventCardCondition)[] {
    let results: (EventCardEffect | EventCardCondition)[] = [];
    effects.forEach((effect) => {
      if (typeof effect === 'string') {
        results.push(new EventCardEffect(EventCardEffectType.custom, [effect]));
      } else {
        if (this.applicableEffect(effect) && (!effect.condition || this.resolvableCondition(effect.condition))) {
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

          if (effect.type == EventCardEffectType.and || effect.type == EventCardEffectType.additionally) {
            results.push(...this.applyEffects(eventCard, effect.values.filter((e) => typeof e !== 'number' && typeof e !== 'string'), scenario));
          } else if (scenario) {
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
              case EventCardEffectType.campaignStickerMap: {
                const section = gameManager.scenarioManager.getSection(effect.values[0] as string, eventCard.edition, undefined, true);
                if (section) {
                  this.game.party.conclusions.push(new GameScenarioModel(section.index, section.edition, section.group));
                }
                break;
              }
              case EventCardEffectType.campaignStickerReplace:
                this.game.party.campaignStickers.splice(this.game.party.campaignStickers.indexOf(effect.values[1] as string, 1));
                this.game.party.campaignStickers.push(effect.values[0] as string);
                break
              case EventCardEffectType.drawAnotherEvent:
              case EventCardEffectType.drawEvent:
                this.game.eventDraw = effect.values[0] as string;
                break;
              case EventCardEffectType.event:
              case EventCardEffectType.eventReturn:
                this.addEvent(effect.values[0] as string, effect.values[1] as string);
                break;
              case EventCardEffectType.eventsToTop: {
                const deck = this.game.party.eventDecks[effect.values[0] as string];
                const card = deck ? deck.find((cardId) => effect.values.indexOf(cardId) != -1) : undefined;
                if (deck && card) {
                  const index = deck.indexOf(card);
                  deck.splice(index, 1);
                  deck.unshift(card);
                }
                break;
              }
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
              case EventCardEffectType.loseExperience:
                characters.forEach((c) => {
                  c.progress.experience -= +effect.values[0];
                  if (c.progress.experience < 0) {
                    c.progress.experience = 0;
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
                this.removeEvent(effect.values[0] as string, effect.values[1] as string);
                break;
              case EventCardEffectType.reputation:
              case EventCardEffectType.reputationAdditional:
                this.game.party.reputation += effect.values[0] as number;
                if (this.game.party.reputation > 20) {
                  this.game.party.reputation = 20;
                }
                break;
              case EventCardEffectType.resource:
                characters.forEach((c) => {
                  c.progress.loot[effect.values[1] as LootType] = (c.progress.loot[effect.values[1] as LootType] || 0) + (+effect.values[0]);
                })
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
              case EventCardEffectType.sectionWeek:
              case EventCardEffectType.sectionWeeks: {
                const week = this.game.party.weeks + (effect.values[1] ? +effect.values[1] : 1);
                const section = effect.values[0] as string;
                this.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), section];
                break;
              }
              case EventCardEffectType.sectionWeekSeasonFinal: {
                const section = effect.values[0] as string;
                const season = effect.values[1] as string;
                const isSummer = Math.max(this.game.party.weeks - 1, 0) % 20 < 10;
                let week = 0;
                if (isSummer) {
                  week = Math.floor(this.game.party.weeks / 10) + (season == 'summer' ? 3 : 2);
                } else {
                  week = Math.floor(this.game.party.weeks / 10) + (season == 'winter' ? 3 : 2);
                }
                this.game.party.weekSections[week * 10] = [...(gameManager.game.party.weekSections[week * 10] || []), section];
                break;
              }
              case EventCardEffectType.sectionWeeksSeason: {
                const section = effect.values[0] as string;
                const season = effect.values[2] as string;
                let week = this.game.party.weeks + (effect.values[1] ? +effect.values[1] : 1);
                const summer = Math.max(week - 1, 0) % 20 < 10;
                if (summer && season == 'summer' || !summer && season == 'winter') {
                  week = week - (Math.max(week - 1, 0) % 20) + (+effect.values[3]) + 19;
                }
                this.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), section];
                break;
              }
              case EventCardEffectType.soldier:
              case EventCardEffectType.soldiers:
                this.game.party.soldiers += +(effect.values[0] || 1);
                if (this.game.party.soldiers > 10) {
                  this.game.party.soldiers = 10;
                }
                break;
              case EventCardEffectType.townGuardDeckCard:
              case EventCardEffectType.townGuardDeckCards: {
                if (this.game.party.townGuardDeck) {
                  const count = effect.values[1] ? +effect.values[1] : 1;
                  for (let i = 0; i < count; i++) {
                    this.game.party.townGuardDeck.cards.push(effect.values[0] as string);
                    this.game.party.townGuardDeck.current = -1;
                    ghsShuffleArray(this.game.party.townGuardDeck.cards);
                  }
                }
                break;
              }
              case EventCardEffectType.townGuardDeckCardRemove:
              case EventCardEffectType.townGuardDeckCardRemovePermanently: {
                if (this.game.party.townGuardDeck) {
                  const card = this.game.party.townGuardDeck.cards.find((value) => value == (effect.values[0] as string));
                  if (card) {
                    this.game.party.townGuardDeck.cards.splice(this.game.party.townGuardDeck.cards.indexOf(card), 1);
                  }
                }
                break;
              }
              case EventCardEffectType.unlockEnvelope: {
                if (eventCard.edition == 'fh') {
                  const building = gameManager.campaignData(eventCard.edition).buildings.find((building) => building.id == effect.values[0]);
                  if (building) {
                    if (this.game.party.buildings.find((model) => model.name == building.name) == undefined) {
                      this.game.party.buildings.push(new BuildingModel(building.name, 0));
                    }
                  } else {
                    console.warn("Building not found to apply event effect", effect, scenario);
                    results.push(effect);
                  }
                } else {
                  console.warn("Building not found to apply event effect", effect, scenario);
                  results.push(effect);
                }
                break;
              }
              case EventCardEffectType.unlockScenario:
              case EventCardEffectType.unlockScenarioGroup: {
                const index = effect.values[0] as string;
                const group = effect.values[1] ? effect.values[1] as string : "";
                this.game.party.manualScenarios.push(new GameScenarioModel(index, eventCard.edition, group));
                break;
              }
              case EventCardEffectType.upgradeBuilding: {
                const building = this.game.party.buildings.find((model) => model.name == effect.values[0] as string);
                if (building) {
                  if (building.level >= +effect.values[1]) {
                    this.game.party.morale += +effect.values[2];
                  } else {
                    building.level += 1;
                  }
                } else {
                  console.warn("Building not found to apply event effect", effect, scenario);
                  results.push(effect);
                }
                break;
              }
              case EventCardEffectType.wreckBuilding: {
                const buildingName = effect.values[0] as string;
                const building = this.game.party.buildings.find((value) => value.name == buildingName);
                if (building) {
                  building.state = "wrecked";
                }
                break;
              }
              default:
                results.push(effect);
                break;
            }
          }
        } else if (effect.type != EventCardEffectType.noEffect) {
          if (!scenario) {
            results.push(effect);
          }
          if (effect.type != EventCardEffectType.outpostAttack && effect.type != EventCardEffectType.outpostTarget) {
            console.warn("Missing implementation for applying effect", effect, scenario);
          }
        }
      }
    })

    return results;
  }

  applyCondition(condition: string | EventCardCondition): EventCardCondition | undefined {
    if (typeof condition !== 'string') {
      switch (condition.type) {
        case EventCardConditionType.and:
          condition.values.filter((c) => typeof c !== 'number').forEach((c) => {
            this.applyCondition(c)
          });
          return condition;
        case EventCardConditionType.building:
        case EventCardConditionType.campaignSticker:
        case EventCardConditionType.character:
        case EventCardConditionType.moraleGT:
        case EventCardConditionType.moraleLT:
        case EventCardConditionType.otherwise:
        case EventCardConditionType.reputationGT:
        case EventCardConditionType.reputationLT:
        case EventCardConditionType.season:
        case EventCardConditionType.seasonLT:
        case EventCardConditionType.traits:
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
    let characters = gameManager.characterManager.getActiveCharacters();
    switch (condition.type) {
      case EventCardConditionType.and:
        return condition.values && condition.values.every((value) => typeof value !== 'number' && this.resolvableCondition(value));
      case EventCardConditionType.building:
        return condition.values && condition.values.every((value) => typeof value === 'string' && this.game.party.buildings && this.game.party.buildings.find((model) => model.level && model.name == value));
      case EventCardConditionType.campaignSticker:
        return this.game.party.campaignStickers.indexOf(condition.values[0] as string) != -1;
      case EventCardConditionType.character:
        return condition.values && characters.some((c) => condition.values.indexOf(c.name) != -1);
      case EventCardConditionType.class:
        return condition.values && characters.some((c) => condition.values.indexOf(c.characterClass as string) != -1);
      case EventCardConditionType.moraleGT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.morale > condition.values[0];
      case EventCardConditionType.moraleLT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.morale < condition.values[0];
      case EventCardConditionType.otherwise:
        return true;
      case EventCardConditionType.reputationGT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.reputation > condition.values[0];
      case EventCardConditionType.reputationLT:
        return condition.values && typeof condition.values[0] === 'number' && this.game.party.reputation < condition.values[0];
      case EventCardConditionType.season:
        return Math.max(this.game.party.weeks - 1, 0) % 20 < 10 ? condition.values[0] == 'summer' : condition.values[0] == 'winter';
      case EventCardConditionType.seasonLT:
        if (condition.values[0] == 'summer') {
          return Math.max(this.game.party.weeks + (+condition.values[1]) - 1, 0) % 20 < 10;
        } else if (condition.values[0] == 'winter') {
          return Math.max(this.game.party.weeks + (+condition.values[1]) - 1, 0) % 20 >= 10;
        }
        return false;
      case EventCardConditionType.traits:
        return condition.values && characters.some((c) => c.traits.some((trait) => condition.values.indexOf(trait) != -1) || condition.values.indexOf(c.characterClass as string) != -1);
      case EventCardConditionType.payGold:
        return condition.values && characters.every((c) => typeof condition.values[0] === 'number' && c.progress.gold >= condition.values[0]);
      case EventCardConditionType.payCollectiveGold:
        return condition.values && typeof condition.values[0] === 'number' && characters.length > 0 && characters.map((c) => c.progress.gold).reduce((a, b) => a + b) >= condition.values[0];
      case EventCardConditionType.payCollectiveGoldConditional:
        return condition.values && condition.values.some((value) => typeof value !== 'number' && this.resolvableCondition(value));
      case EventCardConditionType.payCollectiveGoldReputationGT:
        return condition.values && typeof condition.values[0] === 'number' && typeof condition.values[1] === 'number' && characters.length > 0 && characters.map((c) => c.progress.gold).reduce((a, b) => a + b) >= condition.values[0] && this.game.party.reputation > condition.values[1];
      case EventCardConditionType.payCollectiveGoldReputationLT:
        return condition.values && typeof condition.values[0] === 'number' && typeof condition.values[1] === 'number' && characters.length > 0 && characters.map((c) => c.progress.gold).reduce((a, b) => a + b) >= condition.values[0] && this.game.party.reputation < condition.values[1];
      case EventCardConditionType.loseCollectiveResource:
      case EventCardConditionType.payCollectiveItem:
      default:
        return false;
    }
  }

}

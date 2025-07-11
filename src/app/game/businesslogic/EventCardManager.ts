import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Game } from "../model/Game";
import { EventCard, EventCardEffect, EventCardIdentifier } from "../model/data/EventCard";
import { gameManager } from "./GameManager";

export class EventCardManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getEventCardsForEdition(type: string, edition: string): EventCard[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(edition) != -1).flatMap((editionData) => editionData.events).filter((eventCard) => eventCard.type == type);
  }

  buildPartyDeck(type: string, edition: string, migrate: boolean = false) {
    const campaignData = gameManager.campaignData(edition);
    if (migrate) {
      this.game.party.eventDecks[type] = [];
      // TODO: add migration with scenario rewards
    }

    if (campaignData && campaignData.events && campaignData.events[type]) {
      campaignData.events[type].forEach((cardId) => this.addEvent(type, cardId));
    }
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
    this.game.party.eventDecks[type].unshift(cardId);
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

  applyEvent(eventCard: EventCard, selected: number, subSelections: number[] = []) {
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

      // apply effects
      if (option.outcomes) {
        option.outcomes.forEach((outcome, i) => {
          if (!subSelections || subSelections.length == 0 || subSelections.indexOf(i) != -1) {
            this.applyEffects(outcome.effects.filter((e) => typeof e !== 'string'));
          }
        })
      }
    }

    if (!returnToDeck && !removeFromDeck || !option) {
      console.warn("Apply event without valid selection", eventCard, selected);
    } else if (returnToDeck) {
      this.returnEvent(eventCard.type, eventCard.cardId);
    } else {
      this.removeEvent(eventCard.type, eventCard.cardId);
    }

    this.game.party.eventCards.push(new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, selected, subSelections));
  }

  applyEffects(effects: EventCardEffect[]) {
    // TODO
    console.warn("Missing implementation for applying effects", effects);
  }

}

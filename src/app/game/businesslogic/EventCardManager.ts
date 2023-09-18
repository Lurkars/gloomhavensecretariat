import { Game } from "../model/Game";
import { EventCard } from "../model/data/EventCard";
import { gameManager } from "./GameManager";

export class EventCardManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getEventCardsForEdition(type: string, edition: string): EventCard[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(edition) != -1).flatMap((editionData) => editionData.events).filter((eventCard) => eventCard.type == type);
  }

}

import { moveItemInArray } from '@angular/cdk/drag-drop';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { EventCard, EventCardIdentifier } from 'src/app/game/model/data/EventCard';

function eventEdition(): string {
  return gameManager.game.party.edition || gameManager.game.edition || gameManager.currentEdition();
}

function eventCard(type: BASE_TYPE, cardId: BASE_TYPE): EventCard | undefined {
  return typeof type === 'string' && typeof cardId === 'string'
    ? gameManager.eventCardManager.getEventCardForEdition(eventEdition(), type, cardId)
    : undefined;
}

function deck(type: BASE_TYPE): string[] {
  return gameManager.game.party.eventDecks[type as string] || [];
}

function drawnIndex(type: BASE_TYPE | undefined, cardId: BASE_TYPE | undefined): number {
  const eventCards = gameManager.game.party.eventCards;
  for (let i = eventCards.length - 1; i >= 0; i--) {
    if (eventCards[i].type === type && eventCards[i].cardId === cardId) {
      return i;
    }
  }
  return -1;
}

function parseList(value: BASE_TYPE | undefined): number[] {
  return typeof value === 'string' && value ? value.split(',').map((part) => +part) : [];
}

export class EventDeckShuffleCommand extends CommandImpl {
  id: string = 'event.deck.shuffle';
  requiredParameters: number = 2;

  validParameters(type: string, seed: number): boolean {
    return deck(type).length > 0 && validSeed(seed);
  }

  executeWithParameters(type: string) {
    gameManager.game.seed = this.parameters[1] as number;
    gameManager.eventCardManager.shuffleEvents(type);
  }
}

export class EventDeckMoveCommand extends CommandImpl {
  id: string = 'event.deck.move';
  requiredParameters: number = 3;

  validParameters(type: string, cardId: string, to: number): boolean {
    return deck(type).includes(cardId) && typeof to === 'number' && to >= 0;
  }

  executeWithParameters(type: string, cardId: string, to: number) {
    moveItemInArray(deck(type), deck(type).indexOf(cardId), to);
  }
}

export class EventDeckAddCommand extends CommandImpl {
  id: string = 'event.deck.add';
  requiredParameters: number = 3;

  validParameters(type: string, cardId: string, seed: number, index: number = -1): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!eventCard(type, cardId) && !deck(type).includes(cardId) && typeof index === 'number';
  }

  executeWithParameters(type: string, cardId: string, seed: number, index: number = -1) {
    gameManager.game.seed = seed;
    if (index < 0) {
      gameManager.eventCardManager.addEvent(type, cardId);
    } else {
      gameManager.game.party.eventDecks[type] = deck(type);
      deck(type).splice(index, 0, cardId);
    }
  }
}

export class EventDeckRemoveCommand extends CommandImpl {
  id: string = 'event.deck.remove';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string): boolean {
    return deck(type).includes(cardId);
  }

  executeWithParameters(type: string, cardId: string) {
    gameManager.eventCardManager.removeEvent(type, cardId);
  }
}

export class EventDeckMarkDrawnCommand extends CommandImpl {
  id: string = 'event.deck.markDrawn';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string, index: number = -1): boolean {
    return !!eventCard(type, cardId) && typeof index === 'number';
  }

  executeWithParameters(type: string, cardId: string, index: number = -1) {
    const card = eventCard(type, cardId);
    if (card) {
      const identifier = new EventCardIdentifier(card.cardId, card.edition, card.type, -1, [], [], false, false);
      if (index < 0) {
        gameManager.game.party.eventCards.push(identifier);
      } else {
        gameManager.game.party.eventCards.splice(index, 0, identifier);
      }
    } else {
      this.executionError('event card not found');
    }
  }
}

export class EventDeckRemoveDrawnCommand extends CommandImpl {
  id: string = 'event.deck.removeDrawn';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string): boolean {
    return drawnIndex(type, cardId) !== -1;
  }

  executeWithParameters(type: string, cardId: string) {
    gameManager.game.party.eventCards.splice(drawnIndex(type, cardId), 1);
  }
}

export class EventDeckSelectionCommand extends CommandImpl {
  id: string = 'event.deck.selection';
  requiredParameters: number = 3;

  validParameters(type: string, cardId: string, selected: number, subSelections: string = ''): boolean {
    return (
      drawnIndex(type, cardId) !== -1 &&
      typeof selected === 'number' &&
      selected >= -1 &&
      parseList(subSelections).every((value) => !isNaN(value))
    );
  }

  executeWithParameters(type: string, cardId: string, selected: number, subSelections: string = '') {
    const identifier = gameManager.game.party.eventCards[drawnIndex(type, cardId)];
    identifier.selected = selected;
    identifier.subSelections = parseList(subSelections);
  }
}

export class EventDeckResetCommand extends CommandImpl {
  id: string = 'event.deck.reset';
  requiredParameters: number = 2;

  validParameters(type: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.eventCardManager.getEventTypesForEdition(eventEdition()).includes(type);
  }

  executeWithParameters(type: string, seed: number) {
    gameManager.game.seed = seed;
    const edition = eventEdition();
    if (gameManager.game.party.eventDecks[type]) {
      gameManager.game.party.eventDecks[type] = [];
      gameManager.game.party.eventCards = gameManager.game.party.eventCards.filter(
        (value) => value.edition !== edition && value.type !== type
      );
    }
    gameManager.eventCardManager.buildPartyDeck(edition, type);
  }
}

export class EventDrawAcceptCommand extends CommandImpl {
  id: string = 'event.draw.accept';
  requiredParameters: number = 3;

  card(type: BASE_TYPE): EventCard | undefined {
    const cards = deck(type);
    return cards.length ? eventCard(type, cards[0]) : undefined;
  }

  validParameters(type: string, selected: number, seed: number, apply: boolean = true): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.card(type) && typeof selected === 'number' && (selected !== -1 || !apply);
  }

  executeWithParameters(
    type: string,
    selected: number,
    seed: number,
    apply: boolean = true,
    attack: boolean = false,
    subSelections: string = '',
    checks: string = ''
  ) {
    gameManager.game.seed = seed;
    const card = this.card(type);
    if (card) {
      gameManager.game.eventDraw = undefined;
      gameManager.eventCardManager.applyEvent(
        card,
        selected,
        parseList(subSelections),
        parseList(checks),
        gameManager.game.scenario !== undefined && gameManager.roundManager.firstRound,
        attack,
        apply
      );
    } else {
      this.executionError('event card not found');
    }
  }
}

export class EventDrawCancelCommand extends CommandImpl {
  id: string = 'event.draw.cancel';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return !!gameManager.game.eventDraw;
  }

  executeWithParameters() {
    gameManager.game.eventDraw = undefined;
  }
}

export class EventDrawNewCommand extends CommandImpl {
  id: string = 'event.draw.new';
  requiredParameters: number = 2;

  validParameters(type: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return deck(type).length > 1;
  }

  executeWithParameters(type: string, seed: number) {
    gameManager.game.seed = seed;
    const cardId = deck(type)[0];
    gameManager.eventCardManager.removeEvent(type, cardId);
    gameManager.eventCardManager.addEvent(type, cardId);
  }
}

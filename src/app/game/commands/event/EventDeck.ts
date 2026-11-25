import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { EventCard, EventCardIdentifier, EventCardResult } from 'src/app/game/model/data/EventCard';

function eventEdition(): string {
  return gameManager.game.party.edition || gameManager.game.edition || gameManager.editionManager.currentEdition();
}

function eventCard(type: BASE_TYPE, cardId: BASE_TYPE): EventCard | undefined {
  return typeof type === 'string' && typeof cardId === 'string'
    ? gameManager.eventCardManager.getEventCardForEdition(eventEdition(), type, cardId)
    : undefined;
}

function deck(type: BASE_TYPE): string[] {
  return gameManager.game.party.eventDecks[type as string] || [];
}

function drawnIdentifier(type: BASE_TYPE | undefined, cardId: BASE_TYPE | undefined): EventCardIdentifier | undefined {
  const eventCards = gameManager.game.party.eventCards;
  for (let i = eventCards.length - 1; i >= 0; i--) {
    if (eventCards[i].type === type && eventCards[i].cardId === cardId) {
      return eventCards[i];
    }
  }
  return undefined;
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
    return typeof to === 'number' && gameManager.eventCardManager.canMoveEvent(type, deck(type).indexOf(cardId), to);
  }

  executeWithParameters(type: string, cardId: string, to: number) {
    gameManager.eventCardManager.moveEvent(type, deck(type).indexOf(cardId), to);
  }
}

export class EventDeckAddCommand extends CommandImpl {
  id: string = 'event.deck.add';
  requiredParameters: number = 3;

  validParameters(type: string, cardId: string, seed: number, index: number = -1): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      typeof index === 'number' &&
      (index < 0
        ? gameManager.eventCardManager.canAddEvent(type, cardId)
        : gameManager.eventCardManager.canInsertEvent(type, cardId, index))
    );
  }

  executeWithParameters(type: string, cardId: string, seed: number, index: number = -1) {
    gameManager.game.seed = seed;
    if (index < 0) {
      gameManager.eventCardManager.addEvent(type, cardId);
    } else {
      gameManager.eventCardManager.insertEvent(type, cardId, index);
    }
  }
}

export class EventDeckRemoveCommand extends CommandImpl {
  id: string = 'event.deck.remove';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string): boolean {
    return gameManager.eventCardManager.canRemoveEvent(type, cardId);
  }

  executeWithParameters(type: string, cardId: string) {
    gameManager.eventCardManager.removeEvent(type, cardId);
  }
}

export class EventDeckMarkDrawnCommand extends CommandImpl {
  id: string = 'event.deck.markDrawn';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string, index: number = -1): boolean {
    return !!eventCard(type, cardId) && typeof index === 'number' && gameManager.eventCardManager.canMarkEventDrawn(index);
  }

  executeWithParameters(type: string, cardId: string, index: number = -1) {
    const card = eventCard(type, cardId);
    if (card) {
      gameManager.eventCardManager.markEventDrawn(card, index);
    } else {
      this.executionError('event card not found');
    }
  }
}

export class EventDeckRemoveDrawnCommand extends CommandImpl {
  id: string = 'event.deck.removeDrawn';
  requiredParameters: number = 2;

  validParameters(type: string, cardId: string): boolean {
    const identifier = drawnIdentifier(type, cardId);
    return !!identifier && gameManager.eventCardManager.canRemoveDrawnEvent(identifier);
  }

  executeWithParameters(type: string, cardId: string) {
    const identifier = drawnIdentifier(type, cardId);
    if (identifier) {
      gameManager.eventCardManager.removeDrawnEvent(identifier);
    }
  }
}

export class EventDeckSelectionCommand extends CommandImpl {
  id: string = 'event.deck.selection';
  requiredParameters: number = 3;

  result(): EventCardResult | undefined {
    const [type, cardId, selected, subSelections = '', checks, attack] = this.parameters;
    const identifier = drawnIdentifier(type, cardId);
    if (
      !identifier ||
      typeof selected !== 'number' ||
      typeof subSelections !== 'string' ||
      (checks !== undefined && typeof checks !== 'string') ||
      (attack !== undefined && typeof attack !== 'boolean')
    ) {
      return undefined;
    }
    return new EventCardResult(
      selected,
      parseList(subSelections),
      checks !== undefined ? parseList(checks) : identifier.checks || [],
      attack !== undefined ? attack : identifier.attack
    );
  }

  validParameters(type: string, cardId: string): boolean {
    const identifier = drawnIdentifier(type, cardId);
    const result = this.result();
    return !!identifier && !!result && gameManager.eventCardManager.canSetDrawnEventResult(identifier, result);
  }

  executeWithParameters(type: string, cardId: string) {
    const identifier = drawnIdentifier(type, cardId);
    const result = this.result();
    if (identifier && result) {
      gameManager.eventCardManager.setDrawnEventResult(identifier, result);
    }
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
    gameManager.eventCardManager.resetEventDeck(eventEdition(), type);
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
    const card = this.card(type);
    return (
      !!card &&
      typeof selected === 'number' &&
      typeof apply === 'boolean' &&
      gameManager.eventCardManager.canAcceptEvent(card, selected, apply)
    );
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
      gameManager.eventCardManager.acceptEvent(card, selected, parseList(subSelections), parseList(checks), attack, apply);
    } else {
      this.executionError('event card not found');
    }
  }
}

export class EventDrawCancelCommand extends CommandImpl {
  id: string = 'event.draw.cancel';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.eventCardManager.canCancelEventDraw();
  }

  executeWithParameters() {
    gameManager.eventCardManager.cancelEventDraw();
  }
}

export class EventDrawNewCommand extends CommandImpl {
  id: string = 'event.draw.new';
  requiredParameters: number = 2;

  validParameters(type: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.eventCardManager.canDrawNewEvent(type, deck(type)[0]);
  }

  executeWithParameters(type: string, seed: number) {
    gameManager.game.seed = seed;
    gameManager.eventCardManager.drawNewEvent(type, deck(type)[0]);
  }
}

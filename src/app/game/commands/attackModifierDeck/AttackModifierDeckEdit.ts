import { gameManager } from 'src/app/game/businesslogic/Managers';
import {
  AttackModifierDeckCommandImpl,
  ResolvedAttackModifierDeck
} from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckCommand';
import { BASE_TYPE } from 'src/app/game/commands/Command';
import { deckFind, deckTargetValid, findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import {
  additionalTownGuardAttackModifier,
  AttackModifier,
  AttackModifierDeck,
  AttackModifierType,
  Gh2ESealedDeckAttackModifier
} from 'src/app/game/model/data/AttackModifier';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { deckCardList } from 'src/app/game/util/deck';

export class AttackModifierDeckShuffleCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.shuffle';
  requiredParameters: number = 2;

  validParameters(deckId: string | number, seed: number, upcoming: boolean = false): boolean {
    return !!this.resolved() && typeof upcoming === 'boolean' && validSeed(seed);
  }

  executeWithParameters(deckId: string | number, seed: number, upcoming: boolean = false) {
    const resolved = this.resolved();
    if (resolved) {
      gameManager.game.seed = seed;
      gameManager.attackModifierManager.shuffleModifiers(resolved.deck, upcoming);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckRemoveDrawnDiscardsCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.removeDrawnDiscards';
  requiredParameters: number = 1;

  validParameters(): boolean {
    return !!this.resolved();
  }

  executeWithParameters() {
    const resolved = this.resolved();
    if (resolved) {
      gameManager.attackModifierManager.removeDrawnDiscards(resolved.deck);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckRestoreDefaultCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.restoreDefault';
  requiredParameters: number = 2;

  validParameters(id: string | number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.resolved();
  }

  executeWithParameters(deckId: string | number, seed: number) {
    gameManager.game.seed = seed;
    const resolved = this.resolved();
    if (resolved && resolved.character) {
      gameManager.attackModifierManager.mergeAttackModifierDeck(
        resolved.character.attackModifierDeck,
        gameManager.attackModifierManager.buildCharacterAttackModifierDeck(resolved.character)
      );
    } else if (resolved && resolved.townGuard) {
      resolved.deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(
        gameManager.game.party,
        gameManager.campaignManager.campaignData()
      );
    } else if (resolved) {
      const deck = gameManager.attackModifierManager.defaultMonsterAttackModifierDeck(resolved.ally);
      if (deckId === 'a') {
        gameManager.game.allyAttackModifierDeck = deck;
      } else {
        gameManager.game.monsterAttackModifierDeck = deck;
      }
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckMoveCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.move';
  requiredParameters: number = 5;

  index(fromList: BASE_TYPE, cardId: BASE_TYPE): number {
    const resolved = this.resolved();
    return resolved ? deckFind(resolved.deck.cards, resolved.deck.current, fromList, (am) => am.id === cardId) : -1;
  }

  validParameters(deckId: string | number, fromList: string, cardId: string, toList: string, toIndex: number): boolean {
    return this.index(fromList, cardId) !== -1 && deckTargetValid(toList, toIndex);
  }

  executeWithParameters(deckId: string | number, fromList: string, cardId: string, toList: string, toIndex: number) {
    const resolved = this.resolved();
    if (resolved) {
      const position = deckCardList(resolved.deck.current, this.index(fromList, cardId));
      gameManager.attackModifierManager.moveCard(resolved.deck, position.list, position.index, toList, toIndex);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckRevealCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.reveal';
  requiredParameters: number = 3;

  index(cardId: BASE_TYPE, revealed: BASE_TYPE): number {
    const resolved = this.resolved();
    return resolved
      ? deckFind(resolved.deck.cards, resolved.deck.current, 'upcoming', (am) => am.id === cardId && !!am.revealed !== revealed)
      : -1;
  }

  validParameters(deckId: string | number, cardId: string, revealed: boolean): boolean {
    return typeof revealed === 'boolean' && this.index(cardId, revealed) !== -1;
  }

  executeWithParameters(deckId: string | number, cardId: string, revealed: boolean) {
    const resolved = this.resolved();
    if (resolved) {
      resolved.deck.cards[this.index(cardId, revealed)].revealed = revealed;
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckRemoveCardCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.removeCard';
  requiredParameters: number = 3;

  index(list: BASE_TYPE, cardId: BASE_TYPE): number {
    const resolved = this.resolved();
    return resolved ? deckFind(resolved.deck.cards, resolved.deck.current, list, (am) => am.id === cardId) : -1;
  }

  validParameters(deckId: string | number, list: string, cardId: string): boolean {
    return this.index(list, cardId) !== -1;
  }

  executeWithParameters(deckId: string | number, list: string, cardId: string) {
    const resolved = this.resolved();
    if (resolved) {
      gameManager.attackModifierManager.removeCard(resolved.deck, this.index(list, cardId));
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckRestoreCardCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.restoreCard';
  requiredParameters: number = 2;

  deletedCards(resolved: ResolvedAttackModifierDeck): AttackModifier[] {
    let originalDeck: AttackModifierDeck;
    if (resolved.character) {
      originalDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(resolved.character);
    } else if (resolved.townGuard) {
      originalDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(
        gameManager.game.party,
        gameManager.campaignManager.campaignData()
      );
    } else {
      originalDeck = gameManager.attackModifierManager.defaultDeck();
    }
    resolved.deck.cards.forEach((modifier) => {
      const card = originalDeck.cards.find((orginalCard) => orginalCard.id === modifier.id);
      if (card) {
        originalDeck.cards.splice(originalDeck.cards.indexOf(card), 1);
      }
    });
    return originalDeck.cards;
  }

  deletedCard(resolved: ResolvedAttackModifierDeck, cardId: BASE_TYPE): AttackModifier | undefined {
    return this.deletedCards(resolved).find((am) => am.id === cardId);
  }

  validParameters(deckId: string | number, cardId: string): boolean {
    const resolved = this.resolved();
    return !!resolved && !!this.deletedCard(resolved, cardId);
  }

  executeWithParameters(deckId: string | number, cardId: string) {
    const resolved = this.resolved();
    const card = resolved && this.deletedCard(resolved, cardId);
    if (resolved && card) {
      gameManager.attackModifierManager.restoreCard(resolved.deck, card);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckAddCardCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.addCard';
  requiredParameters: number = 3;

  townGuardModifier(type: BASE_TYPE): AttackModifier | undefined {
    return additionalTownGuardAttackModifier.find((attackModifier) => attackModifier.id === type);
  }

  validParameters(deckId: string | number, type: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const resolved = this.resolved();
    return (
      !!resolved &&
      (Object.values(AttackModifierType).includes(type as AttackModifierType) || (resolved.townGuard && !!this.townGuardModifier(type)))
    );
  }

  executeWithParameters(deckId: string | number, type: string, seed: number, shuffled: boolean = false) {
    gameManager.game.seed = seed;
    const resolved = this.resolved();
    if (resolved) {
      const townGuardModifier = resolved.townGuard ? this.townGuardModifier(type) : undefined;
      const attackModifier = townGuardModifier
        ? Object.assign(new AttackModifier(townGuardModifier.type), townGuardModifier)
        : new AttackModifier(type as AttackModifierType);
      gameManager.attackModifierManager.insertModifier(resolved.deck, attackModifier, shuffled, !!townGuardModifier);
    } else {
      this.executionError('deck not found');
    }
  }
}

const CHANGE_TYPES: string[] = [AttackModifierType.bless, AttackModifierType.curse, AttackModifierType.minus1extra];

export class AttackModifierDeckChangeCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.change';
  requiredParameters: number = 4;

  validParameters(deckId: string | number, type: string, value: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.resolved() && CHANGE_TYPES.includes(type) && typeof value === 'number' && value !== 0;
  }

  executeWithParameters(deckId: string | number, type: AttackModifierType, value: number, seed: number) {
    gameManager.game.seed = seed;
    const resolved = this.resolved();
    if (resolved) {
      gameManager.attackModifierManager.changeModifierCount(resolved.deck, type, value, !resolved.character && !resolved.ally);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckAdditionalCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.additional';
  requiredParameters: number = 5;

  validParameters(deckId: string | number, type: string, number: number, value: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const resolved = this.resolved();
    const source: Character | undefined = findCharacter(number);
    return (
      !!resolved &&
      (type === AttackModifierType.empower || type === AttackModifierType.enfeeble) &&
      !!source &&
      !!source.additionalModifier &&
      source.additionalModifier.some((perk) => perk.attackModifier && perk.attackModifier.type === type) &&
      (!resolved.character ||
        !gameManager.entityManager.isImmune(resolved.character, resolved.character, type as string as ConditionName)) &&
      typeof value === 'number' &&
      value !== 0
    );
  }

  executeWithParameters(deckId: string | number, type: AttackModifierType, number: number, value: number, seed: number) {
    gameManager.game.seed = seed;
    const resolved = this.resolved();
    const source = findCharacter(number);
    if (resolved && source) {
      gameManager.attackModifierManager.changeAdditionalCount(resolved.deck, source, type, value);
    } else {
      this.executionError('deck or character not found');
    }
  }
}

export class AttackModifierDeckFactionCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.faction';
  requiredParameters: number = 3;

  factionModifier(id: BASE_TYPE): AttackModifier | undefined {
    return Gh2ESealedDeckAttackModifier.find((am) => am.id === id);
  }

  has(resolved: ResolvedAttackModifierDeck, id: BASE_TYPE): boolean {
    return resolved.deck.cards.some((am) => am.id === id);
  }

  anyHas(resolved: ResolvedAttackModifierDeck, id: BASE_TYPE): boolean {
    return !!resolved.character && gameManager.attackModifierManager.factionModifierInUse(resolved.character, id as string);
  }

  validParameters(deckId: string | number, id: string, value: boolean, force: boolean = false): boolean {
    const resolved = this.resolved();
    return (
      !!resolved &&
      !!resolved.character &&
      !!this.factionModifier(id) &&
      typeof value === 'boolean' &&
      this.has(resolved, id) !== value &&
      (!value || !this.anyHas(resolved, id) || force)
    );
  }

  executeWithParameters(deckId: string | number, id: string, value: boolean, force: boolean = false) {
    const resolved = this.resolved();
    const attackModifier = this.factionModifier(id);
    if (resolved && attackModifier) {
      gameManager.attackModifierManager.setFactionModifier(resolved.deck, attackModifier, value, force);
    } else {
      this.executionError('deck or faction modifier not found');
    }
  }
}

export class AttackModifierDeckDiscardCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.discard';
  requiredParameters: number = 3;

  index(cardId: BASE_TYPE, discarded: BASE_TYPE): number {
    const resolved = this.resolved();
    return resolved
      ? resolved.deck.cards.findIndex((am, index) => am.active && am.id === cardId && resolved.deck.discarded.includes(index) !== discarded)
      : -1;
  }

  validParameters(deckId: string | number, cardId: string, discarded: boolean): boolean {
    return typeof discarded === 'boolean' && this.index(cardId, discarded) !== -1;
  }

  executeWithParameters(deckId: string | number, cardId: string, discarded: boolean) {
    const resolved = this.resolved();
    if (resolved) {
      gameManager.attackModifierManager.setDiscarded(resolved.deck, this.index(cardId, discarded), discarded);
    } else {
      this.executionError('deck not found');
    }
  }
}

export class AttackModifierDeckActiveCommand extends AttackModifierDeckCommandImpl {
  id: string = 'attackModifierDeck.active';
  requiredParameters: number = 2;

  validParameters(deckId: string | number, active: boolean): boolean {
    return !!this.resolved() && typeof active === 'boolean';
  }

  executeWithParameters(deckId: string | number, active: boolean) {
    const resolved = this.resolved();
    if (resolved) {
      resolved.deck.active = active;
    } else {
      this.executionError('deck not found');
    }
  }
}

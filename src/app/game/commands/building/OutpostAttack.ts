import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { EventCardAttackTarget } from 'src/app/game/model/data/EventCard';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';

const OUTPOST_LISTS = ['buildings', 'others'];

function townGuardDeck(): AttackModifierDeck {
  return gameManager.outpostAttackManager.townGuardDeck() || new AttackModifierDeck();
}

export class OutpostStartCommand extends CommandImpl {
  id: string = 'outpost.start';
  requiredParameters: number = 1;

  validParameters(seed: number, replace: boolean = false, type: string = '', cardId: string = ''): boolean {
    if (!validSeed(seed) || typeof replace !== 'boolean' || typeof type !== 'string' || typeof cardId !== 'string') {
      return false;
    }
    return type || cardId
      ? gameManager.outpostAttackManager.canStartFromEvent(type, cardId, replace)
      : gameManager.outpostAttackManager.canStart(replace);
  }

  executeWithParameters(seed: number, replace: boolean = false, type: string = '', cardId: string = '') {
    gameManager.game.seed = seed;
    if (type || cardId) {
      gameManager.outpostAttackManager.startFromEvent(type, cardId, replace);
    } else {
      gameManager.outpostAttackManager.start(undefined, [], replace);
    }
  }
}

export class OutpostFinishCommand extends CommandImpl {
  id: string = 'outpost.finish';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.outpostAttackManager.canFinish();
  }

  executeWithParameters() {
    gameManager.outpostAttackManager.finish();
  }
}

export class OutpostCancelCommand extends OutpostFinishCommand {
  override id: string = 'outpost.cancel';
}

export class OutpostResultCommand extends CommandImpl {
  id: string = 'outpost.result';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.outpostAttackManager.canToggleResult(townGuardDeck());
  }

  executeWithParameters() {
    gameManager.outpostAttackManager.toggleResult(townGuardDeck());
  }
}

export class OutpostDrawCommand extends CommandImpl {
  id: string = 'outpost.draw';
  requiredParameters: number = 1;

  validParameters(seed: number, state: string = ''): boolean {
    return validSeed(seed) && ['', 'advantage', 'disadvantage'].includes(state) && gameManager.outpostAttackManager.canDrawTownGuard();
  }

  executeWithParameters(seed: number, state: string = '') {
    gameManager.game.seed = seed;
    gameManager.outpostAttackManager.drawTownGuard(state === 'advantage' || state === 'disadvantage' ? state : undefined);
  }
}

export class OutpostAttackCommand extends CommandImpl {
  id: string = 'outpost.attack';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.outpostAttackManager.canAttackTarget(townGuardDeck());
  }

  executeWithParameters() {
    gameManager.outpostAttackManager.attackTarget(townGuardDeck());
  }
}

export class OutpostSoldiersCommand extends CommandImpl {
  id: string = 'outpost.soldiers';
  requiredParameters: number = 1;

  validParameters(soldier: number): boolean {
    return typeof soldier === 'number' && gameManager.outpostAttackManager.canToggleSoldier(soldier);
  }

  executeWithParameters(soldier: number) {
    gameManager.outpostAttackManager.toggleSoldier(soldier);
  }
}

export class OutpostResourceCommand extends CommandImpl {
  id: string = 'outpost.resource';
  requiredParameters: number = 1;

  validParameters(index: number): boolean {
    return typeof index === 'number' && gameManager.outpostAttackManager.canToggleResource(index);
  }

  executeWithParameters(index: number) {
    gameManager.outpostAttackManager.toggleResource(index);
  }
}

export class OutpostManualCommand extends CommandImpl {
  id: string = 'outpost.manual';
  requiredParameters: number = 2;

  validParameters(attackValue: number, targetNumber: number): boolean {
    return (
      typeof attackValue === 'number' &&
      typeof targetNumber === 'number' &&
      gameManager.outpostAttackManager.canSetManual(attackValue, targetNumber)
    );
  }

  executeWithParameters(attackValue: number, targetNumber: number) {
    gameManager.outpostAttackManager.setManual(attackValue, targetNumber);
  }
}

function targetDistance(distance: BASE_TYPE | undefined): 'previousTarget' | string | WorldMapCoordinates | undefined | false {
  if (distance === undefined || distance === '') {
    return undefined;
  }
  if (typeof distance !== 'string') {
    return false;
  }
  const values = distance.split(',');
  if (values.length > 1) {
    const numbers = values.map((value) => +value);
    if (values.length > 4 || numbers.some((value) => isNaN(value))) {
      return false;
    }
    const [x, y, width = 0, height = 0] = numbers;
    return Object.assign(new WorldMapCoordinates(), { x, y, width, height });
  }
  return distance;
}

export class OutpostTargetCommand extends CommandImpl {
  id: string = 'outpost.target';
  requiredParameters: number = 0;

  target(): Partial<EventCardAttackTarget> | undefined {
    const [lowerBoundary, upperBoundary, parity, level, distance, desc] = this.parameters;
    const target: Partial<EventCardAttackTarget> = {};
    if (lowerBoundary !== undefined) {
      if (typeof lowerBoundary !== 'number') {
        return undefined;
      }
      target.lowerBoundary = lowerBoundary;
    }
    if (upperBoundary !== undefined) {
      if (typeof upperBoundary !== 'number') {
        return undefined;
      }
      target.upperBoundary = upperBoundary;
    }
    if (parity !== undefined) {
      target.parity = (parity || 0) as 0 | 'even' | 'odd';
    }
    if (level !== undefined) {
      target.level = (level || 0) as 0 | 'low' | 'high';
    }
    if (distance !== undefined) {
      const value = targetDistance(distance);
      if (value === false) {
        return undefined;
      }
      target.distance = value;
    }
    if (desc !== undefined) {
      if (typeof desc !== 'boolean') {
        return undefined;
      }
      target.desc = desc;
    }
    return target;
  }

  validParameters(): boolean {
    const target = this.target();
    return !!target && gameManager.outpostAttackManager.canSetTarget(target);
  }

  executeWithParameters() {
    const target = this.target();
    if (target) {
      gameManager.outpostAttackManager.setTarget(target);
    }
  }
}

export class OutpostRandomizeCommand extends CommandImpl {
  id: string = 'outpost.randomize';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    return validSeed(seed) && gameManager.outpostAttackManager.canRandomize();
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.outpostAttackManager.randomize();
  }
}

export class OutpostOrderCommand extends CommandImpl {
  id: string = 'outpost.order';
  requiredParameters: number = 4;

  validParameters(fromList: string, fromIndex: number, toList: string, toIndex: number): boolean {
    return (
      OUTPOST_LISTS.includes(fromList) &&
      OUTPOST_LISTS.includes(toList) &&
      typeof fromIndex === 'number' &&
      typeof toIndex === 'number' &&
      gameManager.outpostAttackManager.canMoveBuilding(
        fromList as 'buildings' | 'others',
        fromIndex,
        toList as 'buildings' | 'others',
        toIndex
      )
    );
  }

  executeWithParameters(fromList: 'buildings' | 'others', fromIndex: number, toList: 'buildings' | 'others', toIndex: number) {
    gameManager.outpostAttackManager.moveBuilding(fromList, fromIndex, toList, toIndex);
  }
}

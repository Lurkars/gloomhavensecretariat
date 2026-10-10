import { moveItemInArray } from '@angular/cdk/drag-drop';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

export function figureIdentifier(figure: Figure): string {
  return figure.edition + '-' + (figure instanceof ObjectiveContainer ? figure.uuid : figure.name);
}

export function findCharacter(number: BASE_TYPE | undefined): Character | undefined {
  return gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === number) as Character | undefined;
}

export function findCharacterByName(name: BASE_TYPE | undefined): Character | undefined {
  return gameManager.game.figures.find((figure) => figure instanceof Character && figure.name === name) as Character | undefined;
}

export function findFigure(id: BASE_TYPE | undefined): Figure | undefined {
  if (typeof id === 'number') {
    return findCharacter(id);
  }
  if (typeof id !== 'string' || !id) {
    return undefined;
  }
  return gameManager.game.figures.find((figure) => figureIdentifier(figure) === id);
}

export function findMonster(id: BASE_TYPE | undefined): Monster | undefined {
  const figure = findFigure(id);
  return figure instanceof Monster ? figure : undefined;
}

export function findObjectiveContainer(id: BASE_TYPE | undefined): ObjectiveContainer | undefined {
  const figure = findFigure(id);
  return figure instanceof ObjectiveContainer ? figure : undefined;
}

export function findItem(edition: BASE_TYPE | undefined, id: BASE_TYPE | undefined): ItemData | undefined {
  if (typeof edition !== 'string' || (typeof id !== 'number' && typeof id !== 'string')) {
    return undefined;
  }
  return gameManager.itemManager.getItem(id, edition, true);
}

export function isFigureLevel(entityId: BASE_TYPE | undefined): boolean {
  return entityId === undefined || entityId === '' || entityId === false;
}

export function isAllEntities(figure: Figure | undefined, entityId: BASE_TYPE | undefined): boolean {
  return isFigureLevel(entityId) && (figure instanceof Monster || figure instanceof ObjectiveContainer);
}

export function findEntity(figure: Figure | undefined, entityId: BASE_TYPE | undefined): Entity | undefined {
  if (figure instanceof Character) {
    if (isFigureLevel(entityId)) {
      return figure;
    }
    return figure.summons.find((summon) => summon.uuid === entityId);
  } else if (figure instanceof Monster) {
    return figure.entities.find((entity) => entity.number === +(entityId as number) && !isFigureLevel(entityId));
  } else if (figure instanceof ObjectiveContainer) {
    if (isFigureLevel(entityId)) {
      return undefined;
    }
    return figure.entities.find((entity) => entity.uuid === entityId || entity.number === +(entityId as number));
  }
  return undefined;
}

export function findEntities(figure: Figure | undefined, entityId: BASE_TYPE | undefined): Entity[] {
  if (!figure) {
    return [];
  }
  if (isFigureLevel(entityId) && (figure instanceof Monster || figure instanceof ObjectiveContainer)) {
    return gameManager.entityManager.entities(figure);
  }
  const entity = findEntity(figure, entityId);
  return entity ? [entity] : [];
}

export const DECK_LISTS: string[] = ['upcoming', 'discarded'];

export function deckFind<T>(cards: T[], current: number, list: BASE_TYPE | undefined, match: (card: T) => boolean): number {
  if (list === 'discarded') {
    for (let i = current; i >= 0; i--) {
      if (cards[i] && match(cards[i])) {
        return i;
      }
    }
  } else if (list === 'upcoming') {
    for (let i = current + 1; i < cards.length; i++) {
      if (match(cards[i])) {
        return i;
      }
    }
  }
  return -1;
}

export function deckTargetValid(toList: BASE_TYPE | undefined, toIndex: BASE_TYPE | undefined): boolean {
  return DECK_LISTS.includes(toList as string) && typeof toIndex === 'number' && toIndex >= 0;
}

export function deckMoveCard(
  current: number,
  from: number,
  toList: string,
  toIndex: number,
  ...arrays: unknown[][]
): { current: number; from: number; to: number } {
  const fromList = from <= current ? 'discarded' : 'upcoming';
  return deckMove(current, fromList, fromList === 'discarded' ? current - from : from - current - 1, toList, toIndex, ...arrays);
}

export function deckMove(
  current: number,
  fromList: string,
  fromIndex: number,
  toList: string,
  toIndex: number,
  ...arrays: unknown[][]
): { current: number; from: number; to: number } {
  let from = 0;
  let to = 0;
  if (toList === 'upcoming') {
    if (fromList === 'upcoming') {
      from = fromIndex + current + 1;
      to = toIndex + current + 1;
    } else {
      from = current - fromIndex;
      to = toIndex + current;
      current--;
    }
  } else if (fromList === 'discarded') {
    from = current - fromIndex;
    to = current - toIndex;
  } else {
    current++;
    from = fromIndex + current;
    to = current - toIndex;
  }
  arrays.forEach((array) => moveItemInArray(array, from, to));
  return { current, from, to };
}

export function fillParameter(command: CommandImpl, index: number, defaults: BASE_TYPE[], value: BASE_TYPE) {
  defaults.forEach((defaultValue, i) => {
    if (command.parameters[i] === undefined) {
      command.parameters[i] = defaultValue;
    }
  });
  command.parameters[index] = value;
}

export function validSeed(seed: BASE_TYPE | undefined): boolean {
  return typeof seed === 'number' && Number.isInteger(seed);
}

export function removeDeadEntity(figure: Figure, entity: Entity) {
  if (figure instanceof Monster && entity instanceof MonsterEntity && entity.dead) {
    gameManager.monsterManager.removeMonsterEntity(figure, entity);
  } else if (figure instanceof Character && entity instanceof Summon && entity.dead) {
    gameManager.characterManager.removeSummon(figure, entity);
  } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity && entity.dead) {
    gameManager.objectiveManager.removeObjectiveEntity(figure, entity);
  }
}

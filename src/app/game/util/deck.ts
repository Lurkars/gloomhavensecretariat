import { moveItemInArray } from '@angular/cdk/drag-drop';

export function deckCardList(current: number, index: number): { list: string; index: number } {
  return index <= current ? { list: 'discarded', index: current - index } : { list: 'upcoming', index: index - current - 1 };
}

export function deckMoveCard(
  current: number,
  from: number,
  toList: string,
  toIndex: number,
  ...arrays: unknown[][]
): { current: number; from: number; to: number } {
  const position = deckCardList(current, from);
  return deckMove(current, position.list, position.index, toList, toIndex, ...arrays);
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

export function deckMoveValid(
  current: number,
  length: number,
  fromList: string,
  fromIndex: number,
  toList: string,
  toIndex: number
): boolean {
  const lists = ['upcoming', 'discarded'];
  if (!lists.includes(fromList) || !lists.includes(toList) || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
    return false;
  }
  const listLength = (list: string) => (list === 'upcoming' ? length - current - 1 : current + 1);
  return (
    fromIndex >= 0 && fromIndex < listLength(fromList) && toIndex >= 0 && toIndex <= listLength(toList) - (fromList === toList ? 1 : 0)
  );
}

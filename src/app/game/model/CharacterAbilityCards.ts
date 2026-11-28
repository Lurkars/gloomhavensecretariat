export type AbilityCardHalf = 'top' | 'bottom' | 'defaultTop' | 'defaultBottom';

export type AbilityCardPile = 'hand' | 'selected' | 'discard' | 'lost' | 'active';

export class ActiveAbilityCard {
  index: number;
  bottom: boolean;

  constructor(index: number, bottom: boolean) {
    this.index = index;
    this.bottom = bottom;
  }
}

export class AbilityCardPlay {
  index: number;
  half: AbilityCardHalf;

  constructor(index: number, half: AbilityCardHalf) {
    this.index = index;
    this.half = half;
  }
}

export class CharacterAbilityCards {
  hand: number[] = [];
  selected: number[] = [];
  discard: number[] = [];
  lost: number[] = [];
  active: ActiveAbilityCard[] = [];
  played: AbilityCardHalf | undefined;
  shortRest: number[] = [];
}

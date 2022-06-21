import { Action } from "./Action";

export class AttackModifier {

  type: AttackModifierType;
  value: number;
  valueType: AttackModifierValueType;
  shuffle: boolean;
  actions: Action[];

  constructor(type: AttackModifierType, actions: Action[] = []) {
    this.type = type;
    this.valueType = AttackModifierValueType.plus;
    this.shuffle = false;
    this.actions = actions;
    switch (type) {
      case AttackModifierType.plus0:
        this.value = 0;
        break;
      case AttackModifierType.plus1:
        this.value = 1;
        break;
      case AttackModifierType.plus2:
        this.value = 3;
        break;
      case AttackModifierType.minus1:
        this.valueType = AttackModifierValueType.minus;
        this.value = 1;
        break;
      case AttackModifierType.minus2:
        this.valueType = AttackModifierValueType.minus;
        this.value = 2;
        break;
      case AttackModifierType.null:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 0;
        this.shuffle = true;
        break;
      case AttackModifierType.double:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 2;
        this.shuffle = true;
        break;
      case AttackModifierType.bless:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 2;
        break;
      case AttackModifierType.curse:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 0;
        break;
    }
  }
}

export enum AttackModifierType {

  plus0 = "plus0",
  plus1 = "plus1",
  plus2 = "plus2",
  minus1 = "minus1",
  minus2 = "minus2",
  null = "null",
  double = "double",
  bless = "bless",
  curse = "curse"

}

export enum AttackModifierValueType {
  plus = "plus",
  minus = "minus",
  multiply = "multiply"
}

export const defaultAttackModifier: AttackModifier[] = [
  new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), // 6x +0
  new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), // 5x +1
  new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), // 5x -1
  new AttackModifier(AttackModifierType.plus2),
  new AttackModifier(AttackModifierType.minus2),
  new AttackModifier(AttackModifierType.double),
  new AttackModifier(AttackModifierType.null)
];
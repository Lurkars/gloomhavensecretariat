export enum AttackModifierType {
  plus = "plus",
  plus0 = "plus0",
  plus1 = "plus1",
  plus2 = "plus2",
  plus3 = "plus3",
  plus4 = "plus4",
  plusX = "plusX",
  minus = "minus",
  minus1 = "minus1",
  minus2 = "minus2",
  null = "null",
  double = "double",
  bless = "bless",
  curse = "curse",
  empower = "empower",
  enfeeble = "enfeeble",
  invalid = "invalid",
}

export enum AttackModifierValueType {
  plus = "plus",
  minus = "minus",
  multiply = "multiply"
}

export class AttackModifier {

  id: string;
  type: AttackModifierType;
  value: number = 0;
  valueType: AttackModifierValueType = AttackModifierValueType.plus;
  shuffle: boolean = false;
  effects: AttackModifierEffect[];
  rolling: boolean;
  active: boolean;
  revealed: boolean = false;
  character: boolean = false;

  constructor(type: AttackModifierType, value: number = 0, id: string | undefined = undefined, effects: AttackModifierEffect[] = [], rolling: boolean = false, active: boolean = false) {
    this.type = type;
    this.value = value;
    this.id = id || type;
    this.effects = effects;
    this.rolling = rolling;
    this.active = active;
    switch (type) {
      case AttackModifierType.plus0:
        this.value = 0;
        break;
      case AttackModifierType.plus1:
        this.value = 1;
        break;
      case AttackModifierType.plus2:
        this.value = 2;
        break;
      case AttackModifierType.plus3:
        this.value = 3;
        break;
      case AttackModifierType.plus4:
        this.value = 4;
        break;
      case AttackModifierType.minus:
        this.valueType = AttackModifierValueType.minus;
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

export enum AttackModifierEffectType {
  area = "area",
  changeType = "changeType",
  condition = "condition",
  custom = "custom",
  element = "element",
  elementConsume = "elementConsume",
  elementHalf = "elementHalf",
  heal = "heal",
  pierce = "pierce",
  pull = "pull",
  push = "push",
  range = "range",
  refreshItem = "refreshItem",
  refreshSpentItem = "refreshSpentItem",
  recoverRandomDiscard = "recoverRandomDiscard",
  retaliate = "retaliate",
  shield = "shield",
  specialTarget = "specialTarget",
  summon = "summon",
  swing = "swing",
  target = "target",
  attack = "attack",
  or = "or"
}

export class AttackModifierEffect {

  type: AttackModifierEffectType;
  value: string;
  hint: string;
  effects: AttackModifierEffect[];
  icon: boolean = false;

  constructor(type: AttackModifierEffectType, value: string = "", hint: string = "", effects: AttackModifierEffect[] = []) {
    this.type = type;
    this.value = value;
    this.hint = hint;
    this.effects = effects;
  }
}

export const defaultAttackModifier: AttackModifier[] = [
  new AttackModifier(AttackModifierType.plus0),
  new AttackModifier(AttackModifierType.plus1),
  new AttackModifier(AttackModifierType.minus1),
  new AttackModifier(AttackModifierType.plus2),
  new AttackModifier(AttackModifierType.minus2),
  new AttackModifier(AttackModifierType.double),
  new AttackModifier(AttackModifierType.null),
  new AttackModifier(AttackModifierType.bless),
  new AttackModifier(AttackModifierType.curse)
];

export const defaultAttackModifierCards: string[] = [
  AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, // 6x +0
  AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, // 5x +1
  AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, // 5x -1
  AttackModifierType.plus2,
  AttackModifierType.minus2,
  AttackModifierType.double,
  AttackModifierType.null
];

export class AttackModifierDeck {

  attackModifiers: AttackModifier[];
  current: number;
  cards: AttackModifier[];
  disgarded: number[] = [];

  constructor() {
    this.attackModifiers = JSON.parse(JSON.stringify(defaultAttackModifier));
    this.current = -1;
    this.cards = defaultAttackModifierCards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
  }

  cardById(id: string): AttackModifier | undefined {
    let attackModifier = this.attackModifiers.find((attackModifier) => attackModifier.id == id);
    if (!attackModifier) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(attackModifier));
  }

  toModel(): GameAttackModifierDeckModel {
    return new GameAttackModifierDeckModel(this.current, this.cards.map((attackModifier) => attackModifier && attackModifier.id || ""), this.disgarded || []);
  }

  fromModel(model: GameAttackModifierDeckModel) {
    if (model.current != this.current) {
      this.current = +model.current;
    }

    this.cards = model.cards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
    this.disgarded = model.disgarded || [];
  }
}

export class GameAttackModifierDeckModel {
  current: number;
  cards: string[];
  disgarded: number[];

  constructor(current: number,
    cards: string[],
    disgarded: number[]) {
    this.current = current;
    this.cards = cards;
    this.disgarded = JSON.parse(JSON.stringify(disgarded));
  }
}
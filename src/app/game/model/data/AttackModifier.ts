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
  minus1extra = "minus1extra",
  empower = "empower",
  enfeeble = "enfeeble",
  invalid = "invalid",
  townguard = "townguard",
  wreck = "wreck",
  success = "success"
}

export enum AttackModifierValueType {
  default = "default",
  plus = "plus",
  minus = "minus",
  multiply = "multiply"
}

export class AttackModifier {

  id: string;
  type: AttackModifierType;
  value: number = 0;
  valueType: AttackModifierValueType;
  shuffle: boolean = false;
  effects: AttackModifierEffect[];
  rolling: boolean;
  active: boolean;
  revealed: boolean = false;
  character: boolean = false;

  constructor(type: AttackModifierType, value: number = 0, valueType: AttackModifierValueType = AttackModifierValueType.plus, id: string | undefined = undefined, effects: AttackModifierEffect[] = [], rolling: boolean = false, active: boolean = false) {
    this.type = type;
    this.value = value;
    this.valueType = valueType;
    if (id) {
      this.id = id;
    } else if (type == AttackModifierType.townguard) {
      this.id =  'tg-' + valueType + value;
    } else {
      this.id = (type != AttackModifierType.plus && type != AttackModifierType.minus) ? type : (type + value);
    }
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
      case AttackModifierType.minus1extra:
        this.valueType = AttackModifierValueType.minus;
        this.value = 1;
        break;
      case AttackModifierType.wreck:
        this.valueType = AttackModifierValueType.minus;
        this.value = 0;
        break;
      case AttackModifierType.success:
        this.value = 0;
        break;
    }
  }

  clone(): AttackModifier {
    return new AttackModifier(this.type, this.value, this.valueType, this.id, this.effects ? JSON.parse(JSON.stringify(this.effects)) : [], this.rolling, this.active);
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
  new AttackModifier(AttackModifierType.curse),
  new AttackModifier(AttackModifierType.minus1extra)
];

export const defaultAttackModifierCards: string[] = [
  // 6x +0
  AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0,
  // 5x +1
  AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1,
  // 5x -1
  AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1,
  // 1x +2
  AttackModifierType.plus2,
  // 1x -2
  AttackModifierType.minus2,
  // 1x x2
  AttackModifierType.double,
  // 1x x0
  AttackModifierType.null
];

export const defaultTownGuardAttackModifier: AttackModifier[] = [
  // 6x +0
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  new AttackModifier(AttackModifierType.townguard, 0, AttackModifierValueType.default),
  // 5x +10
  new AttackModifier(AttackModifierType.townguard, 10),
  new AttackModifier(AttackModifierType.townguard, 10),
  new AttackModifier(AttackModifierType.townguard, 10),
  new AttackModifier(AttackModifierType.townguard, 10),
  new AttackModifier(AttackModifierType.townguard, 10),
  // 1x +20
  new AttackModifier(AttackModifierType.townguard, 20),
  // 5x -10
  new AttackModifier(AttackModifierType.townguard, 10, AttackModifierValueType.minus),
  new AttackModifier(AttackModifierType.townguard, 10, AttackModifierValueType.minus),
  new AttackModifier(AttackModifierType.townguard, 10, AttackModifierValueType.minus),
  new AttackModifier(AttackModifierType.townguard, 10, AttackModifierValueType.minus),
  new AttackModifier(AttackModifierType.townguard, 10, AttackModifierValueType.minus),
  // 1x -20
  new AttackModifier(AttackModifierType.townguard, 20, AttackModifierValueType.minus),
  // 1x wreck
  new AttackModifier(AttackModifierType.wreck),
  // 1x success
  new AttackModifier(AttackModifierType.success)
];

export const CsOakDeckAttackModifier: AttackModifier[] = [
  // 8x 2x
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-527', [new AttackModifierEffect(AttackModifierEffectType.condition, 'bless', '', [new AttackModifierEffect(AttackModifierEffectType.specialTarget, 'allyShort')])]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-528', [new AttackModifierEffect(AttackModifierEffectType.condition, 'bless', '', [new AttackModifierEffect(AttackModifierEffectType.specialTarget, 'allyShort')])]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-529', [new AttackModifierEffect(AttackModifierEffectType.heal, '2', '', [new AttackModifierEffect(AttackModifierEffectType.range, '2')])]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-530', [new AttackModifierEffect(AttackModifierEffectType.heal, '2', '', [new AttackModifierEffect(AttackModifierEffectType.range, '2')])]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-531', [new AttackModifierEffect(AttackModifierEffectType.element, 'wild')]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-532', [new AttackModifierEffect(AttackModifierEffectType.element, 'wild')]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-533', [new AttackModifierEffect(AttackModifierEffectType.custom, 'All enemies adjacent to the target suffer %game.damage:1%')]),
  new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply, 'cs-oak-534', [new AttackModifierEffect(AttackModifierEffectType.custom, 'All enemies adjacent to the target suffer %game.damage:1%')]),
  // 8x rolling
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-535', [new AttackModifierEffect(AttackModifierEffectType.push, '2')], true),
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-536', [new AttackModifierEffect(AttackModifierEffectType.push, '2')], true),
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-537', [new AttackModifierEffect(AttackModifierEffectType.heal, '1', '', [new AttackModifierEffect(AttackModifierEffectType.range, '2')])], true),
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-538', [new AttackModifierEffect(AttackModifierEffectType.heal, '1', '', [new AttackModifierEffect(AttackModifierEffectType.range, '2')])], true),
  new AttackModifier(AttackModifierType.plus0, 0, AttackModifierValueType.plus, 'cs-oak-539', [new AttackModifierEffect(AttackModifierEffectType.condition, 'wound'), new AttackModifierEffect(AttackModifierEffectType.condition, 'muddle')], true),
  new AttackModifier(AttackModifierType.plus0, 0, AttackModifierValueType.plus, 'cs-oak-540', [new AttackModifierEffect(AttackModifierEffectType.condition, 'wound'), new AttackModifierEffect(AttackModifierEffectType.condition, 'muddle')], true),
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-541', [new AttackModifierEffect(AttackModifierEffectType.pierce, '3')], true),
  new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, 'cs-oak-542', [new AttackModifierEffect(AttackModifierEffectType.pierce, '3')], true)
];

export class AttackModifierDeck {

  attackModifiers: AttackModifier[];
  current: number;
  cards: AttackModifier[];
  disgarded: number[] = [];
  active: boolean = true;

  constructor(attackModifiers: AttackModifier[] | undefined = undefined) {
    this.attackModifiers = attackModifiers ? JSON.parse(JSON.stringify(attackModifiers.filter((am, index, self) => self.indexOf(am) == index))) : JSON.parse(JSON.stringify(defaultAttackModifier));
    this.current = -1;
    this.cards = attackModifiers ? JSON.parse(JSON.stringify(attackModifiers)) : defaultAttackModifierCards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
  }

  cardById(id: string): AttackModifier | undefined {
    let attackModifier = this.attackModifiers.find((attackModifier) => attackModifier.id == id);
    if (!attackModifier) {
      attackModifier = defaultAttackModifier.find((attackModifier) => attackModifier.id == id);
      if (!attackModifier) {
        attackModifier = CsOakDeckAttackModifier.find((attackModifier) => attackModifier.id == id);
      }
      if (!attackModifier) {
        attackModifier = defaultTownGuardAttackModifier.find((attackModifier) => attackModifier.id == id);
      }
      if (!attackModifier) {
        return undefined;
      }
    }
    return JSON.parse(JSON.stringify(attackModifier));
  }

  toModel(): GameAttackModifierDeckModel {
    return new GameAttackModifierDeckModel(this.current, this.cards.map((attackModifier) => attackModifier && attackModifier.id), this.disgarded, this.active);
  }

  fromModel(model: GameAttackModifierDeckModel) {
    if (model.current != this.current) {
      this.current = model.current;
    }

    this.cards = model.cards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
    this.disgarded = model.disgarded || [];
    this.active = model.active;
  }

  merge(attackModifierDeck: AttackModifierDeck) {
    this.attackModifiers = attackModifierDeck.attackModifiers;
    this.current = attackModifierDeck.current;
    this.cards = attackModifierDeck.cards;
    this.disgarded = attackModifierDeck.disgarded;
  }
}

export class GameAttackModifierDeckModel {
  current: number;
  cards: string[];
  disgarded: number[];
  active: boolean;

  constructor(current: number,
    cards: string[],
    disgarded: number[],
    active: boolean) {
    this.current = current;
    this.cards = cards;
    this.disgarded = JSON.parse(JSON.stringify(disgarded));
    this.active = active;
  }
}
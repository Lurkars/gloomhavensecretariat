import { AttackModifier, AttackModifierType } from "../AttackModifier";
import { Editional } from "../Editional";
import { CharacterData } from "./CharacterData";
import { ScenarioData } from "./ScenarioData";
import { MonsterData } from "./MonsterData";
import { Condition } from "../Condition";
import { DeckData } from "./DeckData";


export const defaultAttackModifier: AttackModifier[] = [
  new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), // 6x +0
  new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), // 5x +1
  new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), // 5x -1
  new AttackModifier(AttackModifierType.plus2),
  new AttackModifier(AttackModifierType.minus2),
  new AttackModifier(AttackModifierType.double),
  new AttackModifier(AttackModifierType.null)
];

export const defaultConditions: Condition[] = [ Condition.stun, Condition.immobilize, Condition.disarm, Condition.wound, Condition.muddle, Condition.poison, Condition.strengthen, Condition.invisible ];

export class EditionData implements Editional {
  // from Editional
  edition: string;

  characters: CharacterData[];
  monsters: MonsterData[];
  decks: DeckData[];
  scenarios: ScenarioData[];
  attackModifiers: AttackModifier[] = [];
  conditions: Condition[] = [];
  label: any = {};

  constructor(edition: string, characters: CharacterData[],
    monsters: MonsterData[],
    decks: DeckData[],
    scenarios: ScenarioData[],
    attackModifiers: AttackModifier[] | undefined = undefined,
    conditions: Condition[] | undefined = undefined) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
    this.decks = decks;
    this.scenarios = scenarios;
    if (attackModifiers) {
      this.attackModifiers = attackModifiers;
    }
    if (conditions) {
      this.conditions = conditions;
    }
  }

}
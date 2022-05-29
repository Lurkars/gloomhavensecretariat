import { AttackModifier, AttackModifierType } from "../AttackModifier";
import { Editional } from "../Editional";
import { CharacterData } from "./CharacterData";
import { ScenarioData } from "./ScenarioData";
import { MonsterData } from "./MonsterData";

export class EditionData implements Editional {
  // from Editional
  edition: string;

  characters: CharacterData[];
  monsters: MonsterData[];
  scenarios: ScenarioData[];
  attackModifiers: AttackModifier[] = [
    new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), new AttackModifier(AttackModifierType.plus0), // 6x +0
    new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus1), // 5x +1
    new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), new AttackModifier(AttackModifierType.minus1), // 5x -1
    new AttackModifier(AttackModifierType.plus2),
    new AttackModifier(AttackModifierType.minus2),
    new AttackModifier(AttackModifierType.double),
    new AttackModifier(AttackModifierType.null)
  ];

  constructor(edition: string, characters: CharacterData[],
    monsters: MonsterData[],
    scenarios: ScenarioData[],
    attackModifiers: AttackModifier[] | undefined = undefined) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
    this.scenarios = scenarios;
    if (attackModifiers) {
      this.attackModifiers = attackModifiers;
    }
  }

}
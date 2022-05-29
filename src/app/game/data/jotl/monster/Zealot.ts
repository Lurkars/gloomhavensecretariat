import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Condition } from "src/app/game/model/Condition";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { Edition } from "src/app/game/model/Edition";
import { Element } from "src/app/game/model/Element";
import { MonsterAbility } from "src/app/game/model/MonsterAbility";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";

export const Zealot: MonsterData = new MonsterData("zealot", 6,
  [
    new MonsterAbility("Nothing Special", 50, [ new Action(ActionType.move, 0, ActionValueType.plus), new Action(ActionType.attack, 0, ActionValueType.plus) ], false),

    new MonsterAbility("Hasty Assoult", 35, [ new Action(ActionType.move, 1, ActionValueType.plus), new Action(ActionType.attack, 1, ActionValueType.minus) ], false),

    new MonsterAbility("Calculated Strike", 65, [ new Action(ActionType.move, 1, ActionValueType.minus), new Action(ActionType.attack, 1, ActionValueType.plus) ], false),

    new MonsterAbility("Drain Life", 27, [ new Action(ActionType.move, 0, ActionValueType.plus), new Action(ActionType.attack, 1, ActionValueType.minus, [ new Action(ActionType.range, 2, ActionValueType.plus) ]),
    new Action(ActionType.heal, "X", ActionValueType.fixed, [
      new Action(ActionType.self), new Action(ActionType.custom, "X is damage suffered by target of attack") ]
    ), new Action(ActionType.element, Element.dark, ActionValueType.plus) ], true),

    new MonsterAbility("Boil Blood", 46, [ new Action(ActionType.attack, 1, ActionValueType.minus, [ new Action(ActionType.range, 2), new Action(ActionType.target, 2), new Action(ActionType.condition, Condition.muddle) ]), new Action(ActionType.element, Element.fire, ActionValueType.minus, [ new Action(ActionType.range, 2, ActionValueType.plus) ]) ], false),


    new MonsterAbility("Vile Scourge", 77, [ new Action(ActionType.move, 1, ActionValueType.minus), new Action(ActionType.attack, 1, ActionValueType.minus, [ new Action(ActionType.area, "(0,1,false)|(1,0,true)|(1,1,true)"), new Action(ActionType.condition, Condition.poison, ActionValueType.plus) ]), new Action(ActionType.element, Element.air, ActionValueType.minus, [ new Action(ActionType.attack, 1, ActionValueType.plus) ]) ], false),


    new MonsterAbility("Hex Whip", 19, [ new Action(ActionType.move, 1, ActionValueType.plus, [ new Action(ActionType.jump) ]), new Action(ActionType.attack, 1, ActionValueType.minus, [ new Action(ActionType.condition, Condition.curse, ActionValueType.plus) ]), new Action(ActionType.element, Element.air, ActionValueType.plus) ]
      , false),


    new MonsterAbility("Unholy Flame", 82, [ new Action(ActionType.attack, 1, ActionValueType.plus, [ new Action(ActionType.range, 3) ]), new Action(ActionType.element, Element.fire, ActionValueType.plus) ], true),

  ], [

  // level 0
  new MonsterStat(MonsterType.normal, 0, 4, 2, 2, 0),
  new MonsterStat(MonsterType.elite, 0, 7, 2, 3, 0),
  // level 1
  new MonsterStat(MonsterType.normal, 1, 6, 2, 2, 0),
  new MonsterStat(MonsterType.elite, 1, 8, 2, 3, 0, [ Condition.wound ]),
  // level 2
  new MonsterStat(MonsterType.normal, 2, 7, 3, 3, 0),
  new MonsterStat(MonsterType.elite, 2, 11, 3, 3, 0, [ Condition.wound ]),
  // level 3
  new MonsterStat(MonsterType.normal, 3, 8, 3, 3, 0, [ Condition.wound ]),
  new MonsterStat(MonsterType.elite, 3, 13, 3, 4, 0, [ Condition.wound ]),
  // level 4
  new MonsterStat(MonsterType.normal, 4, 10, 3, 3, 0, [ Condition.wound ]),
  new MonsterStat(MonsterType.elite, 4, 17, 3, 4, 0, [ Condition.wound ]),
  // level 5
  new MonsterStat(MonsterType.normal, 5, 12, 4, 3, 0, [ Condition.wound ]),
  new MonsterStat(MonsterType.elite, 5, 18, 4, 5, 0, [ Condition.wound ]),
  // level 6
  new MonsterStat(MonsterType.normal, 6, 14, 4, 4, 0, [ Condition.wound ]),
  new MonsterStat(MonsterType.elite, 6, 22, 4, 6, 0, [ Condition.wound ]),
  // level 7
  new MonsterStat(MonsterType.normal, 7, 16, 4, 5, 0, [ Condition.wound ]),
  new MonsterStat(MonsterType.elite, 7, 26, 4, 7, 0, [ Condition.wound ]),
], Edition.jotl);
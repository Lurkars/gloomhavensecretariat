import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Condition } from "src/app/game/model/Condition";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { Edition } from "src/app/game/model/Edition";
import { Monster } from "src/app/game/model/Monster";
import { MonsterAbility } from "src/app/game/model/MonsterAbility";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";

export const BloodTumor: MonsterData = new MonsterData("blood-tumor", 1,
  [
    new MonsterAbility("Accelerated Power", 11, [ new Action(ActionType.special, 2) ]),
    new MonsterAbility("Accelerated Power", 14, [ new Action(ActionType.special, 2) ]),
    new MonsterAbility("Accelerated Power", 17, [ new Action(ActionType.special, 2) ], true),
    new MonsterAbility("Lingering Strenth", 85, [ new Action(ActionType.special, 1) ], true),
    new MonsterAbility("Lingering Strenth", 79, [ new Action(ActionType.special, 1) ]),
    new MonsterAbility("Lingering Strenth", 73, [ new Action(ActionType.special, 1) ]),
    new MonsterAbility("Nothing Speical", 36, [ new Action(ActionType.move, 0, ActionValueType.plus), new Action(ActionType.attack, 0, ActionValueType.plus) ]),
    new MonsterAbility("Twin Missiles", 54, [ new Action(ActionType.move, 1, ActionValueType.minus), new Action(ActionType.attack, 1, ActionValueType.minus, [ new Action(ActionType.range, 3), new Action(ActionType.target, 2) ]) ])
  ], [
  // level 0
  new MonsterStat(MonsterType.boss, 0, "7xC", 0, "C-1", 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 1
  new MonsterStat(MonsterType.boss, 1, 6, 2, 2, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 2
  new MonsterStat(MonsterType.boss, 2, 7, 3, 3, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 3
  new MonsterStat(MonsterType.boss, 3, 8, 3, 3, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 4
  new MonsterStat(MonsterType.boss, 4, 10, 3, 3, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 5
  new MonsterStat(MonsterType.boss, 5, 12, 4, 3, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 6
  new MonsterStat(MonsterType.boss, 6, 14, 4, 4, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
  // level 7
  new MonsterStat(MonsterType.boss, 7, 16, 4, 5, 0, [], [], [], [
    new Action(ActionType.heal, "C+2", ActionValueType.fixed, [ new Action(ActionType.self) ]),
    new Action(ActionType.heal, "2", ActionValueType.fixed, [ new Action(ActionType.custom, "Target all allies") ])
  ]),
], Edition.jotl, true);
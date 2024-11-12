import { Action } from "./Action";
import { Editional } from "./Editional";
import { Identifier } from "./Identifier";
import { LootClass, LootType } from "./Loot";
import { SummonData } from "./SummonData";

export class ItemData implements Editional {

  id: number | string = "";
  name: string = "";
  replace: boolean = false;
  cost: number = 0;
  count: number = 0;
  edition: string = "";
  slot: ItemSlot | undefined = undefined;
  actions: Action[] = [];
  actionsBack: Action[] | undefined = undefined;
  random: boolean = false;
  blueprint: boolean = false;
  spent: boolean = false;
  consumed: boolean = false;
  persistent: boolean = false;
  loss: boolean = false;
  round: boolean = false;
  slots: number = 0;
  slotsBack: number = 0;
  minusOne: number = 0;
  solo: string = "";
  unlockScenario: Identifier | undefined;
  unlockProsperity: number = 0;
  summon: SummonData | undefined;
  resources: Partial<Record<LootType, number>> = {};
  resourcesAny: Record<LootClass, number>[] = [];
  requiredItems: number[] = [];
  requiredBuilding: string = "";
  requiredBuildingLevel: number = 0;
  effects: ItemEffect[] = [];
  effectsBack: ItemEffect[] = [];
  backArtwork: boolean = false;
}

export enum ItemSlot {

  head = "head",
  body = "body",
  legs = "legs",
  onehand = "onehand",
  twohand = "twohand",
  small = "small"

}

export enum ItemEffectType {
  condition = "condition",
  immune = "immune",
  heal = "heal",
  damage = "damage",
  element = "element",
  initiative = "initiative",
  refreshSpent = "refreshSpent",
  removeNegativeConditions = "removeNegativeConditions"
}

export type ItemEffect = { type: ItemEffectType, value: number | string, always: true | undefined };

export enum ItemResourceTypes {
  arrowvine = "arrowvine",
  axenut = "axenut",
  corpsecap = "corpsecap",
  flamefruit = "flamefruit",
  rockroot = "rockroot",
  snowthistle = "snowthistle",
  hide = "hide",
  lumber = "lumber",
  metal = "metal",
}

export enum ItemFlags {
  spent = "spent",
  consumed = "consumed",
  flipped = "flipped",
  persistend = "persistend",
  slot = "slot",
  slotBack = "slotBack"
}
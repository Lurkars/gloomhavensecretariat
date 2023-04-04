import { Editional } from "./Editional";
import { Identifier } from "./Identifier";
import { LootType } from "./Loot";
import { SummonData } from "./SummonData";

export class ItemData implements Editional {

  id: number = 0;
  name: string = "";
  cost: number = 0;
  count: number = 0;
  edition: string = "";
  slot: ItemSlot = ItemSlot.small;
  random: boolean = false;
  spent: boolean = false;
  consumed: boolean = false;
  slots: number = 0;
  minusOne: number = 0;
  solo: string = "";
  unlockScenario: Identifier | undefined;
  unlockProsperity: number = 0;
  summon: SummonData | undefined;
  resources: Partial<Record<LootType, number>> = {};
  requiredItems: number[] = [];
  requiredBuilding: string = "";
  requiredBuildingLevel: number = 0;
}

export enum ItemSlot {

  head = "head",
  body = "body",
  legs = "legs",
  onehand = "onehand",
  twohand = "twohand",
  small = "small"

}

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
import { Identifier } from "./Identifier";
import { LootType } from "./Loot";

export class CharacterProgress {

  experience: number = 0;
  gold: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  items: Identifier[] = [];
  personalQuest: number = 0;
  battleGoals: number = 0;
  notes: string = "";
  retired: boolean = false;
  retirements: number = 0;
  perks: number[] = [];
  donations: number = 0;

}
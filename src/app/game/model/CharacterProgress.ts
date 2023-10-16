import { AdditionalIdentifier, Identifier } from "./data/Identifier";
import { LootType } from "./data/Loot";

export class CharacterProgress {

  experience: number = 0;
  gold: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  itemNotes: string = "";
  items: Identifier[] = [];
  equippedItems: AdditionalIdentifier[] = [];
  personalQuest: string = "";
  personalQuestProgress: number[] = [];
  battleGoals: number = 0;
  notes: string = "";
  retired: boolean = false;
  retirements: number = 0;
  extraPerks: number = 0;
  perks: number[] = [];
  masteries: number[] = [];
  donations: number = 0;

}
import { Identifier } from "./Identifier";

export class CharacterProgress {

  experience: number = 0;
  gold: number = 0;
  loot: number = 0;
  items: Identifier[] = [];
  personalQuest: number = 0;
  battleGoals: number = 0;
  notes: string = "";
  retired: boolean = false;
  retirements: number = 0;
  perks: number[] = [];

}
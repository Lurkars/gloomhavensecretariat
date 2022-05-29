import { Action } from "./Action";

export class MonsterAbility {
  name: string;
  initiative: number;
  actions: Action[];
  shuffle: boolean;

  constructor(name: string, initiative: number,
    actions: Action[],
    shuffle: boolean = false) {
    this.name = name;
    this.initiative = initiative;
    this.actions = actions;
    this.shuffle = shuffle;
  }
}


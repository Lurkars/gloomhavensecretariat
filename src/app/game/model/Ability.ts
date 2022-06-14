import { Action } from "./Action";

export class Ability {
  name: string;
  initiative: number;
  actions: Action[];
  shuffle: boolean;
  bottomActions: Action[] | undefined;

  constructor(name: string, initiative: number,
    actions: Action[],
    shuffle: boolean = false, bottomActions: Action[] | undefined = undefined) {
    this.name = name;
    this.initiative = initiative;
    this.actions = actions;
    this.shuffle = shuffle;
    this.bottomActions = bottomActions;
  }
}


import { Action } from "./Action";

export class Ability {
  cardId: number | undefined;
  name: string | undefined;
  initiative: number;
  actions: Action[];
  shuffle: boolean;
  hint: string | undefined;

  constructor(cardId: number | undefined, name: string | undefined, initiative: number,
    actions: Action[],
    shuffle: boolean = false, hint: string | undefined = undefined) {
    this.cardId = cardId;
    this.name = name;
    this.initiative = initiative;
    this.actions = actions;
    this.shuffle = shuffle;
    this.hint = hint;
  }
}


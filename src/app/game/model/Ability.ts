import { Action } from "./Action";

export class Ability {
  cardId: number | undefined;
  name: string | undefined;
  initiative: number;
  actions: Action[];
  shuffle: boolean;
  bottomActions: Action[];
  hint: string | undefined;

  constructor(cardId: number | undefined, name: string | undefined, initiative: number,
    actions: Action[],
    shuffle: boolean = false, bottomActions: Action[] = [], hint: string | undefined = undefined) {
    this.cardId = cardId;
    this.name = name;
    this.initiative = initiative;
    this.actions = actions;
    this.shuffle = shuffle;
    this.bottomActions = bottomActions;
    this.hint = hint;
  }
}


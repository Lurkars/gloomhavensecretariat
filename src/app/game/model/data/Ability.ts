import { Action } from "./Action";

export class Ability {
  cardId: number | undefined;
  name: string | undefined;
  initiative: number;
  level: number | string = 0;
  shuffle: boolean;
  actions: Action[];
  lost: boolean = false;
  round: boolean = false;
  persistent: boolean = false;
  loss: boolean = false;
  xp: number = 0;
  bottomActions: Action[];
  bottomLost: boolean = false;
  bottomRound: boolean = false;
  bottomPersistent: boolean = false;
  bottomLoss: boolean = false;
  bottomXp: number = 0;
  bottomShuffle: boolean = false;
  hint: string | undefined;
  revealed: boolean = false;

  constructor(cardId: number | undefined = undefined, name: string | undefined = undefined, initiative: number = 0,
    actions: Action[] = [],
    shuffle: boolean = false, bottomActions: Action[] = [], level: number = 0, hint: string | undefined = undefined) {
    this.cardId = cardId;
    this.name = name;
    this.initiative = initiative;
    this.actions = actions;
    this.shuffle = shuffle;
    this.bottomActions = bottomActions;
    this.level = level;
    this.hint = hint;
  }
}
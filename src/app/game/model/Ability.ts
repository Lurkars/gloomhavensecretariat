import { Action } from "./Action";

export class Ability {
  cardId: number | undefined;
  name: string | undefined;
  initiative: number;
  actions: Action[];
  shuffle: boolean;
  bottomActions: Action[];
  level: number | string = 0;
  hint: string | undefined;
  types: AbilityCardType[] = [];
  slots: number = 0;
  bottomTypes: AbilityCardType[] = [];
  bottomSlots: number = 0;
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

export enum AbilityCardType {

  lost = "lost",
  infinity = "infinity",
  round = "round"

}
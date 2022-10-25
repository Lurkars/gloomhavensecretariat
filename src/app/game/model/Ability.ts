import { Action } from "./Action";

export class Ability {
  cardId: number | undefined;
  name: string | undefined;
  initiative: number;
  level: number | string = 0;
  shuffle: boolean;
  actions: Action[];
  lost: boolean = false;
  bottomActions: Action[];
  bottomLost: boolean = false;
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

export enum AbilityCardType {

  experience = "experience",
  infinity = "infinity",
  lost = "lost",
  recover = "recover",
  refresh = "refresh",
  round = "round",
  slot = "slot",
  slotXp = "slotXp"

}
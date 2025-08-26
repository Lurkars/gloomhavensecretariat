import { Action } from "./Action";

export class SummonData {

  name: string = "";
  cardId: string = "";
  edition: string = "";
  health: number | string = 0;
  attack: number | string = 0;
  movement: number | string = 0;
  range: number | string = 0;
  flying: boolean = false;
  action: Action | undefined;
  additionalAction: Action | undefined;
  level: number | undefined;
  special: boolean = false;
  count: number = 1;
  enhancements: ("heal" | "attack" | "move" | "range")[] = [];
  thumbnail: boolean = false;
  thumbnailUrl: string | undefined;
  noThumbnail: boolean = false;

}
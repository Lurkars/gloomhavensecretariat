import { Editional } from "./data/Editional";

export interface Figure extends Editional {
  name: string;
  level: number;
  off: boolean;
  active: boolean;
  getInitiative(): number;
}
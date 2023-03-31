import { Editional } from "./Editional";
import { Identifier } from "./Identifier";

export interface Figure extends Editional {
  name: string;
  level: number;
  off: boolean;
  active: boolean;
  getInitiative(): number;
}

export type FigureCounter = { identifier: Identifier, total: number, killed: number };
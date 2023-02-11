
export enum FigureErrorType {
  deck = "deck",
  monsterEdition = "monsterEdition",
  monsterType = "monsterType",
  stat = "stat",
  unknown = "unknown"
}

export class FigureError {

  type: FigureErrorType;
  args: string[];

  constructor(type: FigureErrorType, ...args: string[]) {
    this.type = type;
    this.args = args;
  }
}
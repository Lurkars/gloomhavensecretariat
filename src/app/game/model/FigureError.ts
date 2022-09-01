
export enum FigureErrorType {
  deck = "deck",
  stat = "stat",
  monsterType = "monsterType",
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
export interface Figure {
  name : string;
  level: number;
  off : boolean;
  getInitiative(): number;
}
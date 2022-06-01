export interface Figure {
  name: string;
  level: number;
  off: boolean;
  active: boolean;
  getInitiative(): number;
}
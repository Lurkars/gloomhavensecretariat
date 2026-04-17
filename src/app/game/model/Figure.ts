import { Editional } from 'src/app/game/model/data/Editional';

export interface Figure extends Editional {
  name: string;
  level: number;
  off: boolean;
  active: boolean;
  getInitiative(): number;
  type: string;
}

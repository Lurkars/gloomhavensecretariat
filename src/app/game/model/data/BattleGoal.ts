import { Editional } from 'src/app/game/model/data/Editional';
import { Identifier } from 'src/app/game/model/data/Identifier';

export class BattleGoal implements Editional {
  cardId: string = '';
  name: string = '';
  checks: number = 1;
  alias: Identifier | undefined;

  // from Editional
  edition: string = '';
}

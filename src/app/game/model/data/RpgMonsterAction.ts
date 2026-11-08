import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { MonsterType } from 'src/app/game/model/data/MonsterType';

export class RpgMonsterAction {
  label: string;
  elite: boolean;
  actions: Action[];
  speeds: number[];

  constructor(label: string, elite: boolean, actions: Action[], speeds: number[] = []) {
    this.label = label;
    this.elite = elite;
    this.actions = actions;
    this.speeds = speeds;
  }
}

export function rpgMonsterActions(abilityCard: AbilityCard | undefined): RpgMonsterAction[] {
  if (!abilityCard) {
    return [];
  }
  return abilityCard.actions
    .map((action) => {
      const elite = action.type === ActionType.monsterType && action.value === MonsterType.elite;
      const box = elite ? action.subActions[0] : action;
      return box && box.type === ActionType.box ? new RpgMonsterAction('' + box.value, elite, box.subActions) : undefined;
    })
    .filter((action) => !!action) as RpgMonsterAction[];
}

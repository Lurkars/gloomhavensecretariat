import {
  Component, Input,
} from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Condition, ConditionName, EntityCondition } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterStat } from "src/app/game/model/MonsterStat";

@Component({
  selector: 'ghs-conditions',
  templateUrl: './conditions.html',
  styleUrls: [ './conditions.scss' ]
})
export class ConditionsComponent {

  @Input() entity!: Entity;
  @Input() figure!: Figure;
  @Input() type!: string;

  gameManager: GameManager = gameManager;

  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.entity, condition);
  }

  isImmune(conditionName: ConditionName) {

    if (!(this.figure instanceof Monster)) {
      return false;
    }

    if (!(this.entity instanceof MonsterEntity)) {
      return false;
    }

    const stat = this.figure.stats.find((monsterStat: MonsterStat) => monsterStat.level == this.entity.level && monsterStat.type == (this.entity as MonsterEntity).type);

    return stat && stat.immunities && stat.immunities.indexOf(conditionName as string) != -1;
  }

  inc(condition: Condition) {
    condition.value = this.getValue(condition) + 1;
    this.checkUpdate(condition);
  }

  dec(condition: Condition) {
    condition.value = this.getValue(condition) - 1;
    if (condition.value < 1) {
      condition.value = 1;
    }
    this.checkUpdate(condition);
  }

  getValue(condition: Condition): number {
    const entityCondition = this.entity.entityConditions.find((entityCondition: EntityCondition) => entityCondition.name == condition.name && !entityCondition.expired);

    if (entityCondition) {
      return entityCondition.value;
    }

    return condition.value;
  }

  checkUpdate(condition: Condition) {
    const entityCondition = this.entity.entityConditions.find((entityCondition: EntityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
    if (entityCondition) {
      gameManager.stateManager.after();
      entityCondition.value = condition.value;
      gameManager.stateManager.after();
    }
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleCondition(this.entity, condition, this.figure.active, this.figure.off);
    gameManager.stateManager.after();
  }
}
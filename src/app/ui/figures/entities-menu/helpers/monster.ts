import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { SummonState } from "src/app/game/model/Summon";
import { ghsDefaultDialogPositions, ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { MonsterNumberPickerDialog } from "../../monster/dialogs/numberpicker-dialog";
import type { EntitiesMenuDialogComponent } from '../entities-menu-dialog';

export class MonsterHelper {

    constructor(private component: EntitiesMenuDialogComponent) { }

    update() {
        this.component.isMonster = this.component.figure instanceof Monster && (!this.component.figure.isAlly && !this.component.figure.isAllied || !settingsManager.settings.alwaysAllyAttackModifierDeck && !gameManager.fhRules()) || this.component.figure instanceof ObjectiveContainer && this.component.figure.amDeck == 'M';

        if (gameManager.buildingsManager.petsEnabled && this.component.entity instanceof MonsterEntity && this.component.figure instanceof Monster && this.component.figure.pet) {
            this.component.catching = true;
            this.component.catchingDisabled = gameManager.game.figures.find((figure) => figure instanceof Character && figure.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || !item.tags.includes(ItemFlags.consumed)))) == undefined;
        }

        if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity) {
            this.component.actionHints = gameManager.actionsManager.calcActionHints(this.component.figure, this.component.entity).map((actionHint) => new Action(actionHint.type, actionHint.value, ActionValueType.fixed, actionHint.range ? [new Action(ActionType.range, actionHint.range, ActionValueType.fixed, [], true)] : []));
        }
    }

    toggleType() {
        if (this.component.figure instanceof Monster) {
            const monster = this.component.figure;
            if (this.component.entities.some((entity) => entity instanceof MonsterEntity && (entity.type == MonsterType.normal || entity.type == MonsterType.elite))) {
                this.component.before('toggleType');
                this.component.entities.forEach((entity) => {
                    if (this.component.figure && gameManager.entityManager.isAlive(entity) && entity instanceof MonsterEntity) {
                        gameManager.monsterManager.changeType(entity, monster);
                    }
                });
                gameManager.stateManager.after();
            }
        }
    }

    toggleSummon() {
        if (this.component.entity instanceof MonsterEntity) {
            let summonState = SummonState.false;
            if (this.component.entity.summon == SummonState.false) {
                summonState = SummonState.new;
            } else if (this.component.entity.summon == SummonState.new) {
                summonState = SummonState.true;
            }

            this.component.before("setSummonState", summonState);
            this.component.entity.summon = summonState;
            gameManager.stateManager.after();
        }
    }

    changeMonsterEntity() {
        if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity) {
            if (gameManager.monsterManager.monsterStandeeMax(this.component.figure) > 1 || this.component.entity.type != MonsterType.boss) {
                this.component.dialog.open(MonsterNumberPickerDialog, {
                    panelClass: ['dialog'],
                    data: {
                        monster: this.component.figure,
                        entity: this.component.entity,
                        change: true
                    },
                    positionStrategy: this.component.overlay.position().flexibleConnectedTo(this.component.data.positionElement).withPositions(ghsDefaultDialogPositions())
                })
                ghsDialogClosingHelper(this.component.dialogRef, false);
            }
        }
    }
}

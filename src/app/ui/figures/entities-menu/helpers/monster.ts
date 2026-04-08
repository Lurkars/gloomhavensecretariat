import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { PetIdentifier } from "src/app/game/model/data/PetCard";
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

    catchMonster(force: boolean = false) {
        if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity && this.component.catching && (!this.component.catchingDisabled || force)) {
            gameManager.stateManager.before('buildings.stables.pets.catch', 'data.monster.' + this.component.figure.name, '%game.monsterType.' + this.component.entity.type + '%', '%game.monsterType.' + this.component.entity.type + '.' + this.component.entity.number + '%');

            this.component.entity.dead = true;

            if (this.component.figure.entities.every((monsterEntity) => monsterEntity.dead)) {
                if (this.component.figure.active) {
                    gameManager.roundManager.toggleFigure(this.component.figure);
                }
            }

            if (gameManager.game.party.pets.find((value) => this.component.figure instanceof Monster && value.edition == this.component.figure.edition && value.name == this.component.figure.pet) == undefined) {
                gameManager.game.party.pets.push(new PetIdentifier(this.component.figure.pet, this.component.figure.edition));
                const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || !item.tags.includes(ItemFlags.consumed)))) as Character;
                if (character && !force) {
                    const item = character.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || !item.tags.includes(ItemFlags.consumed)));
                    if (item) {
                        item.tags = item.tags || [];
                        item.tags.push(ItemFlags.consumed);
                    }
                }
            }

            setTimeout(() => {
                if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity) {
                    gameManager.monsterManager.removeMonsterEntity(this.component.figure, this.component.entity);
                    gameManager.stateManager.after();
                }
            }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
            ghsDialogClosingHelper(this.component.dialogRef, true);
        }
    }

}
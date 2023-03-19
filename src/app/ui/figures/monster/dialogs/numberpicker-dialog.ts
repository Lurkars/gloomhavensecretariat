import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/MonsterType";


@Component({
    selector: 'ghs-monster-numberpicker-dialog',
    templateUrl: 'numberpicker-dialog.html',
    styleUrls: ['./numberpicker-dialog.scss']
})
export class MonsterNumberPickerDialog implements OnInit {

    monster: Monster;
    type: MonsterType;
    min: number;
    max: number;
    range: number[];
    summon: boolean = false;
    MonsterType = MonsterType;
    entity: MonsterEntity | undefined;
    entities: MonsterEntity[] | undefined;
    settingsManager: SettingsManager = settingsManager;

    constructor(@Inject(DIALOG_DATA) data: { monster: Monster, type: MonsterType, min: number, max: number, range: number[], entity: MonsterEntity | undefined, entities: MonsterEntity[] | undefined }, private dialogRef: DialogRef) {
        this.monster = data.monster;
        this.type = data.type;
        this.min = data.min;
        this.max = data.max;
        this.range = data.range;
        this.entity = data.entity;
        this.entities = data.entities;
        if (!this.entity) {
            this.entity = this.entities && this.entities.find((entity) => entity.number < 0) || undefined;
        }
        if (this.entity) {
            this.type = this.entity.type;
        }
    }

    ngOnInit(): void {
        this.range = Array.from(Array(this.max).keys()).map(x => x + this.min);
    }

    hasEntity(): boolean {
        return this.monster.entities.filter((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && (!settingsManager.settings.hideStats || monsterEntity.type == this.type)).length > 0;
    }

    hasNumber(number: number) {
        return this.monster.entities.some((monsterEntity) => {
            return monsterEntity.number == number && gameManager.entityManager.isAlive(monsterEntity);
        })
    }

    randomStandee() {
        const count = EntityValueFunction(this.monster.count, this.monster.level);
        let number = Math.floor(Math.random() * count) + 1;
        while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
            number = Math.floor(Math.random() * count) + 1;
        }
        this.pickNumber(number, true, false);
    }

    nextStandee() {
        let number = 1;
        while (this.monster.entities.some((monsterEntity) => monsterEntity.number == number)) {
            number += 1;
        }
        this.pickNumber(number, true, true);
    }

    pickNumber(number: number, automatic: boolean = false, next: boolean = false) {
        if (!this.hasNumber(number) && this.type) {
            let undoType = "addStandee";
            if (automatic && !next) {
                undoType = "addRandomStandee";
            } else if (automatic) {
                undoType = "addNextStandee";
            }
            gameManager.stateManager.before(undoType, "data.monster." + this.monster.name, "monster." + this.type, "" + number);
            const dead = this.monster.entities.find((monsterEntity) => monsterEntity.number == number);
            if (dead) {
                gameManager.monsterManager.removeMonsterEntity(this.monster, dead);
            }
            if (this.entity) {
                this.entity.number = number;
                this.entity = this.entities && (this.entities.find((entity) => entity.number < 0 && entity.type == this.type) || this.entities.find((entity) => entity.number < 0)) || undefined;
                if (this.entity) {
                    this.type = this.entity.type;
                }
            } else {
                const entity = gameManager.monsterManager.addMonsterEntity(this.monster, number, this.type, this.summon);

                if (gameManager.game.state == GameState.next && entity) {
                    this.monster.active = !gameManager.game.figures.some((figure) => figure.active);
                    if (this.monster.active) {
                        gameManager.sortFigures();
                        entity.active = true;
                    }
                }
            }
            gameManager.stateManager.after();
            if ((this.entities ? this.monster.entities.filter((entity) => entity.number > 0).length : gameManager.entityManager.entities(this.monster).length) == EntityValueFunction(this.monster.count, this.monster.level) || !this.entity && this.entities) {
                this.dialogRef.close();
            } else if (this.entity && this.entities && this.monster.entities.filter((entity) => entity.number > 0).length == EntityValueFunction(this.monster.count, this.monster.level) - 1) {
                this.nextStandee();
            }
        }
    }

}
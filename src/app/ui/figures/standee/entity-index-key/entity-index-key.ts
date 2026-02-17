import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { Entity } from 'src/app/game/model/Entity';

@Component({
    standalone: false,
    selector: 'ghs-entity-index-key',
    templateUrl: './entity-index-key.html',
    styleUrls: ['./entity-index-key.scss']
})
export class EntityIndexKeyComponent implements OnInit, DoCheck {

    gameManager: GameManager = gameManager;
    @Input() entity!: Entity;
    @Input() show: boolean = false;

    entityIndex: number = -1;
    isKeyboardSelecting: 's' | 'w' | false = false;
    keyboardSelect: number = -1;

    constructor(private ghsManager: GhsManager) {
        this.ghsManager.uiChangeEffect(() => this.update());
    }

    ngOnInit(): void {
        this.update();
    }

    ngDoCheck(): void {
        this.isKeyboardSelecting = gameManager.stateManager.keyboardSelecting;
        this.keyboardSelect = gameManager.stateManager.keyboardSelect;
    }

    update(): void {
        this.isKeyboardSelecting = gameManager.stateManager.keyboardSelecting;
        this.keyboardSelect = gameManager.stateManager.keyboardSelect;
        this.entityIndex = gameManager.entityManager.getIndexForEntity(this.entity, this.isKeyboardSelecting === 'w');
        if (this.entityIndex != -1) {
            this.entityIndex++;
        }
    }
}
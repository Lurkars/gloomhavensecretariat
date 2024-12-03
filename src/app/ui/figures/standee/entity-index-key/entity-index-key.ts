import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Entity } from 'src/app/game/model/Entity';
import { Subscription } from 'rxjs';

@Component({
	standalone: false,
    selector: 'ghs-entity-index-key',
    templateUrl: './entity-index-key.html',
    styleUrls: ['./entity-index-key.scss']
})
export class EntityIndexKeyComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    @Input() entity!: Entity;
    @Input() show: boolean = false;

    entityIndex: number = -1;

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update(): void {
        this.entityIndex = gameManager.entityManager.getIndexForEntity(this.entity, gameManager.stateManager.keyboardSelecting === 'w');
        if (this.entityIndex != -1) {
            this.entityIndex++;
        }
    }
}
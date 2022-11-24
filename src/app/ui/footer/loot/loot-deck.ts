import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, Input, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { LootType } from "src/app/game/model/Loot";
import { LootDeckDialogComponent } from "./loot-deck-dialog";
import { LootDeckFullscreenComponent } from "./loot-deck-fullscreen";

@Component({
    selector: 'ghs-loot-deck',
    templateUrl: './loot-deck.html',
    styleUrls: ['./loot-deck.scss']
})
export class LootDeckComponent implements OnInit {

    @Input() bottom: boolean = false;
    @Input() fullscreen: boolean = true;
    @Input() vertical: boolean = false;
    gameManager: GameManager = gameManager;
    lootManager: LootManager = gameManager.lootManager;
    current: number = -1;
    drawing: boolean = false;
    LootType = LootType;
    GameState = GameState;

    constructor(private element: ElementRef, private dialog: Dialog) {
        this.current = gameManager.game.lootDeck.current;
        this.element.nativeElement.addEventListener('click', (event: any) => {
            let elements = document.elementsFromPoint(event.clientX, event.clientY);
            if (elements[0].classList.contains('deck') && elements.length > 2) {
                (elements[2] as HTMLElement).click();
            }
        })
    };

    ngOnInit(): void {
        gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    update() {
        if (this.current != gameManager.game.lootDeck.current) {
            this.current = gameManager.game.lootDeck.current;
            this.drawing = true;
            this.element.nativeElement.getElementsByClassName('deck')[0].classList.add('drawing');
            setTimeout(() => {
                this.element.nativeElement.getElementsByClassName('deck')[0].classList.remove('drawing');
                this.drawing = false;
            }, 1100);
        }
    }

    draw(event: any) {
        if (this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else if (!this.drawing && gameManager.game.state == GameState.next) {
            gameManager.stateManager.before('lootDeckDraw')
            this.lootManager.drawCard();
            gameManager.stateManager.after();
        } else {
            this.open(event);
        }
    }


    openFullscreen(event: any) {
        if (this.fullscreen) {
            this.dialog.open(LootDeckFullscreenComponent, {
                backdropClass: 'fullscreen-backdrop'
            });
            event.preventDefault();
            event.stopPropagation();
        }
    }

    open(event: any) {
        if (gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else {
            this.dialog.open(LootDeckDialogComponent, {
                panelClass: 'dialog'
            });
            event.preventDefault();
            event.stopPropagation();
        }
    }
}
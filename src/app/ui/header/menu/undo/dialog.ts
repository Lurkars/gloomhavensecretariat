import { DialogRef } from "@angular/cdk/dialog";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { GameModel } from "src/app/game/model/Game";

@Component({
    selector: 'ghs-undo-dialog',
    templateUrl: './dialog.html',
    styleUrls: ['./dialog.scss']
})
export class UndoDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    undoOffset: number = 0;
    confirm: string = "";
    undoInfos: string[][] = [];
    undoRevisions: number[] = [];
    redoRevisions: number[] = [];
    working: boolean = true;

    constructor(public dialogRef: DialogRef) {
        this.dialogRef.overlayRef.hostElement.style.zIndex = "2000";
    }

    async ngOnInit() {
        for (let i = 0; i < gameManager.stateManager.undoCount; i++) {
            let undo = await storageManager.readFromList<GameModel>('undo', i);
            this.undoRevisions[i] = undo.revision - (undo.revisionOffset || 0);
        }

        for (let i = 0; i < gameManager.stateManager.redoCount; i++) {
            let redo = await storageManager.readFromList<GameModel>('redo', i);
            this.redoRevisions[gameManager.stateManager.redoCount - i - 1] = redo.revision - (redo.revisionOffset || 0);
        }
        this.undoOffset = gameManager.stateManager.undoCount > 0 ? (gameManager.game.revision
            - (gameManager.game.revisionOffset || 0)) - this.undoRevisions[gameManager.stateManager.undoCount - 1] - 1 : 0;

        this.undoInfos = await storageManager.readAll<string[]>('undo-infos');


        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: async () => {
                this.working = true;
                for (let i = 0; i < gameManager.stateManager.undoCount; i++) {
                    let undo = await storageManager.readFromList<GameModel>('undo', i);
                    this.undoRevisions[i] = undo.revision - (undo.revisionOffset || 0);
                }

                for (let i = 0; i < gameManager.stateManager.redoCount; i++) {
                    try {
                        let redo = await storageManager.readFromList<GameModel>('redo', i);
                        this.redoRevisions[gameManager.stateManager.redoCount - i - 1] = redo.revision - (redo.revisionOffset || 0);
                    } catch (e) {
                        console.error(e);
                    }
                }

                this.undoOffset = gameManager.stateManager.undoCount > 0 ? (gameManager.game.revision
                    - (gameManager.game.revisionOffset || 0)) - this.undoRevisions[gameManager.stateManager.undoCount - 1] - 1 : 0;

                this.undoInfos = await storageManager.readAll<string[]>('undo-infos');
                this.working = false;
            }
        })

        this.working = false;
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    undo() {
        this.working = true;
        gameManager.stateManager.undo();
    }

    redo() {
        this.working = true;
        gameManager.stateManager.redo();
    }

    getUndoInfo(index: number): string[] {
        let undoInfo: string[] = [];
        if (gameManager.stateManager.undoCount > 0 && this.undoInfos.length >= gameManager.stateManager.undoCount && index >= 0 && index < gameManager.stateManager.undoCount) {
            undoInfo = this.undoInfos[index];
            if (undoInfo.length > 1 && undoInfo[0] == "serverSync") {
                if (undoInfo[1] == "setInitiative" && undoInfo.length > 3) {
                    undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + undoInfo[1], [undoInfo[2], ""])];
                } else {
                    undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + undoInfo[1], undoInfo.slice(2))];
                }
            } else if (undoInfo.length == 1 && undoInfo[0] == "serverSync") {
                undoInfo = ["serverSync", ""]
            }
        }



        return undoInfo;
    }

    getRedoInfo(index: number): string[] {
        let redoInfo: string[] = [];
        if (gameManager.stateManager.redoCount > 0 && this.undoInfos.length >= (gameManager.stateManager.undoCount + gameManager.stateManager.redoCount) && index >= 0 && index < gameManager.stateManager.redoCount) {
            redoInfo = this.undoInfos[gameManager.stateManager.undoCount + index];
            if (redoInfo.length > 1 && redoInfo[0] == "serverSync") {
                if (redoInfo[1] == "setInitiative" && redoInfo.length > 3) {
                    redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + redoInfo[1], [redoInfo[2], ""])];
                } else {
                    redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + redoInfo[1], redoInfo.slice(2))];
                }
            } else if (redoInfo.length == 1 && redoInfo[0] == "serverSync") {
                redoInfo = ["serverSync", ""]
            }
        }

        return redoInfo;
    }

    clearUndos() {
        if (this.confirm != "clearUndos") {
            this.confirm = "clearUndos";
        } else {
            gameManager.stateManager.clearUndos();
            if (gameManager.stateManager.redoCount == 0) {
                this.dialogRef.close();
            }
        }
    }

    clearRedos() {
        if (this.confirm != "clearRedos") {
            this.confirm = "clearRedos";
        } else {
            gameManager.stateManager.clearRedos();
            if (gameManager.stateManager.undoCount == 0) {
                this.dialogRef.close();
            }
        }
    }
}
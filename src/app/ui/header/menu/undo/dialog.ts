import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
    selector: 'ghs-undo-dialog',
    templateUrl: './dialog.html',
    styleUrls: ['./dialog.scss']
})
export class UndoDialogComponent {

    gameManager: GameManager = gameManager;

    getUndoInfo(index: number): string[] {
        let undoInfo: string[] = [];
        if (gameManager.stateManager.undos.length > 0 && gameManager.stateManager.undoInfos.length >= gameManager.stateManager.undos.length && index >= 0 && index < gameManager.stateManager.undos.length) {
            undoInfo = gameManager.stateManager.undoInfos[index];
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
        if (gameManager.stateManager.redos.length > 0 && gameManager.stateManager.undoInfos.length >= (gameManager.stateManager.undos.length + gameManager.stateManager.redos.length) && index >= 0 && index < gameManager.stateManager.redos.length) {
            redoInfo = gameManager.stateManager.undoInfos[gameManager.stateManager.undos.length + index];
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
}
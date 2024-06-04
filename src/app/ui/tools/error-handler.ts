import { Dialog } from "@angular/cdk/dialog";
import { ErrorHandler, Injectable } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { FeedbackDialogComponent } from "./feedback/feedback-dialog";

@Injectable()
export class GhsErrorHandler extends ErrorHandler {

    constructor(private dialog: Dialog) {
        super();
    }

    override handleError(error: Error) {
        gameManager.stateManager.errorLog.push(error);
        super.handleError(error);

        if (window.document.body.classList.contains('working') || window.document.body.classList.contains('server-sync')) {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');

            const errorId = error.message + (error.stack ? error.stack.split('\n')[0] : '');
            if (!settingsManager.settings.feedbackErrorsIgnore || settingsManager.settings.feedbackErrorsIgnore.indexOf(errorId) == -1) {
                this.dialog.open(FeedbackDialogComponent, {
                    panelClass: ['dialog'],
                    data: error
                })
            }
        }
    }
}
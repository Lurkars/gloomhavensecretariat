import { Dialog } from "@angular/cdk/dialog";
import { ErrorHandler, Injectable } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { FeedbackDialogComponent } from "./feedback/feedback-dialog";

const FILTER_ERRORS: string[] = ["Failed to execute 'setItem' on 'Storage'"];

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
            if (error.message && error.message.trim() && !FILTER_ERRORS.some((msg) => error.message.startsWith(msg)) && (!settingsManager.settings.feedbackErrorsIgnore || settingsManager.settings.feedbackErrorsIgnore.indexOf(errorId) == -1)) {
                this.dialog.open(FeedbackDialogComponent, {
                    panelClass: ['dialog'],
                    data: error
                })
            }
        }
    }
}
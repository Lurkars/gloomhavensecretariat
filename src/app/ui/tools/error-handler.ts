import { Dialog } from '@angular/cdk/dialog';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { FeedbackDialogComponent } from 'src/app/ui/tools/feedback/feedback-dialog';
import { environment } from 'src/environments/environment';

const FILTER_ERRORS: string[] = [
  "Failed to execute 'setItem' on 'Storage'",
  'NG0100',
  "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing"
];

@Injectable()
export class GhsErrorHandler extends ErrorHandler {
  private dialog = inject(Dialog);

  override handleError(error: Error) {
    gameManager.stateManager.errorLog.push(error);
    super.handleError(error);

    if (window.document.body.classList.contains('working') || window.document.body.classList.contains('server-sync')) {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');

      const errorId = error.message + (error.stack ? error.stack.split('\n')[0] : '');
      if (
        environment.branded &&
        error.message &&
        error.message.trim() &&
        !error.message.toLowerCase().includes('leaflet') &&
        !FILTER_ERRORS.some((msg) => error.message.startsWith(msg)) &&
        (!settingsManager.settings.feedbackErrorsIgnore || !settingsManager.settings.feedbackErrorsIgnore.includes(errorId))
      ) {
        this.dialog.open(FeedbackDialogComponent, {
          panelClass: ['dialog'],
          data: error
        });
      }
    }
  }
}

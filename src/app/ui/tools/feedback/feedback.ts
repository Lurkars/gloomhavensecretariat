import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { FeedbackDialogComponent } from 'src/app/ui/tools/feedback/feedback-dialog';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-feedback-tool',
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackToolComponent {
  constructor(private dialog: Dialog) {}

  open() {
    this.dialog.open(FeedbackDialogComponent, {
      panelClass: ['dialog']
    });
  }
}

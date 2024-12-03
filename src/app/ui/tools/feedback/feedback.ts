import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { FeedbackDialogComponent } from "./feedback-dialog";

@Component({
	standalone: false,
    selector: 'ghs-feedback-tool',
    templateUrl: './feedback.html',
    styleUrls: ['./feedback.scss']
})
export class FeedbackToolComponent {


    constructor(private dialog: Dialog) { }


    open() {
        this.dialog.open(FeedbackDialogComponent, {
            panelClass: ['dialog']
        })
    }
}
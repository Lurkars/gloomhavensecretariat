import { Dialog, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { Character } from "src/app/game/model/Character";
import { Monster } from "src/app/game/model/Monster";

@Component({
	standalone: false,
  selector: 'ghs-figure-errors',
  templateUrl: './errors.html',
  styleUrls: [ './errors.scss' ]
})
export class FigureErrorsComponent implements OnInit {

  @Input() figure!: Monster | Character;

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    if (!this.figure.errors) {
      this.figure.errors = [];
    }
  }

  open(event: any) {
    this.dialog.open(FigureErrorsDialogComponent, { panelClass: ['dialog'], data: this.figure });
  }
}


@Component({
	standalone: false,
  selector: 'ghs-figure-errors-dialog',
  templateUrl: './errors-dialog.html',
  styleUrls: [ './errors-dialog.scss' ]
})
export class FigureErrorsDialogComponent {

  constructor(@Inject(DIALOG_DATA) public figure: Monster | Character) { }

}
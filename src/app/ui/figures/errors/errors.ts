import { Component, Input } from "@angular/core";
import { Character } from "src/app/game/model/Character";
import { FigureError, FigureErrorType } from "src/app/game/model/FigureError";
import { Monster } from "src/app/game/model/Monster";
import { DialogComponent } from "../../dialog/dialog";

@Component({
  selector: 'ghs-figure-errors',
  templateUrl: './errors.html',
  styleUrls: [ './errors.scss', '../../dialog/dialog.scss' ]
})
export class FigureErrors extends DialogComponent {

  @Input() figure!: Monster | Character;

  override ngOnInit(): void {
    super.ngOnInit();
    if (!this.figure.errors) {
      this.figure.errors = [];
    }
  }

}
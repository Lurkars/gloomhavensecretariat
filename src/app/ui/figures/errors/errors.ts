import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { Character } from 'src/app/game/model/Character';
import { Monster } from 'src/app/game/model/Monster';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [],
  selector: 'ghs-figure-errors',
  templateUrl: './errors.html',
  styleUrls: ['./errors.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FigureErrorsComponent implements OnInit {
  @Input() figure!: Monster | Character;

  constructor(private dialog: Dialog) {}

  ngOnInit(): void {
    if (!this.figure.errors) {
      this.figure.errors = [];
    }
  }

  open() {
    this.dialog.open(FigureErrorsDialogComponent, { panelClass: ['dialog'], data: this.figure });
  }
}

@Component({
  imports: [GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-figure-errors-dialog',
  templateUrl: './errors-dialog.html',
  styleUrls: ['./errors-dialog.scss']
})
export class FigureErrorsDialogComponent {
  figure: Monster | Character = inject(DIALOG_DATA);
}

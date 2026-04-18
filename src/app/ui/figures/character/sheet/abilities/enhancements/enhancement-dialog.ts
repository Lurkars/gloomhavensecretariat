import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { Character } from 'src/app/game/model/Character';
import { Action } from 'src/app/game/model/data/Action';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { EnhancementsComponent } from 'src/app/ui/figures/character/sheet/abilities/enhancements/enhancements';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [forwardRef(() => EnhancementsComponent)],
  selector: 'ghs-enhancement-dialog',
  templateUrl: 'enhancement-dialog.html',
  styleUrls: ['./enhancement-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnhancementDialogComponent {
  private dialogRef = inject(DialogRef);

  data: {
    action: Action | undefined;
    actionIndex: string | undefined;
    enhancementIndex: number | undefined;
    cardId: number | undefined;
    character: Character | undefined;
    summon: SummonData | undefined;
  } = inject(DIALOG_DATA);

  constructor() {
    this.data = this.data || {};
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}

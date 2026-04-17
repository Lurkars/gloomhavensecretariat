import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterImageComponent } from 'src/app/ui/figures/character/cards/image';
import { CharacterInitiativeComponent } from 'src/app/ui/figures/character/cards/initiative';
import { CharacterComponent } from 'src/app/ui/figures/character/character';
import { CharacterSheetComponent } from 'src/app/ui/figures/character/sheet/character-sheet';
import { ConditionsComponent } from 'src/app/ui/figures/conditions/conditions';
import { HighlightConditionsComponent } from 'src/app/ui/figures/conditions/highlight';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';
import { EntityAnimationDirective } from 'src/app/ui/helper/EntityAnimation';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    EntityAnimationDirective,
    GhsLabelDirective,
    GhsRangePipe,
    PointerInputDirective,
    TrackUUIDPipe,
    CharacterImageComponent,
    CharacterInitiativeComponent,
    CharacterSheetComponent,
    ConditionsComponent,
    HighlightConditionsComponent,
    StandeeComponent
  ],
  selector: 'ghs-character-fullview',
  templateUrl: './fullview.html',
  styleUrls: ['../character.scss', './fullview.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterFullViewComponent extends CharacterComponent {
  cancel() {
    this.character.fullview = false;
    gameManager.stateManager.saveLocal();
    this.ghsManager.triggerUiChange();
  }
}

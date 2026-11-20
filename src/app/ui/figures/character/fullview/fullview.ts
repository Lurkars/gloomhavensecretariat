import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { CharacterImageComponent } from 'src/app/ui/figures/character/cards/image';
import { CharacterInitiativeComponent } from 'src/app/ui/figures/character/cards/initiative';
import { CharacterComponent } from 'src/app/ui/figures/character/character';
import { CharacterItemListComponent } from 'src/app/ui/figures/character/item-list/item-list';
import { HighlightConditionsComponent } from 'src/app/ui/figures/conditions/highlight';
import { EntitiesMenuInlineComponent } from 'src/app/ui/figures/entities-menu/entities-menu-inline';
import { LootComponent } from 'src/app/ui/figures/loot/loot-card';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsMinZeroPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueSignDirective } from 'src/app/ui/helper/ValueSign';

/**
 * Character board for the standalone full view while a round is running.
 */
@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsTooltipDirective,
    GhsMinZeroPipe,
    GhsRangePipe,
    PointerInputDirective,
    TrackUUIDPipe,
    ValueSignDirective,
    ActionComponent,
    AttackModifierDeckComponent,
    CharacterImageComponent,
    CharacterInitiativeComponent,
    CharacterItemListComponent,
    EntitiesMenuInlineComponent,
    HighlightConditionsComponent,
    LootComponent,
    StandeeComponent
  ],
  selector: 'ghs-character-fullview',
  templateUrl: './fullview.html',
  styleUrls: ['./fullview.scss']
})
export class CharacterFullViewComponent extends CharacterComponent {}

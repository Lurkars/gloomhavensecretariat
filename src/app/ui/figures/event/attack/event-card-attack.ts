import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { EventCardAttack } from 'src/app/game/model/data/EventCard';
import { EventCardEffectComponent } from 'src/app/ui/figures/event/effect/event-card-effect';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, EventCardEffectComponent],
  selector: 'ghs-event-card-attack',
  templateUrl: './event-card-attack.html',
  styleUrls: ['./event-card-attack.scss']
})
export class EventCardAttackComponent {
  @Input() attack!: EventCardAttack;
  @Input() edition!: string;
  @Input() eventType!: string;
  @Input() selected: boolean = false;
  @Input() targetDescription: boolean = true;
  @Input() narrative: boolean = true;
  @Input() effects: boolean = true;
  @Input() disabled: boolean = false;
  @Input() light: boolean = false;

  @Output('toggled') toggled: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() debug: boolean = false;

  toggleSelected() {
    if (!this.disabled) {
      this.selected = !this.selected;
      this.toggled.emit(this.selected);
    }
  }
}

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
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
  readonly inputAttack = input.required<EventCardAttack>({ alias: 'attack' });
  get attack(): EventCardAttack {
    return this.inputAttack();
  }

  readonly inputEdition = input<string>('', { alias: 'edition' });
  get edition(): string {
    return this.inputEdition();
  }

  readonly inputEventType = input<string>('', { alias: 'eventType' });
  get eventType(): string {
    return this.inputEventType();
  }

  readonly targetDescription = input<boolean>(true);
  readonly narrative = input<boolean>(true);
  readonly effects = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly light = input<boolean>(false);

  selected = model<boolean>(false);

  readonly debug = input<boolean>(false);

  toggleSelected() {
    if (!this.disabled()) {
      this.selected.set(!this.selected());
    }
  }
}

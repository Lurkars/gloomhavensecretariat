import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard } from 'src/app/game/model/data/EventCard';
import { EventCardComponent } from 'src/app/ui/figures/event/event-card';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, EventCardComponent, HeaderComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-event-cards-tool',
  templateUrl: './event-cards-tool.html',
  styleUrls: ['./event-cards-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCardsToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  events: EventCard[] = [];
  edition: string | undefined;
  types: string[] = [];
  type: string = '';
  selected: number = -1;
  iterator: number = -1;
  spoiler: boolean = false;
  debug: boolean = true;

  private destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        let update = false;
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition = undefined;
          }
          update = true;
        }
        if (queryParams['type']) {
          this.type = queryParams['type'];
          update = true;
        }
        if (queryParams['selected'] != undefined) {
          this.selected = +queryParams['selected'];
        }
        if (queryParams['iterator']) {
          this.iterator = +queryParams['iterator'];
        }
        if (update) {
          this.update();
        }
      }
    });
  }

  changeIterator(value: number) {
    this.iterator += value;
    this.update();
    this.updateQueryParams();
  }

  update() {
    this.events = [];
    if (this.edition) {
      this.types = gameManager.eventCardManager.getEventTypesForEdition(this.edition, false);
      if (!this.type || !this.types.includes(this.type)) {
        this.type = this.types[0];
      }
      this.events = gameManager.eventCardManager
        .getEventCardsForEdition(this.edition, this.type, false)
        .filter((e, i) => this.iterator == -1 || this.iterator == i);
    }
  }

  updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        edition: this.edition || undefined,
        type: this.type || undefined,
        selected: this.selected,
        iterator: this.iterator != -1 ? this.iterator : undefined
      },
      queryParamsHandling: 'merge'
    });
  }
}

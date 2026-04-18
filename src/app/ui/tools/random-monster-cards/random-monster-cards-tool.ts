import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { RandomMonsterCardComponent } from 'src/app/ui/footer/scenario/dialog/random-monster-card/random-monster-card';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, RandomMonsterCardComponent, HeaderComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-random-monster-cards-tool',
  templateUrl: './random-monster-cards-tool.html',
  styleUrls: ['./random-monster-cards-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RandomMonsterCardsToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameManager: GameManager = gameManager;
  sections: ScenarioData[] = [];
  edition: string | undefined;

  private destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition = undefined;
          }
          this.update();
        }
      }
    });
  }

  update() {
    this.sections = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
    if (editionData && editionData.sections) {
      this.sections = editionData.sections
        .filter((sectionData) => sectionData.group == 'randomMonsterCard')
        .sort((a, b) => (a.name < b.name ? -1 : 1));
    }
  }

  updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edition: this.edition || undefined },
      queryParamsHandling: 'merge'
    });
  }
}

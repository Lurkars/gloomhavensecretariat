import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { TreasureData } from 'src/app/game/model/data/RoomData';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, HeaderComponent, TreasureLabelComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-treasures-tool',
  templateUrl: './treasures-tool.html',
  styleUrls: ['./treasures-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreasuresToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameManager: GameManager = gameManager;
  treasures: TreasureData[] = [];
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
    this.treasures = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition === this.edition);
    if (editionData && editionData.treasures) {
      editionData.treasures.forEach((treasureString, index) => {
        this.treasures.push(new TreasureData(treasureString, index + 1 + (editionData.treasureOffset || 0)));
      });
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

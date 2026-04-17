import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { EnhancementsComponent } from 'src/app/ui/figures/character/sheet/abilities/enhancements/enhancements';
import { environment } from 'src/environments/environment';

@Component({
  imports: [EnhancementsComponent],
  selector: 'ghs-enhancement-calculator-standalone',
  templateUrl: './enhancement-calculator.html',
  styleUrls: ['./enhancement-calculator.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnhancementCalculatorStandaloneComponent implements OnInit {
  async ngOnInit() {
    try {
      await storageManager.init();
    } catch {
      // continue
    }
    await settingsManager.init(!environment.production);
    await gameManager.stateManager.init(true);
  }
}

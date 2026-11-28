import { Component, OnInit } from '@angular/core';
import { gameManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { EnhancementsComponent } from 'src/app/ui/figures/character/abilities/enhancements/enhancements';
import { environment } from 'src/environments/environment';

@Component({
  imports: [EnhancementsComponent],
  selector: 'ghs-enhancement-calculator-standalone',
  templateUrl: './enhancement-calculator.html',
  styleUrls: ['./enhancement-calculator.scss']
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

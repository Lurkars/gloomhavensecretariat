import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';

@Component({
  imports: [NgClass],
  selector: 'ghs-healthbar',
  templateUrl: './healthbar.html',
  styleUrls: ['./healthbar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthbarComponent implements OnInit {
  protected ghsManager = inject(GhsManager);

  readonly entity = input.required<Entity>();
  readonly diff = input<number>(0);

  maxHealth: number = 0;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update(): void {
    this.maxHealth = EntityValueFunction(this.entity().maxHealth);
  }
}

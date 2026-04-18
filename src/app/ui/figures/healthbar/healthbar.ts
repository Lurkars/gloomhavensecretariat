import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
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

  @Input() entity!: Entity;
  @Input() diff: number = 0;

  health: number = 0;
  maxHealth: number = 0;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update(): void {
    this.health = this.entity.health;
    this.maxHealth = EntityValueFunction(this.entity.maxHealth);
  }
}

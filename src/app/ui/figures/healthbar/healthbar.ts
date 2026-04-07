import { Component, Input } from "@angular/core";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";

@Component({
  standalone: false,
  selector: 'ghs-healthbar',
  templateUrl: './healthbar.html',
  styleUrls: ['./healthbar.scss']
})
export class HealthbarComponent {

  @Input() entity!: Entity;
  @Input() diff: number = 0;

  health: number = 0;
  maxHealth: number = 0;

  constructor(protected ghsManager: GhsManager) {
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
import { Component, Input } from "@angular/core";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";

@Component({
	standalone: false,
  selector: 'ghs-healthbar',
  templateUrl: './healthbar.html',
  styleUrls: [ './healthbar.scss' ]
})
export class HealthbarComponent {

  @Input() entity!: Entity;
  @Input() diff: number = 0;

  maxHealth(): number {
    return EntityValueFunction(this.entity.maxHealth);
  }

}
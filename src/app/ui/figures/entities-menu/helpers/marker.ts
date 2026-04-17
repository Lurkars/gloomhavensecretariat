import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class MarkerHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.characterMarker = [...gameManager.markers(), ...this.component.entities.flatMap((entity) => entity.markers)].filter(
      (marker, index, self) => index == self.indexOf(marker)
    );

    this.component.characterMarker.forEach((marker) => {
      if (this.component.entities.every((entity) => entity.markers.includes(marker))) {
        this.component.characterMarkerToAdd.push(marker);
      }
    });
  }

  toggleCharacterMarker() {
    if (this.component.entity instanceof Character) {
      this.component.before(this.component.entity.marker ? 'disableCharacterMarker' : 'enableCharacterMarker');
      this.component.entity.marker = !this.component.entity.marker;
      gameManager.stateManager.after();
      this.update();
    }
  }

  toggleMarker(marker: string) {
    if (this.component.characterMarkerToAdd.includes(marker)) {
      this.component.characterMarkerToAdd = this.component.characterMarkerToAdd.filter((m) => m != marker);
      this.component.characterMarkerToRemove.push(marker);
    } else {
      this.component.characterMarkerToAdd.push(marker);
      this.component.characterMarkerToRemove = this.component.characterMarkerToRemove.filter((m) => m != marker);
    }
  }

  close() {
    if (this.component.characterMarkerToAdd.length) {
      this.component.characterMarkerToAdd.forEach((marker) => {
        if (this.component.entities.some((entity) => !entity.markers.includes(marker))) {
          const edition = marker.split('-')[0];
          const name = marker.split('-').slice(1).join('-');
          this.component.before('addCharacterMarker', marker, edition + '.' + name);
          this.component.entities.forEach((entity) => {
            if (!entity.markers.includes(marker)) {
              entity.markers.push(marker);
            }
          });
          gameManager.stateManager.after();
        }
      });
    }

    if (this.component.characterMarkerToRemove.length) {
      this.component.characterMarkerToRemove.forEach((marker) => {
        if (this.component.entities.some((entity) => entity.markers.includes(marker))) {
          const edition = marker.split('-')[0];
          const name = marker.split('-').slice(1).join('-');
          this.component.before('removeCharacterMarker', marker, edition + '.' + name);
          this.component.entities.forEach((entity) => {
            entity.markers = entity.markers.filter((m) => m != marker);
          });
          gameManager.stateManager.after();
        }
      });
    }
  }
}

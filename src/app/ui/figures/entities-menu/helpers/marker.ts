import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class MarkerHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    const applicableEntities = this.component.applicableEntities;
    this.component.characterMarker = [
      ...gameManager.entityManager.markers(),
      ...applicableEntities.flatMap((entity) => entity.markers)
    ].filter((marker, index, self) => index === self.indexOf(marker));

    this.component.characterMarker.forEach((marker) => {
      if (applicableEntities.length > 0 && applicableEntities.every((entity) => entity.markers.includes(marker))) {
        this.component.characterMarkerToAdd.push(marker);
      }
    });
  }

  toggleCharacterMarker() {
    if (this.component.entity instanceof Character) {
      this.component.before(this.component.entity.marker ? 'disableCharacterMarker' : 'enableCharacterMarker');
      gameManager.characterManager.setCharacterMarker(this.component.entity, !this.component.entity.marker);
      gameManager.stateManager.after();
      this.update();
    }
  }

  toggleMarker(marker: string) {
    if (this.component.characterMarkerToAdd.includes(marker)) {
      this.component.characterMarkerToAdd = this.component.characterMarkerToAdd.filter((m) => m !== marker);
      this.component.characterMarkerToRemove.push(marker);
    } else {
      this.component.characterMarkerToAdd.push(marker);
      this.component.characterMarkerToRemove = this.component.characterMarkerToRemove.filter((m) => m !== marker);
    }
  }

  close() {
    const applicableEntities = this.component.applicableEntities;

    if (this.component.characterMarkerToAdd.length) {
      this.component.characterMarkerToAdd.forEach((marker) => {
        if (applicableEntities.some((entity) => !entity.markers.includes(marker))) {
          const edition = marker.split('-')[0];
          const name = marker.split('-').slice(1).join('-');
          this.component.before('addCharacterMarker', marker, edition + '.' + name);
          gameManager.entityManager.setMarker(
            applicableEntities.filter((entity) => !entity.markers.includes(marker)),
            marker,
            true
          );
          gameManager.stateManager.after();
        }
      });
    }

    if (this.component.characterMarkerToRemove.length) {
      this.component.characterMarkerToRemove.forEach((marker) => {
        if (applicableEntities.some((entity) => entity.markers.includes(marker))) {
          const edition = marker.split('-')[0];
          const name = marker.split('-').slice(1).join('-');
          this.component.before('removeCharacterMarker', marker, edition + '.' + name);
          gameManager.entityManager.setMarker(applicableEntities, marker, false);
          gameManager.stateManager.after();
        }
      });
    }
  }
}

import { DialogRef } from "@angular/cdk/dialog";
import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Spoilable } from "src/app/game/model/data/Spoilable";

export function ghsUnit(): number {
  return +window.getComputedStyle(document.body).getPropertyValue('--ghs-width').replace(/[^\d\+]/g, '') / +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
}

export function ghsShuffleArray(array: any[]): any[] {
  let i = array.length, r;
  while (i != 0) {
    r = Math.floor(Math.random() * i);
    i--;
    [array[i], array[r]] = [
      array[r], array[i]];
  }

  return array;
}

export function ghsHasSpoilers(items: Spoilable[], multiple: boolean = false): boolean {
  if (multiple) {
    return items.filter((spoilable) => spoilable.spoiler && settingsManager.settings.spoilers.indexOf(spoilable.name) == -1).length > 1;
  }
  return items.some((spoilable) => spoilable.spoiler && settingsManager.settings.spoilers.indexOf(spoilable.name) == -1);
}

export function ghsIsSpoiled(spoilable: Spoilable): boolean {
  return !spoilable.spoiler || settingsManager.settings.spoilers.indexOf('[ALL]') != -1 || settingsManager.settings.spoilers.indexOf(spoilable.name) != -1;
}

export function ghsNotSpoiled(items: Spoilable[]): Spoilable[] {
  return items.filter((spoilable) => !ghsIsSpoiled(spoilable));
}

export function ghsTextSearch(target: string, search: string, match: boolean = false): boolean {
  if (match) {
    return target.toLowerCase() == search.toLowerCase();
  }

  return search.split(' ').every((part) => target.toLowerCase().indexOf(part.toLowerCase()) != -1);
}

export function ghsValueSign(value: number, empty: boolean = false): string {
  if (value > 0) {
    return "+" + value;
  } else if (empty && value == 0) {
    return "-";
  } else {
    return "" + value;
  }
}

export function ghsDurationLabel(value: number, totalHours: boolean = false): string {
  let seconds = Math.floor(value);
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  let label = settingsManager.getLabel('duration.' + (days && 'days' || hours && 'hours' || minutes && 'minutes' || 'seconds'), [seconds, minutes, hours, days].map((value) => '' + value), false);

  if (totalHours) {
    label = settingsManager.getLabel('duration.totalHours', [label, (value / 3600).toFixed(1)]);
  }

  return label;
}

export function ghsInputFullScreenCheck(): void {
  if (settingsManager.settings.fullscreen && !!document.fullscreenElement) {
    document.exitFullscreen && document.exitFullscreen();
    document.body.classList.add('fullscreen');
  }
  window.addEventListener('focus', ghsInputFullScreenCheckListener, true)
}

export function ghsInputFullScreenCheckListener(event: any) {
  setTimeout(() => {
    if (settingsManager.settings.fullscreen && !!!document.fullscreenElement) {
      try {
        document.body.requestFullscreen && document.body.requestFullscreen();
      } catch (e) { }
      document.body.classList.remove('fullscreen');
    }
    window.removeEventListener('focus', ghsInputFullScreenCheckListener, true);
  })
}

export function ghsModulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function ghsDialogClosingHelper(dialogRef: DialogRef, result: any = undefined) {
  if (settingsManager.settings.animations && dialogRef.overlayRef.overlayElement) {
    dialogRef.overlayRef.overlayElement.classList.add('dialog-closing');
    if (dialogRef.overlayRef.hostElement && dialogRef.overlayRef.hostElement.getElementsByClassName('dialog-close-button')[0]) {
      dialogRef.overlayRef.hostElement.getElementsByClassName('dialog-close-button')[0].classList.add('closing');
    }
    if (dialogRef.overlayRef.backdropElement) {
      dialogRef.overlayRef.backdropElement.classList.add('backdrop-closing');
    }
    setTimeout(() => dialogRef.close(result), 250);
  } else {
    dialogRef.close(result);
  }
}

export function ghsDefaultDialogPositions(defaultDirection: 'right' | 'left' | 'center' = 'right'): ConnectionPositionPair[] {
  const factor_x = 1.5;
  const factor_y = 3;

  const right = [ // top right
    new ConnectionPositionPair(
      { originX: 'end', originY: 'top' },
      { overlayX: 'start', overlayY: 'top' }, ghsUnit() * factor_x, ghsUnit() * -factor_y),

    // center right
    new ConnectionPositionPair(
      { originX: 'end', originY: 'center' },
      { overlayX: 'start', overlayY: 'center' }),

    // bottom right
    new ConnectionPositionPair(
      { originX: 'end', originY: 'bottom' },
      { overlayX: 'start', overlayY: 'bottom' }, ghsUnit() * factor_x, ghsUnit() * factor_y)];

  const left = [
    // top left
    new ConnectionPositionPair(
      { originX: 'start', originY: 'top' },
      { overlayX: 'end', overlayY: 'top' }, ghsUnit() * -factor_x, ghsUnit() * -factor_y),

    // center left
    new ConnectionPositionPair(
      { originX: 'start', originY: 'center' },
      { overlayX: 'end', overlayY: 'center' }),

    // bottom left
    new ConnectionPositionPair(
      { originX: 'start', originY: 'bottom' },
      { overlayX: 'end', overlayY: 'bottom' }, ghsUnit() * -factor_x, ghsUnit() * factor_y)];

  const center = [
    // center top
    new ConnectionPositionPair(
      { originX: 'center', originY: 'bottom' },
      { overlayX: 'center', overlayY: 'top' }, 0, ghsUnit() * factor_y),

    // center center
    new ConnectionPositionPair(
      { originX: 'center', originY: 'center' },
      { overlayX: 'center', overlayY: 'center' }),

    // center bottom
    new ConnectionPositionPair(
      { originX: 'center', originY: 'top' },
      { overlayX: 'center', overlayY: 'bottom' }, 0, ghsUnit() * -factor_y)];

  switch (defaultDirection) {
    case 'right':
      return [...right, ...left, ...center];
    case 'left':
      return [...left, ...right, ...center];
    case 'center':
      return [...center, ...left, ...right];
  }

}
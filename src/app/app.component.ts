import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent {
  title = 'gloomhavensecretary';
}

export function ghsUnit(): number {
  return +window.getComputedStyle(document.body).getPropertyValue('--ghs-width').replace('px', '') / +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
}

export function ghsClolumnUnit(): number {
  return ghsUnit() / +window.getComputedStyle(document.body).getPropertyValue('--ghs-columns');
}

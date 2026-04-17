import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import packageJson from 'src/../package.json';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { environment } from 'src/environments/environment';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-about-menu',
  templateUrl: 'about.html',
  styleUrls: ['../menu.scss', 'about.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutMenuComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Output() closed = new EventEmitter();
  version = packageJson.version;
  branded = environment.branded;
  updateVersion: { latest: boolean; version: string; url: string } | undefined;

  async ngOnInit() {
    if (!this.branded) return;
    await fetch('https://api.github.com/repos/lurkars/gloomhavensecretariat/releases/latest')
      .then((response) => {
        if (!response.ok) {
          throw Error();
        }
        return response.json();
      })
      .then((value: any) => {
        this.updateVersion = {
          latest: value.tag_name == this.version || value.tag_name == 'v' + this.version,
          version: value.tag_name,
          url: value.html_url
        };
        this.cdr.markForCheck();
      });
  }

  async forceUpdate() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const keyList = await caches.keys();
      await Promise.all(keyList.map(async (key) => await caches.delete(key)));
    }

    window.location.reload();
  }
}

import { ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output } from "@angular/core";
import packageJson from '../../../../../../package.json';


@Component({
    standalone: false,
    selector: 'ghs-about-menu',
    templateUrl: 'about.html',
    styleUrls: ['../menu.scss', 'about.scss']
})
export class AboutMenuComponent implements OnInit {
    private cdr = inject(ChangeDetectorRef);

    @Output() close = new EventEmitter();
    version = packageJson.version;
    updateVersion: { latest: boolean, version: string, url: string } | undefined;

    async ngOnInit() {
        await fetch('https://api.github.com/repos/lurkars/gloomhavensecretariat/releases/latest')
            .then(response => {
                if (!response.ok) {
                    throw Error();
                }
                return response.json();
            }).then((value: any) => {
                this.updateVersion = { latest: value.tag_name == this.version || value.tag_name == 'v' + this.version, version: value.tag_name, url: value.html_url };
                this.cdr.markForCheck();
            });
    }

    async forceUpdate() {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(registration => registration.unregister()));
        }

        if ('caches' in window) {
            const keyList = await caches.keys();
            await Promise.all(keyList.map(async (key) => await caches.delete(key)));
        }

        window.location.reload();
    }
}
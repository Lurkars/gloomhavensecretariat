import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import packageJson from '../../../../../../package.json';


@Component({
	standalone: false,
    selector: 'ghs-about-menu',
    templateUrl: 'about.html',
    styleUrls: ['../menu.scss', 'about.scss']
})
export class AboutMenuComponent implements OnInit {

    @Output() close = new EventEmitter();
    version = packageJson.version;
    updateVersion: { latest: boolean, version: string, url: string } | undefined;

    constructor(private swUpdate: SwUpdate) { }

    async ngOnInit() {
        await fetch('https://api.github.com/repos/lurkars/gloomhavensecretariat/releases/latest')
            .then(response => {
                if (!response.ok) {
                    throw Error();
                }
                return response.json();
            }).then((value: any) => {
                this.updateVersion = { latest: value.tag_name == this.version || value.tag_name == 'v' + this.version, version: value.tag_name, url: value.html_url };
            });
    }

    forceUpdate(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.activateUpdate().then(() => {
                this.clearAndRefresh();
            });
        } else {
            this.clearAndRefresh();
        }
    }

    async clearAndRefresh() {
        if ('caches' in window) {
            const keyList = await caches.keys();
            await Promise.all(keyList.map(async (key) => await caches.delete(key)));
        }
        window.location.reload()
    }
}
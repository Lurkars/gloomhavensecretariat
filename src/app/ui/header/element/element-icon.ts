import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ElementModel, ElementState } from "src/app/game/model/data/Element";


@Component({
    selector: 'ghs-element-icon',
    templateUrl: './element-icon.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./element-icon.scss']
})
export class ElementIconComponent implements OnInit {

    @Input() element!: ElementModel;
    ElementState = ElementState;
    svg: SafeHtml = "";

    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit(): void {
        fetch('./assets/images/element/' + this.element.type + '.svg')
            .then(response => {
                return response.text();
            }).then(data => {
                this.svg = this.sanitizer.bypassSecurityTrustHtml(data);
            })
            .catch((error: Error) => {
                console.error("Invalid src: " + './assets/images/element/' + this.element.type + '.svg');
            })
    }

}
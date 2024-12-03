import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Element, ElementModel, ElementState } from "src/app/game/model/data/Element";


@Component({
	standalone: false,
    selector: 'ghs-element-icon',
    templateUrl: './element-icon.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./element-icon.scss']
})
export class ElementIconComponent implements OnInit {

    @Input() type: string | undefined;
    @Input() element!: ElementModel;
    ElementState = ElementState;
    svg: SafeHtml = "";

    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit(): void {

        if (this.type && !this.element) {
            this.element = new ElementModel(this.type as Element);
            this.element.state = ElementState.strong;
        }

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
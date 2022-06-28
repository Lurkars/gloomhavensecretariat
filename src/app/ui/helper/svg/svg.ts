import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'ghs-svg',
  template: '<span class="inline-svg" [innerHTML]="svg"></span>',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [ 'svg.scss' ]
})
export class GhsSvgComponent implements OnInit {

  @Input() src!: string;
  svg: SafeHtml = "";

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    fetch(this.src)
      .then(response => {
        return response.text();
      }).then(data => {
        this.svg = this.sanitizer.bypassSecurityTrustHtml(data);
      })
      .catch((error: Error) => {
        console.error("Invalid src: " + this.src);
      })
  }

}
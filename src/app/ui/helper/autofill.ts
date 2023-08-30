import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import autocomplete, { AutocompleteItem } from 'autocompleter';

@Directive({
  selector: '[autofill]'
})
export class AutofillDirective implements OnInit {

  @Input('autofill') values: AutocompleteItem[] = [];
  @Input('spoiler') spoiler: boolean = false;
  @Output('keyup.enter') select: EventEmitter<string> = new EventEmitter<string>();

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    const input = this.el.nativeElement;
    let inputContainer = document.createElement("div");
    input.after(inputContainer);
    const values = this.values;
    const spoiler = this.spoiler;
    const select = this.select;
    autocomplete({
      input: input,
      container: inputContainer,
      minLength: 3,
      className: 'autofill-container',
      disableAutoSelect: true,
      fetch: function (text, update) {
        update(values.filter((value) => value.label && value.label.toLowerCase().startsWith(text.toLowerCase())));
      },
      onSelect: function (item) {
        input.value = item.label;
        select.emit(item.label);
      },
      customize: function (input: HTMLInputElement | HTMLTextAreaElement, inputRect: DOMRect, container: HTMLDivElement, maxHeight: number): void {
        if (spoiler && (container.children.length > 1 || input.value.length < 6)) {
          container.classList.add('spoiler');
        } else {
          container.classList.remove('spoiler');
        }
      }
    });
  }

}
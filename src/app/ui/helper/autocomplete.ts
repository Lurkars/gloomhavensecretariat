import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import autocomplete, { AutocompleteEvent } from 'autocompleter';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';


export class AutocompleteItem {
  label: string;
  value: string;
  revelead: boolean;
  group: string;

  constructor(label: string, value: string = "", revealed: boolean = false, group: string = "") {
    this.label = label;
    this.value = value;
    this.revelead = revealed;
    this.group = group;
  }
}

@Directive({
	standalone: false,
  selector: '[autocomplete]'
})
export class AutocompleteDirective implements OnInit {

  @Input('autocomplete') values: AutocompleteItem[] = [];
  @Input('spoiler') spoiler: boolean = false;
  @Input('emptyLabel') emptyLabel: string = "";
  @Output('keyup.enter') select: EventEmitter<string> = new EventEmitter<string>();

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    let container = document.createElement("div");
    this.el.nativeElement.after(container);
    const select = this.select;
    autocomplete({
      input: this.el.nativeElement,
      container: container,
      emptyMsg: this.emptyLabel ? settingsManager.getLabel(this.emptyLabel) : "",
      minLength: 3,
      disableAutoSelect: true,
      fetch: (text: string, update: (items: AutocompleteItem[] | false) => void) => {
        update(this.values.filter((value) => value.label && value.label.toLowerCase().startsWith(text.toLowerCase())).sort((a, b) => {
          if (a.revelead && !b.revelead) {
            return -1;
          } else if (b.revelead && !a.revelead) {
            return 1;
          }
          return 0;
        }));
      },
      onSelect: (item: AutocompleteItem) => {
        this.el.nativeElement.value = item.label || '';
        select.emit(item.label);
      },
      render: (item: AutocompleteItem, currentValue: string, index: number): HTMLDivElement | undefined => {
        const itemElement = document.createElement('div');
        itemElement.textContent = item.label;
        if (item.revelead) {
          itemElement.classList.add('revealed');
        }
        return itemElement;
      },
      customize: () => {
        if (this.spoiler && (container.children.length > 1 || this.el.nativeElement.value.length < 6)) {
          for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i] as HTMLElement;
            if (child.classList.contains('selected')) {
              child.classList.remove('spoiler');
            } else {
              child.classList.add('spoiler');
              child.addEventListener('touchstart', (ev: TouchEvent) => {
                if (child.classList.contains('spoiler')) {
                  ev.preventDefault();
                  ev.stopPropagation();
                }
              });
              child.addEventListener('touchend', (ev: TouchEvent) => {
                if (child.classList.contains('spoiler')) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  child.classList.remove('spoiler');
                  for (let i = 0; i < container.children.length; i++) {
                    if (container.children[i] != child) {
                      container.children[i].classList.add('spoiler');
                    }
                  }
                }
              });
            }
          }
        } else {
          for (let i = 0; i < container.children.length; i++) {
            container.children[i].classList.remove('spoiler');
          }
        }
      },
      keyup: (e: AutocompleteEvent<KeyboardEvent>) => {
        var key = e.event.key;
        switch (key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'Escape':
            if (this.spoiler && (container.children.length > 1 || this.el.nativeElement.value.length < 6)) {
              for (let i = 0; i < container.children.length; i++) {
                const child = container.children[i] as HTMLElement;
                if (child.classList.contains('selected')) {
                  child.classList.remove('spoiler');
                } else {
                  child.classList.add('spoiler');
                }
              }
            } else {
              for (let i = 0; i < container.children.length; i++) {
                container.children[i].classList.remove('spoiler');
              }
            }
            break;
        }
      }
    });
  }

}
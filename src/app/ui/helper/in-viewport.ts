import { DestroyRef, Directive, ElementRef, inject, OnInit, output } from '@angular/core';

@Directive({
  selector: '[ghsInViewport]'
})
export class InViewportDirective implements OnInit {
  readonly inViewport = output<boolean>({ alias: 'ghsInViewportAction' });

  private observer: IntersectionObserver | undefined;
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.inViewport.emit(true);
        }
      }
    });
    this.observer.observe(this.elementRef.nativeElement);
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }
}

import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CdkScrollable, ScrollingModule } from '@angular/cdk/scrolling';
import { Subscription, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './infinite-scroll.component.html',
  styleUrl: './infinite-scroll.component.scss'
})
export class InfiniteScrollComponent implements AfterViewInit, OnDestroy {
  @Input() scrollThreshold: number = 200;
  @Input() debounceTimeMs: number = 100;
  @Input() isLoading: boolean = false;
  @Input() isLastPage: boolean = false;
  @Output() scrolledToEnd = new EventEmitter<void>();

  private scrollSubscription!: Subscription;
  private zone = inject(NgZone);

  @ViewChild(CdkScrollable)
  set scroll(scroll: CdkScrollable | undefined) {
    if (!scroll) return;

    this.scrollSubscription?.unsubscribe();

    this.zone.runOutsideAngular(() => {
      this.scrollSubscription = scroll
        .elementScrolled()
        .pipe(debounceTime(this.debounceTimeMs))
        .subscribe(() => {
          const distanceFromBottom = scroll.measureScrollOffset('bottom');

          if (
            distanceFromBottom <= this.scrollThreshold &&
            !this.isLastPage &&
            !this.isLoading
          ) {
            this.zone.run(() => {
              this.scrolledToEnd.emit();
            });
          }
        });
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.scrollSubscription?.unsubscribe();
  }
}

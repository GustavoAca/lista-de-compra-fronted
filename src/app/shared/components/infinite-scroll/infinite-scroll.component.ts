import { Component, input, output, ViewChild, inject, NgZone, OnDestroy } from '@angular/core';
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
export class InfiniteScrollComponent implements OnDestroy {
  scrollThreshold = input<number>(200);
  debounceTimeMs = input<number>(100);
  isLoading = input<boolean>(false);
  isLastPage = input<boolean>(false);
  scrolledToEnd = output<void>();

  private scrollSubscription!: Subscription;
  private zone = inject(NgZone);

  @ViewChild(CdkScrollable)
  set scroll(scroll: CdkScrollable | undefined) {
    if (!scroll) return;

    this.scrollSubscription?.unsubscribe();

    this.zone.runOutsideAngular(() => {
      this.scrollSubscription = scroll
        .elementScrolled()
        .pipe(debounceTime(this.debounceTimeMs()))
        .subscribe(() => {
          const distanceFromBottom = scroll.measureScrollOffset('bottom');

          if (
            distanceFromBottom <= this.scrollThreshold() &&
            !this.isLastPage() &&
            !this.isLoading()
          ) {
            this.zone.run(() => {
              this.scrolledToEnd.emit();
            });
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.scrollSubscription?.unsubscribe();
  }
}

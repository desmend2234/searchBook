import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BehaviorSubject,
  map,
  Observable,
  switchMap,
  filter,
  catchError,
  of,
  takeUntil,
  tap,
  finalize,
} from 'rxjs';
import { CurrentSearch } from './services/search.service';
import { SearchService } from './services/search.service';

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  standalone: true,
})
export class AppComponent {
  private http = inject(HttpClient);
  search = inject(SearchService);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  searchResults = this.search.currentSearch.pipe(
    filter((search) => !!search?.searchText),
    tap(() => this.loadingSubject.next(true)),
    switchMap((search) =>
      this.searchBooks(search!).pipe(
        takeUntil(this.search.cancelSearch$),
        catchError(() =>
          of({
            num_found: 0,
            docs: [],
          })
        ),
        finalize(() => this.loadingSubject.next(false))
      )
    )
  );

  onSearchInputChange(event: Event) {
    this.search.searchText = (event.target as HTMLInputElement).value;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.search.submit();
  }

  onPageChange(event: PageEvent) {
    if (event.pageSize !== this.search.pageSize) {
      this.search.setPageSize(event.pageSize);
    } else {
      this.search.page = event.pageIndex + 1;
      this.search.submit();
    }
  }

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    const response = this.http.get<SearchResult>(
      `https://openlibrary.org/search.json?title=${searchQuery}&page=${page}&limit=${pageSize}`
    );

    return response.pipe(
      map((res) => {
        console.log(res);
        return res;
      })
    );
  }
}

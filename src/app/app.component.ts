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
  // 注入所需服務
  private http = inject(HttpClient);
  search = inject(SearchService);

  // 載入狀態管理
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  // 搜尋結果處理
  searchResults = this.search.currentSearch.pipe(
    filter((search) => !!search?.searchText),
    // 開始載入：顯示進度條
    tap(() => this.loadingSubject.next(true)),
    // 切換到新的搜尋：取消舊的請求
    switchMap((search) =>
      this.searchBooks(search!).pipe(
        // 取消機制，避免舊的請求蓋到新的請求
        takeUntil(this.search.cancelSearch$),
        // 錯誤處理：返回空結果
        catchError(() =>
          of({
            num_found: 0,
            docs: [],
          })
        ),
        // 結束載入：隱藏進度條
        finalize(() => this.loadingSubject.next(false))
      )
    )
  );

  // 處理搜尋輸入
  onSearchInputChange(event: Event) {
    this.search.searchText = (event.target as HTMLInputElement).value;
  }

  // 處理表單提交
  onSubmit(event: Event) {
    event.preventDefault();
    this.search.submit();
  }

  // 處理分頁變更
  onPageChange(event: PageEvent) {
    if (event.pageSize !== this.search.pageSize) {
      // 如果改變每頁筆數，重置到第一頁
      this.search.setPageSize(event.pageSize);
    } else {
      // 只改變頁碼
      this.search.page = event.pageIndex + 1;
      this.search.submit();
    }
  }

  // Call API
  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    // 處理搜尋文字格式
    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    // 發送 API 請求
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

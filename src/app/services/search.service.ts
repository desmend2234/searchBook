import { Injectable, InjectionToken, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

interface SearchConfig {
  defaultPageSize?: number;
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

export interface ISearchService {
  searchText: string;
  pageSize: number;
  page: number;
  currentSearch: BehaviorSubject<CurrentSearch>;
  submit(): void;
  setPageSize(size: number): void;
}

export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('SEARCH_CONFIG');

@Injectable({
  providedIn: 'root',
})
export class SearchService implements ISearchService {
  searchText = '';
  pageSize: number;
  page = 1;
  currentSearch = new BehaviorSubject<CurrentSearch>({
    searchText: this.searchText,
    pageSize: 10,
    page: 1,
  });

  // 新增一個 Subject 來處理搜尋取消
  private searchCancel$ = new Subject<void>();

  constructor(private router: Router) {
    const config = inject(SEARCH_CONFIG, { optional: true });
    this.pageSize = config?.defaultPageSize ?? 10;

    this._initFromUrl();
  }

  private _initFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchText = params.get('q') || this.searchText;
    this.page = Number(params.get('page')) || 1;
    this.pageSize = Number(params.get('limit')) || this.pageSize;

    this.submit();
  }

  submit() {
    if (!this.searchText.trim()) return;

    // 取消之前的搜尋
    this.searchCancel$.next();

    const search: CurrentSearch = {
      searchText: this.searchText,
      pageSize: this.pageSize,
      page: this.page,
    };

    this.router.navigate([], {
      queryParams: {
        q: this.searchText,
        page: this.page,
        limit: this.pageSize,
      },
    });

    this.currentSearch.next(search);
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.page = 1; // 重置到第一頁
    this.submit();
  }

  // 新增公開的 getter
  get cancelSearch$() {
    return this.searchCancel$.asObservable();
  }
}

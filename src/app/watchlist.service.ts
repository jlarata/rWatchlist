import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Film } from './film';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {


  constructor(
    private http:HttpClient,
  ) { }

  private watchlistUrl = 'https://letterboxd.com/indialapalta/watchlist/'

  getWatchList(): Observable<Film[]> {
    return this.http.get<Film[]>(this.watchlistUrl)
    .pipe(
      tap(_ => this.log('fetched watchlist')),
      catchError(this.handleError<Film[]>('getwatchlist'))
    )
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error:any): Observable<T> => {
      console.error(error);
      this.log(`${operation} failed: ${error.message}`);

      return of(result as T)
    }
  }

  private log(message: string) {
    console.log('asd')
  }
}

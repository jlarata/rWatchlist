import { Component, OnInit } from '@angular/core';
import { LoadingSiteComponent } from '../loading-site/loading-site.component';
import { WatchlistService } from '../watchlist.service';
import { Film } from '../film';
import { NgFor, NgIf, NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { fromEvent } from 'rxjs';
import { LoadingComponentComponent } from "../loading-component/loading-component.component";

@Component({
  selector: 'app-watch-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, UpperCasePipe, LoadingSiteComponent, NgOptimizedImage, LoadingComponentComponent],
  templateUrl: './watch-list.component.html',
  styleUrl: './watch-list.component.css'
})
export class WatchListComponent implements OnInit {

  //watchlist: Film[] = [];
  //posterlist: string[] = [];
  isOnline = 'off';
  isLoaded = false;
  isLoading = false;
  emptyWatchList = false;
  targetUrl = "";
  pages: string[] = [];
  numFilms = 0;
  randomNumber: number = 0;
  randomFilm: Film = {
    name: '',
    poster: '',
    url: ',',
    imgUrlContainer: ''
  }
  username: string = '';
  lastUsername: string = '';

  headers: HttpHeaders = new HttpHeaders ({
    'X-Requested-With': 'XMLHttpRequest'
  })


  constructor (private watchlistService: WatchlistService, private loadingSiteComponent: LoadingSiteComponent) {
    this.loadingSiteComponent.setIntervalForRandomMessage()
  }
 

  async ngOnInit() {
    
    await this.watchlistService.wakeTheFake()
    .then((status) => (
      this.isOnline = status,
      this.loadingSiteComponent.clearIntervalForRandomMessage()
      ))
    }
  

  keydown$ = fromEvent<KeyboardEvent>(document, 'keydown');
  listener = this.keydown$.subscribe((x) => {if (x.key === "Enter"){
    this.bindReturn()
  }})

  bindReturn()  {
    let inputField: HTMLElement = document.getElementById('username')!;
    if (inputField === document.activeElement)
    {
      this.getRandomFilm();
    }
  } 

  async getRandomFilm() {
    if (this.username && this.username != '')
    { 
      if (this.lastUsername !== this.username)
      {
        this.isLoading = true;
        this.isLoaded = false;
      }
      
      await this.watchlistService.scrapeData(this.username)
        .then((scrapedObject) => (
          this.lastUsername = this.username,
          this.emptyWatchList = scrapedObject.emptyWatchlist,
          this.randomFilm = scrapedObject.randomFilm,
          this.randomNumber = scrapedObject.randomNumber,
          this.numFilms = scrapedObject.numFilms,
          this.isLoading = false,
          this.isLoaded = true,
          this.isOnline = 'on'
          ))
    }
    
  }

  goBack() {
    this.isLoaded = false;
  }
  
}
  




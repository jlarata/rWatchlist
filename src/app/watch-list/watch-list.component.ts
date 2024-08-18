import { Component, OnInit } from '@angular/core';
import { LoadingComponent } from '../loading/loading.component';
import { WatchlistService } from '../watchlist.service';
import { Film } from '../film';
import { NgFor, NgIf, NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-watch-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, UpperCasePipe, LoadingComponent, NgOptimizedImage],
  templateUrl: './watch-list.component.html',
  styleUrl: './watch-list.component.css'
})
export class WatchListComponent implements OnInit {

  //watchlist: Film[] = [];
  //posterlist: string[] = [];
  isOnline = 'off';
  isLoaded = false;
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
  username: string = ''

  headers: HttpHeaders = new HttpHeaders ({
    'X-Requested-With': 'XMLHttpRequest'
  })


  constructor (private watchlistService: WatchlistService, private loadingComponent: LoadingComponent) {
    this.loadingComponent.setIntervalForRandomMessage()
  }
 

  async ngOnInit() {
    
    await this.watchlistService.wakeTheFake()
    .then((status) => (
      this.isOnline = status,
      this.loadingComponent.clearIntervalForRandomMessage()
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
      await this.watchlistService.scrapeData(this.username)
        .then((scrapedObject) => (
          this.randomFilm = scrapedObject.randomFilm,
          this.randomNumber = scrapedObject.randomNumber,
          this.numFilms = scrapedObject.numFilms,
          this.isLoaded = true))
    }
    
  }

  goBack() {
    this.isLoaded = false;
  }
  
}
  




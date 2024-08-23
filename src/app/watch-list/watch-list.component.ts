import { Component, OnInit } from '@angular/core';
import { LoadingSiteComponent } from '../loading-site/loading-site.component';
import { WatchlistService } from '../watchlist.service';
import { Film } from '../film';
import { NgFor, NgIf, NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  username: string = '';
  lastUsername: string = '';

  //the service wakes up the hosting returns asynchronously this string as "on"
  isOnline = 'off';
  //at the end of a successful fetch (scrapeData), getRandomFilm() sets this on true
  isLoaded = false;
  //if is fetching for a new username, getRandomFilm() will set this on true. 
  //at the end of a successful fetch will set it false again
  isLoading = false;
  //if the service detects there is no username this will be fetch true
  userExists = true;
  //if the service detects the user exist but have no films in the watchlist this will be fetch true:
  emptyWatchList = false;

  //general variables to be provided from the service
  targetUrl = "";
  pages: string[] = [];
  numFilms = 0;
  randomNumber: number = 0;
  randomFilm: Film = {
    name: '',
    originalName: '',
    poster: '',
    url: ',',
    imgUrlContainer: ''
  }

  constructor (private watchlistService: WatchlistService, private loadingSiteComponent: LoadingSiteComponent) {
    this.loadingSiteComponent.setIntervalForRandomMessage()
  }
 
  //if a key is pressed...
  keydown$ = fromEvent<KeyboardEvent>(document, 'keydown');
  //and in case that key is Enter...
  listener = this.keydown$.subscribe((x) => {if (x.key === "Enter"){
    this.bindReturn()
  }})

  bindReturn()  {
    //get input field...
    let inputField: HTMLElement = document.getElementById('username')!;
    //and if the input field it is active...
    if (inputField === document.activeElement)
    {
      //go! (the idea being improve UX. Intuitive fill-field-and-press-enter logic)
      this.getRandomFilm();
    }
  } 


  async ngOnInit() {
    //the CORS Proxy is mounted in a free host. so this method ask the service to wakes it up.
    //in the meantime loadingSiteComponent is trying to entertain user.
    await this.watchlistService.wakeTheFake()
    .then((status) => (
      this.isOnline = status,
      //stops the loadingSiteComponent from keep switching random messages
      this.loadingSiteComponent.clearIntervalForRandomMessage()
      ))
    }
    
  async getRandomFilm() {
    /**must have text in input field
     * text must not be null or undefined
     * has to wait last film load */
    if (this.username && this.username != '' && !this.isLoading)
    { 
      this.isLoading = true;
      this.isLoaded = false;
      this.randomFilm.poster = ".\assets\img\phold.png"
      
      await this.watchlistService.scrapeData(this.username)
        .then((scrapedObject) => (
          this.userExists = scrapedObject.userExists,
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
  




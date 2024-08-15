import { Component } from '@angular/core';
import { WatchlistService } from '../watchlist.service';
import { Film } from '../film';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-watch-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, UpperCasePipe],
  templateUrl: './watch-list.component.html',
  styleUrl: './watch-list.component.css'
})
export class WatchListComponent {

  //watchlist: Film[] = [];
  //posterlist: string[] = [];
  isLoaded = false;
  targetUrl = "";
  pages: string[] = [];
  numfilms = 0;
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

  constructor (private watchlistService: WatchlistService) {}

  async getRandomFilm() {
    if (this.username && this.username != '')
    {
      await this.watchlistService.scrapeData(this.username)
        .then((randomFilm) => this.randomFilm = randomFilm);
        this.isLoaded = true;
    }
    
  }
  
}
  



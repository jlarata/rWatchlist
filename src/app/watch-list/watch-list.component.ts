import { Component } from '@angular/core';
import { WatchlistService } from '../watchlist.service';
import { Film } from '../film';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-watch-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, UpperCasePipe],
  templateUrl: './watch-list.component.html',
  styleUrl: './watch-list.component.css'
})
export class WatchListComponent {

  watchlist: Film[] = [];
  posterlist: string[] = [];
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
  

  ngOnInit():void { 
  }

  scrapeData = async () => {
    if (this.username && this.username != '')
    {
      console.log('scraping...')
    //1. create array of urls
      await this.createArrayOfURLs();
    //2. When array is ready, use that in a async-foreach-scraping function
      await this.populateWatchlist();

      await this.pickRandomFilm(this.numfilms);
    }
    

    //3. Let the DOM know it can render now
    
  };

  async createArrayOfURLs() {
    
    this.targetUrl = 'http://cors-anywhere.herokuapp.com/https://letterboxd.com/'+this.username+'/watchlist/'
    //this.targetUrl = 'https://letterboxd.com/'+this.username+'/watchlist/'
    let response = await fetch(this.targetUrl);
    let html = await response.text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");

    let numPages = this.calculatePages(doc);
    let i = 1;
            do {
                this.pages.push(this.targetUrl + "page/" + i.toString() +"/")
                i++;
            }
            while (i <= numPages);
    };

  calculatePages(doc: Document): number {
    let numPages: number = 1;  
    let cantPelisElement: Element = doc.querySelector('span.js-watchlist-count') as Element;
    if (cantPelisElement && cantPelisElement.textContent) {
      let textContent = cantPelisElement.textContent;
        let cantPelis = Number((textContent.match(/\d+/) as RegExpMatchArray)[0]);
        numPages = Math.ceil(cantPelis/28);      
      }
    return numPages;
    };
  
populateWatchlist = async () => {
    for (let page of this.pages) {
      await this.scrape(page)
      }
    
    //eliminated method: foreach doesnt have await/async support
    //    this.pages.forEach((page) => this.scrape(page))
    };  

  async scrape(page: string) {
    let response = await fetch(page, { method: "POST"});
    let html = await response.text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    let a = doc.querySelectorAll('ul.poster-list > li > div > img');
    //let b = doc.querySelectorAll('ul.poster-list > li > div'); 
    //console.log(a)
    
    a.forEach((title) => {
      this.numfilms ++;
      let specUrl = title.parentElement?.getAttribute('data-target-link') as string;
      let filmLink = 'http://cors-anywhere.herokuapp.com/https://letterboxd.com'+specUrl;
      let imgUrlContainer = 'http://cors-anywhere.herokuapp.com/https://letterboxd.com/ajax/poster'+specUrl+'std/125x187/'
      //let filmLink = 'https://letterboxd.com'+specUrl;
      //let imgUrlContainer = 'https://letterboxd.com/ajax/poster'+specUrl+'std/125x187/'

      this.watchlist.push({
        name: title.getAttribute('alt') as string,
        poster: 'not yet...',
        url: filmLink,
        imgUrlContainer: imgUrlContainer,
      })
    },)
  }

  async pickRandomFilm(numfilms: number) {
      this.randomNumber = Math.floor(Math.random() * numfilms-1);
      this.randomFilm = this.watchlist[this.randomNumber];
      console.log(`It seems it's your turn to see ${this.randomFilm.name}, \n link: ${this.randomFilm.url} that's film # ${this.randomNumber+1} out of ${numfilms}`)

      /* because of the very lazy loading, images cannot be fetched from original url
      as it turned out, images are fetched in a concatenated method. 
      below is the method to get them*/
      let response = await fetch(this.randomFilm.imgUrlContainer);
      let html = await response.text();
      let parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");
      let i = doc.querySelector('img');
      //console.log(i?.getAttribute('src'))

      this.randomFilm.poster = i?.getAttribute('src') as string;
      this.isLoaded = true;
      /* this method scrape the film specific page. to what end?
      let response = await fetch(this.watchlist[randomNumber].url);
      let html = await response.text();
      let parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");
      let i = doc.querySelector('section.poster-list > a > div > img');
      let imgUrl = i?.getAttribute('src');
      console.log(html);*/
      
  }


}
  



import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Film } from './film';
import { catchError, Observable, of, map, tap } from 'rxjs';
import { NgModelGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})

export class WatchlistService {

  /*httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(
    private http:HttpClient,
  ) { }*/

  private username: string = ''

  private proxy = 'https://apricot-mixed-ixora.glitch.me/'
  private watchlistUrl = 'https://letterboxd.com/'
  private targetUrl = "";

  private watchlist: Film[] = [];  
  private pages: string[] = [];

  private numFilms = 0;
  private randomNumber: number = 0;
  private status = 'off'
  
  private randomFilm: Film = {
    name: '',
    poster: '',
    url: ',',
    imgUrlContainer: ''
  }

  wakeTheFake = async () => {
    const myRequest = new Request(this.proxy);
    await fetch(myRequest).then((response) => {
      //console.log("ping: ", response.status)
      if (response.status == 200) {
        this.status = 'on';
      } else {
        this.status = 'off';
      }
    });
    return this.status;   
  }
    
  scrapeData = async (username: string) => {
      console.log('scraping...')
    //1. create array of urls
      await this.createArrayOfURLs(username);
    //2. When array is ready, use that in a async-foreach-scraping function
      await this.populateWatchlist();

      await this.pickRandomFilm(this.numFilms)

      return {
        randomFilm: this.randomFilm,
        randomNumber: this.randomNumber,
        numFilms: this.numFilms
      }
      
  };


  async createArrayOfURLs(username: string) {
    try {
    this.username = username;
    //this.targetUrl = 'https://cors-anywhere.herokuapp.com/https://letterboxd.com/'+this.username+'/watchlist/'
    this.targetUrl = this.proxy+this.watchlistUrl+this.username+'/watchlist/'
    //this.targetUrl = '/api/'+this.username+'/watchlist/'
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
    }
    catch (error) {
      console.log(error)
    } //console.log(this.pages)    
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
    try {
    let response = await fetch(page, { method: "POST"});
    let html = await response.text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    let a = doc.querySelectorAll('ul.poster-list > li > div > img');
  
    a.forEach((title) => {
      this.numFilms ++;
      let specUrl = title.parentElement?.getAttribute('data-target-link') as string;
      //let filmLink = '/api/'+specUrl;
      //let imgUrlContainer = '/api/ajax/poster'+specUrl+'std/125x187/'
      //let filmLink = 'https://cors-anywhere.herokuapp.com/https://letterboxd.com'+specUrl;
      //let imgUrlContainer = 'https://cors-anywhere.herokuapp.com/https://letterboxd.com/ajax/poster'+specUrl+'std/125x187/'
      let filmLink = this.proxy+'https://letterboxd.com'+specUrl;
      let imgUrlContainer = this.proxy+'https://letterboxd.com/ajax/poster'+specUrl+'std/125x187/'
  
      this.watchlist.push({
        name: title.getAttribute('alt') as string,
        poster: 'not yet...',
        url: filmLink,
        imgUrlContainer: imgUrlContainer,
        })
      })
    }
    catch (error) {
      console.log(error)
    }  
  }
  
  async pickRandomFilm(numFilms: number): Promise<Film>  {
      this.randomNumber = Math.floor(Math.random() * numFilms-1);
      this.randomFilm = this.watchlist[this.randomNumber];
      //console.log(`It seems it's your turn to see ${this.randomFilm.name}, \n link: ${this.randomFilm.url} that's film # ${this.randomNumber+1} out of ${numFilms}`)
  
      /* because of the very lazy loading, images cannot be fetched from original url
      as it turned out, images are fetched in a concatenated method. 
      below is the method to get them*/
      try {
        let response = await fetch(this.randomFilm.imgUrlContainer);
        let html = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        let i = doc.querySelector('img');
        //console.log(i?.getAttribute('src'))
  
        this.randomFilm.poster = i?.getAttribute('src') as string;
        /* this method scrape the film specific page. to what end?
        let response = await fetch(this.watchlist[randomNumber].url);
        let html = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        let i = doc.querySelector('section.poster-list > a > div > img');
        let imgUrl = i?.getAttribute('src');
        console.log(html);*/
      }
      catch (error) {
        console.log(error)
      }
      console.log('122')
      return this.randomFilm;
        
    }
  }
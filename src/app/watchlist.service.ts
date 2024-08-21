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
  private isSameUser = false;
  private emptyWatchlist = false;
  
  private  myBlob = new Blob();
  private  myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
  private  myResponse = new Response(this.myBlob, this.myOptions);
  
  private watchlist: Film[] = [];  
  private pages: string[] = [];

  private numFilms = 0;
  private randomNumber: number = 0;
  private status = 'off';

  private userExists = true;
  
  private randomFilm: Film = {
    name: '...',
    originalName: '...',
    poster: '...',
    url: '...',
    imgUrlContainer: '...'
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
      this.myResponse = await this.checkUserExists(username);
      
      if (this.userExists) {
        if (this.isSameUser == false)
        {
          await this.createArrayOfURLs(username);    
        //2. When array is ready => async-foreach-scraping function
          if (this.emptyWatchlist === false) {
            await this.populateWatchlist();
          } else {
            console.log('this user has no films in the watchlist')
          }
        }
        if (!this.emptyWatchlist){
          await this.pickRandomFilm(this.numFilms);
        }
        
        } else {
      console.log('nonexistent username')
      }
    
    return {
      randomFilm: this.randomFilm,
      randomNumber: this.randomNumber,
      numFilms: this.numFilms,
      emptyWatchlist: this.emptyWatchlist,
      userExists: this.userExists
      }
      
  };

  async checkUserExists(username: string) {
    this.targetUrl = this.proxy+this.watchlistUrl+username+'/watchlist/';

    if (this.username !== username){
      //clear array because this method has ben previously called with another username
      this.isSameUser = false;
      this.pages = [];
      this.username = username;
      this.userExists = true;
      let response = await fetch(this.targetUrl)
      if (response.status === 404)
      {
       this.userExists = false;
       console.log("turned false");
      } 
      return response
    
    } else {
      if (this.userExists == true) {
        if (!this.emptyWatchlist){
          console.log(`recycling url array for ${username}`)
        }
        this.isSameUser = true;
        return this.myResponse
      } else {
        console.log("user no exists!")
        this.isSameUser = true;
        return this.myResponse;
      } 
    } 
  }

  async createArrayOfURLs(username: string) {
        this.targetUrl = this.proxy+this.watchlistUrl+this.username+'/watchlist/'
        
        try {
          //let response = await fetch(this.targetUrl);
          let html = await this.myResponse.text();
          let parser = new DOMParser();
          let doc = parser.parseFromString(html, "text/html");
          if (Number((((doc.querySelector('span.js-watchlist-count') as Element).textContent as String).match(/\d+/) as RegExpMatchArray) [0]) !== 0)
          {
            console.log(`creating new array of urls for ${username}`)
            let numPages = this.calculatePages(doc);
            let i = 1;
            do {
                  this.pages.push(this.targetUrl + "page/" + i.toString() +"/")
                  i++;
               }
            while (i <= numPages);
            this.isSameUser = false;
            this.emptyWatchlist = false;
            }
            else {
              this.emptyWatchlist = true;
            }
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
    if (!this.isSameUser) {
      this.watchlist = [];
      this.numFilms = 0;
      console.log(`populating watchlist array for ${this.username}`)      
      for (let page of this.pages) {
        await this.scrape(page)
        }
      } else {
        console.log(`recycling ${this.username}'s watchlist`)
        
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
          let filmLink = 'https://letterboxd.com'+specUrl;
          let imgUrlContainer = this.proxy+'https://letterboxd.com/ajax/poster'+specUrl+'std/125x187/'
      
          this.watchlist.push({
            name: title.getAttribute('alt') as string,
            originalName: title.getAttribute('alt') as string,
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
      //console.log(`number of films: ${this.numFilms}`)
      this.randomNumber = Math.floor(Math.random() * numFilms-1);
      this.randomFilm = this.watchlist[this.randomNumber];
      //console.log(`It seems it's your turn to see ${this.randomFilm.name}, \n link: ${this.randomFilm.url} that's film # ${this.randomNumber+1} out of ${numFilms}`)
      

      /*1. because letterboxed sometimes displays english name and other times displays
      original name, below is the method to ensure both are fetched if exists*/
      try {
        let response = await fetch(this.proxy+this.randomFilm.url);
        let html = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        let j = doc.querySelector('h2.originalname')?.textContent;
        if (j) {
          this.randomFilm.originalName = j
        }
      }
      catch (error) {
        console.log(error)
      }

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
  
        this.randomFilm.poster = (i?.getAttribute('src') as string).replace("125-0-187", "460-0-690");
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
      return this.randomFilm;
        
    }
  }
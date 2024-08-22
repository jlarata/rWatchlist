import { Injectable } from '@angular/core';
import { Film } from './film';

@Injectable({
  providedIn: 'root'
})

export class WatchlistService {


  /*service will remember this string and compare to "username" parameter to verify 
  if its repeating the las search*/ 
  private username: string = ''
  private isSameUser = false;

  /*proxy server to elude CORS
  proxy + watchlistUrl + user (+ hardcoded string) will be used to initialize the targetUrl*/ 
  private proxy = 'https://apricot-mixed-ixora.glitch.me/'
  private watchlistUrl = 'https://letterboxd.com/'
  private targetUrl = "";
  
  /* mock Response is inicialized to leverage benefits of checkUserExists method. see below */
  private  myBlob = new Blob();
  private  myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
  private  myResponse = new Response(this.myBlob, this.myOptions);
  

  /********   useful variables   ********/
  private watchlist: Film[] = [];  
  private pages: string[] = [];
  /**************************************/

  /******** variables returned   ********/
  /**wakeTheFake():**/
  private status = 'off';

  /**scrapeData():**/
  private numFilms = 0;
  private randomNumber = 0;  
  private userExists = true;
  private randomFilm: Film = {
    name: '...',
    originalName: '...',
    poster: '...',
    url: '...',
    imgUrlContainer: '...'
  }
  /** case user exists but the watchlist is empty, the service will set this true **/
  private emptyWatchlist = false; 
  /**************************************/


  /** the CORS Proxy is deployed in a free host. this method wakes it up. */
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
 
  /** main function */
  scrapeData = async (username: string) => {
    console.log('scraping process iniciated')

    /** 1. checks if user exists in letterboxd. this shouldn't have any return except a boolean
     * but, in order to check existence, a fetch() is needed. so, although contrary to clean code
     * ideas, it seemed more efficient to keep the data fetched and use it in the next step.
     * that's the reason myResponse is a Response already initialized: now, provided that user
     * exists, myResponse will store de data fetched, so it can be called an used in the next method.*/
      this.myResponse = await this.checkUserExists(username);
      
      /**then, if user exists... */
      if (this.userExists) {
        /**and if not repeating same user that in the inmediately previous search*/
        if (!this.isSameUser)
        {
          /** 2. create array of urls. this method also sets emptywatchlist true or false */
          await this.createArrayOfURLs(username);    
          /** and, in case user doesn't have an empty watchlist in ltrbxd... */
          if (!this.emptyWatchlist) {
            /** 3. use the URL array to perform an async-for-loop-scraping function */
            await this.populateWatchlist();
          } else {
            /** case Z) user exists but has no films */
            console.log('this user has no films in the watchlist')
          }
        } else {
          /** case: same user that in the inmediately previous search:
           * so there is no need for new URL array or repopulate watchlist[] */
          if (!this.emptyWatchlist){
            /** as long as it have films in the watchlist: pick a random film */
            await this.pickRandomFilm(this.numFilms);
          } else {
            /** case Z) user exists but has no films */
            console.log('this user has no films in the watchlist')
          }
        }

        /** 4. as long as it has films in the watchlist: pick a random film */
        if (!this.emptyWatchlist){
          await this.pickRandomFilm(this.numFilms);
        }

      } else {
        /** case Y) checkUserExists() returned 404 so this.userExists was set false*/
        console.log('nonexistent username')
      }
    
    /** 5. return. if case Z) or case Y), most of these will return as inicialized "..." strings
     * the booleans emptyWatchlist and userExists will be the relevant information for the component. */
    return {
      randomFilm: this.randomFilm,
      randomNumber: this.randomNumber,
      numFilms: this.numFilms,
      emptyWatchlist: this.emptyWatchlist,
      userExists: this.userExists
      }
      
  };

  /** first method:
   * 1) checks if repeating user search and set isSameUser
   * 2) checks if the user exists and set userExists 
   * 3) if (!1 &&  2) : and returns response with targetUrl-fetch() data */

  async checkUserExists(username: string) {
    this.targetUrl = this.proxy+this.watchlistUrl+username+'/watchlist/';
    if (this.username !== username){
      /** clear array because this method has ben previously called with another username */
      this.isSameUser = false;
      this.pages = [];
      this.username = username;
      this.userExists = true;
      let response = await fetch(this.targetUrl)
      if (response.status === 404)
      {
       this.userExists = false;
      } 
      return response
    
    } else {
      if (this.userExists) {
        if (!this.emptyWatchlist){
          console.log(`recycling url array for ${username}`)
        }
        this.isSameUser = true;
        return this.myResponse
      } else {
        this.isSameUser = true;
        return this.myResponse;
      } 
    } 
  }

  /** second method:
   * parse the targetUrl data obtained in first method
   * 1) checks if user has films in the watchlist and sets emptyWatchlist
   * if emptyWatchlist is false:
   * 2) calls calculatePages parse method to obtain numPages and uses this variable to create
   * the correct amount of elements in the URL array  
   */
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

            //restart variables for next search
            this.isSameUser = false;
            this.emptyWatchlist = false;
          } else {
            this.emptyWatchlist = true;
          }
        }
        catch (error) {
          console.log(error)
        }  
  };

  /** aid method called from createArrayOfURLs() */
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
  
  /** third method:
   * will be called only if created a new array of urls
   * (that is: userExists && !emptyWatchlist && !isSameUser ) 
   */
  populateWatchlist = async () => {
    this.watchlist = [];
    this.numFilms = 0;
    console.log(`populating watchlist array for ${this.username}`)      
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

          /** specific url for each movie and for each movie poster 
           * (those are 2 different links because of images-lazy-loading. see below)
           
           * worth of notice: the method will not scrap each poster for it would slow down
           * since each poster would have to be fetched from a new url.
           * so at this point "poster" attribute will be "not yet..." string  */

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
  
  /** fourth method
   * choose a randomFilm from the watchlist[]
   * will be called only if userExists && !emptyWatchlist 
   * will fetch 2 strings film-specific: original name (if exists) and poster url. See below
   */
  async pickRandomFilm(numFilms: number): Promise<Film>  {
      this.randomNumber = Math.floor(Math.random() * numFilms-1);
      this.randomFilm = this.watchlist[this.randomNumber];

      /** ltbxd sometimes displays title in english and some times displays 
       * the original name, below is the method to ensure both are fetched if exists 
       * case not: originalName was inicialized same as name in the previous method
       * the component will check if name !== originalName to know if there is, in fact, an originalName */
      
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
      
      /** because of the type of lazy loading, image urls wont be at the first url fetched
       *  so image urls are fetched in this concatenated method. */
      try {
        let response = await fetch(this.randomFilm.imgUrlContainer);
        let html = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        let i = doc.querySelector('img');

        this.randomFilm.poster = (i?.getAttribute('src') as string).replace("125-0-187", "460-0-690");
      }
      catch (error) {
        console.log(error)
      }
      return this.randomFilm;
        
    }
  }
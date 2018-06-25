import {Component, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge} from 'rxjs/operators';
import {trigger, state, style, animate, transition} from '@angular/animations';

//const WIKI_URL = 'https://en.wikipedia.org/w/api.php';
const WIKI_URL = 'http://api.themoviedb.org/3/search/movie';
const PARAMS = new HttpParams({
  fromObject: {
//  action: 'opensearch',
  //format: 'json',
  //origin: '*'
  api_key: 'f22e6ce68f5e5002e71c20bcba477e7d'
  }
});

@Injectable()
export class WikipediaService {
  constructor(private http: HttpClient) {}
  /*
    Optional object parameter, so that jsons with different properties can be used. 
    Note that here I'm just using an interface with the same name(see below), but if this service was to be exported this would allow for flexibility
  */
  ssearch(term: string, expectedJson?: Object) : Observable<any> { //optional object parameter, so that jsons with different properties can be used
    if (term === '') {
      return of([]);
    }

    else if (expectedJson && expectedJson.hasOwnProperty('results')){
      return this.http
      .get(WIKI_URL, {params: PARAMS.set('query', term)}).pipe(
        map(response => (response as expectedJson).results) //this will likely be changed to match the json returned by the webserver
        );
      }
  //default
      return this.http
        //.get(WIKI_URL, {params: PARAMS.set('search', term)}).pipe(
      .get(WIKI_URL, {params: PARAMS.set('query', term)}).pipe(
        //.get(WIKI_URL, {params: PARAMS.set('search', term)}).pipe(
          //map(response => response[1])
          map(response => (response as expectedJson))
        );
  }
}

@Component({
  selector: 'app-typeahead',
  templateUrl: './typeahead.component.html',
  providers: [WikipediaService],
  styleUrls: ['./typeahead.component.css']
  
  animations: [
    trigger('fade', [
      transition('void => *',[
        style({ opacity: '0'}),
        animate(1500,
            style({opacity: '1'})
          )])

    ])
  ]
})


export class TypeaheadComponent {

  model: any;
  limit: number = 5;
  searching = false;
  searchFailed = false;
  hideSearchingWhenUnsubscribed = new Observable(() => () => this.searching = false);

  constructor(private _service: WikipediaService) {}

  search = (text$: Observable<any>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term =>
        this._service.search(term, {
          page: "",
          total_results:  "",
          results: []
        }).pipe(
          tap(() => this.searchFailed = false),
          map(response => response.splice(0,this.limit)), //reduce the number of elements suggested to the limit
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          }))
      ),
      tap(() => this.searching = false),
      merge(this.hideSearchingWhenUnsubscribed)
    );

    format = (movie: {original_title: string}) => movie.original_title;
  
    setLimit = (limit : number) => this.limit = limit;
  
    /* proof that you can opperate with whatever goes into model
    addition = (): number => {
      if(model == null)
        return 0;
      else{
        let sum: number = 0;
        for(let value of this.model.genre_ids)
            sum += +value;

        return sum;
        }
    }
    */
}

/*
  Not used
//sample object 
interface expectedJson{
    page: string;
    total_results: string;
    results: Object[];
  }
  */

/*
export class movie{
  public vote_count: number;
  public id: number;
  public video: boolean;
  public vote_average: number;
  public title: string;
  public popularity: number;
  public poster_path: string;
  public original_language: string;
  public original_title: string;
  public genre_ids: [];
  public backdrop_path: string;
  public adult: boolean
  public overview: string;
  public release_date: string;

  constructor() {}

  public toString(): string{
    return this.original_title;
  }
}
*/

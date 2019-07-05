import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";

import { environment } from "../../environments/environment";

import { Task } from "../task";
import { Category } from "../category";
import { Planner } from "../planner";
import { MessageService } from "./message.service";


const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" })
};

@Injectable({
  providedIn: "root"
})
export class PlannerService {
   private Url = environment.baseUrl + "/planner"; // URL to web api local
   
   constructor(
    private http: HttpClient,
    private messageService: MessageService
    ) {}

   /** POST: add a new task to the server */
 addRow(planner: Planner,timelog,cate_id): Observable<Planner> {
    console.log("Planner row ",planner);
    planner["timelog"] = timelog;
    planner["categoryID"] = cate_id;
    const url = `${this.Url}/create`;
    return this.http.post<Planner>(url, planner, httpOptions).pipe(
      tap((planner: Planner) => this.log(`added planner w/ id=${planner.rowID}`)),
      catchError(this.handleError<Planner>("addRow"))
      );
  }  
  getData(): Observable<Planner[]> {
    const url = `${this.Url}/all`;
    return this.http.get<Planner[]>(url).pipe(
      tap(planner => this.log("fetched data")),
      catchError(this.handleError("getData", []))
      );
  }
  updateData(planner: Planner,timelog,dayIndex,cate_id): Observable<any> {
    const url = `${this.Url}/update/${planner.rowID}`;
    const input = { planner: Planner,timelog,dayIndex:dayIndex,categoryID:cate_id };
    console.log('Input', input);
    return this.http.put(url, input, httpOptions).pipe(
      tap(_ => this.log(`updated Planner id=${planner.rowID}`)),
      catchError(this.handleError<any>("updateRow"))
      );
  }
  /** Delete Row */  
  deleterow(planner: Planner): Observable<Planner[]> {
    console.log('planner', planner);
    const url = `${this.Url}/delete/${planner.rowID}`;
    return this.http.post(url, planner, httpOptions).pipe(
      tap(_ => this.log("fetched tasks")),
      catchError(this.handleError<any>("deletecate"))
      );
  }
  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** PUT: update the task on the server */
  /*updateTask(task: Task): Observable<any> {
    const url = `${this.CateUrl}/update/${task.taskID}`;
    const input = { task: task };
    return this.http.put(url, input, httpOptions).pipe(
      tap(_ => this.log(`updated task id=${task.taskID}`)),
      catchError(this.handleError<any>("updateTask"))
    );
  }*/
   /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
   

  /** GET Service from the server */
 /* getCategory(): Observable<Category[]> {
    const url = `${this.CateUrl}/all`;
    return this.http.get<Category[]>(url).pipe(
      tap(tasks => this.log("fetched tasks")),
      catchError(this.handleError("getCategory", []))
    );
  }*/

  /** Log a TaskService message with the MessageService */
  private log(message: string) {
    //console.log("call log function ");
    this.messageService.add(`TaskService: ${message}`);
  }
}

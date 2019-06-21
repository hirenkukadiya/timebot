import { Component, OnInit, Output, EventEmitter,
    Input,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ContentChildren,
    QueryList,
    ViewContainerRef,
    Renderer} from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl
} from "@angular/forms";

import { OrderBy } from "../util/orderBy.pipe";
import { GroupByPipe } from "../util/group-by.pipe";
import { Task } from "../task";
import { Category } from "../category";
import { TaskService } from "../services/task.service";
import { AuthService } from "../services/auth.service";
import { EventEmiterService } from "../services/event.emmiter.service";
//import {NodeEvent, TreeModel, RenamableNode } from 'ng2-tree';
import { Observable, of } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { webSocket } from "rxjs/webSocket";
import { ajax } from "rxjs/ajax";
import { TestScheduler } from "rxjs/testing";
import * as $ from 'jquery';

@Component({
  selector: "my-table-row",
  template: `<tr><td>Hello</td></tr>`
})
export class RowsComponent implements OnInit{
  public form: FormGroup;
  category_lists: any[] = [];
  category: any;
  data: any;
  items:any;
  rowId:any;
  constructor(private taskService: TaskService) { 
  }
ngOnInit() {
  	this.getCategory();
    //  $(document).ready(function(){
    // $('.ui-slider').slider({
    //     range: true
    //   });
    // });
  }
  getCategory(): void {
    this.taskService.getCategory().subscribe(category => {
      this.filterCategroy(category);
    });
  }

  filterCategroy(category) {
    let category_list = [];
    let tasks_completed = [];
    for (let index in category) {
      let task = category[index];

      if (task.name == "unassinged") {
        //tasks_completed.push(task);
      } else {
        category_list.push({
          value: task.categoryID,
          label: task.name,
          index: task.index
        });
      }
    }
    category_list.sort(function(a, b) {
      return a.index - b.index;
    });
    this.category_lists = category_list;
    this.category = category_list;
  }
}

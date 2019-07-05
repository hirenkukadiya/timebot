import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import * as $ from "jquery";

@Component({
  selector: "app-action",
  templateUrl: "./action.component.html",
  styleUrls: ["./action.component.css"]
})
export class ActionComponent implements OnInit{
  isOpen=0;
  task:any;
  constructor(private formBuilder: FormBuilder) { 
  	this.isOpen = 0;
  }
  ngOnInit() {
  	
  }
  onShowAction(task) {
  	console.log('Helllo this is Test ',task);
  	this.task = task;
    this.isOpen = 1;
  }
  oncloseAction(){
  	this.isOpen = 0;
  }
}

import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl
} from "@angular/forms";

import { OrderBy } from "../util/orderBy.pipe";
import { Task } from "../task";
import { TaskService } from "../services/task.service";
import { Category } from "../category";
import { CategoryService } from "../services/category.service";
import { AuthService } from "../services/auth.service";
import { EventEmiterService } from "../services/event.emmiter.service";

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  providers: [OrderBy]
})
export class CategoryComponent implements OnInit {

  categoryList: Category[] = [];
  tasks_org: Category[] = [];
  tasks_completed: Category[] = [];
  CategoryForm: any;
  name: string;
  parent: string;
  parent_name: string;;
  is_add_task: boolean;
  sortableOptions: any;
  categoryID : string;

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private categoryservice: CategoryService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService,
    private orderBy: OrderBy
  ) {
  }
  ngOnInit() {
    this.createCatForm();
    this.defaultUserLogin();
    this.getCategory();
    //this.is_add_task = false;
  }
  createCatForm() {
    this.CategoryForm = this.formBuilder.group({
      name: ["", Validators.required],
      parent: ["", ""],
      parent_name: ["", ""]
    });
  }
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  toggleCheckBox(task: Task): void {
    if (task.status == undefined) {
      task.status = 1;
    } else {
      if (task.status == 0) {
        task.status = 1;
      } else {
        task.status = 0;
      }
    }
    var input = {};
    input["task"] = task;
    console.log("input ", input);
    this.categoryservice.updateTask(task).subscribe(task=>{
      this.getCategory();
    });
  }
  addCategory(name: string,parent:string): void {
    if (this.CategoryForm.valid) {
      this.is_add_task = true;
      if (this.authService.isAuthenticate()) {
        this.is_add_task = false;
        name = name.trim();
        if (!name) {
          return;
        }
        let parent = "";
       if(this.CategoryForm.value.parent){
          parent = this.CategoryForm.value.parent;
       }
       //var category_id = "2";
        this.categoryservice.addTask({name} as Task,{parent} as any).subscribe(hero => {
          console.log("Add task sucessfulluy");
          this.resetForm();
          this.getCategory();
        });
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    } else {
      console.log("invlid form");
      this.validateAllFormFields(this.CategoryForm);
    }
  }
  defaultUserLogin(): void {}
  getCategory(): void {
    console.log("get category...");
    this.categoryservice.getCategory().subscribe(Category => {
      //console.log("view updatess ", tasks);
      this.ViewCate(Category);
    });
  }
  ViewCate(Category) {
    let cate_list = [];
    let tasks_completed = [];
    for (let index in Category) {
      let cate = Category[index];
      if (cate.status == 0) {
        cate_list.push(cate);
      }
    }
    this.categoryList = this.orderBy.transform(cate_list, ["+index"]);
    let data = this.orderBy.transform(cate_list, ["+index"]);
    let newdata = [];
   for (let i = 0; i < data.length; i++) {
    //console.log('data',data[i].categoryID);
    let tempdata = [];
    tempdata['cate_name'] = data[i].categoryID;
    tempdata['cate_id'] = data[i].name;
    tempdata['child'] = this.getChilTask(data[i].categoryID);
    newdata.push(tempdata);
   }
   this.categoryList
   console.log('newdata',newdata);
  }
  getChilTask(cateId) {
    let childrens = [];
    let childrens_ids = {};
    let childrens_next_ids = {};
    let datas = this.categoryList;
    var data_abd = [];

    for (let i = 0; i < datas.length; i++) {
      if (
        datas[i].hasOwnProperty("name") &&
        datas[i].hasOwnProperty("categoryID") &&
        datas[i]["parent"] === cateId
      ) {
        var child = {};
        child["name"] = datas[i].name;
        child["id"] = datas[i].categoryID;
        child["childrens"] = [];
        childrens.push(child);
      }
    }  
    //childrens.sort((a, b) => a.index.toString().localeCompare(b.index));
    return childrens;
  }
  resetForm() {
    this.name = "";
    this.parent = "";
    this.parent_name = "";
    this.CategoryForm.controls.name.markAsUntouched({ onlySelf: true });
    this.CategoryForm.controls.name.markAsPristine({ onlySelf: true });
  }
  getCategoryName(cateId){
    let cate = [];
    for (let cat in this.categoryList) {
      cate[this.categoryList[cat]['categoryID']] = this.categoryList[cat]['name'];
    }
    return cate[cateId];
  }
  deleteCate(task: Category): void {
    console.log(" delete cate ",task);
    this.categoryservice.deletecate(task).subscribe(task=>{
      this.getCategory();
    });
  }
}

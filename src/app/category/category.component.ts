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
  userID:string;
  cateName : string;
  parentName : string;
  parentID:string;
  cateID:string;
  edit: boolean = false;
  showbutton = 0;
  validationerror=0;
  nodes = [];
  options = {
    allowDrag: false
  };

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private categoryservice: CategoryService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService,
    private orderBy: OrderBy
  ) {
     this._eventEmiter.dataStr.subscribe(data => {
      this.getEventResponse(data);
    });
  }
  ngOnInit() {
    this.createCatForm();
    this.defaultUserLogin();
    this.getCategory();
    var userdata = JSON.parse(localStorage.user);
    this.userID = userdata['_id'];
    //this.is_add_task = false;
  }
  createCatForm() {
    this.CategoryForm = this.formBuilder.group({
      name: ["", ""],
      parent: ["", ""],
      parent_name: ["", ""]
    });
  }
  getEventResponse(data) {   
    var userdata = this.authService.getUser();
    if(userdata){
      this.userID = userdata['_id'];    
    } 
    if (
    (data.user_signin != undefined && data.user_signin == true) ||
    (data.user_signout != undefined && data.user_signout == true)
    ) {
       console.log('Another login', data);
       this.getCategory();
    }
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
  }
  addCategory(name: string,parent:string): void {
    console.log('this.CategoryForm.value',this.CategoryForm.value);
    
    if(this.CategoryForm.value.parent_name==undefined || this.CategoryForm.value.parent_name==""){
      this.validationerror = 2;
      return;
    }
    if (!name) {
      this.validationerror = 1;
      return;
    }    
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
       if(this.edit){
           let categoryID = this.cateID;
            this.categoryservice.updateCategory(name,categoryID).subscribe(hero=>{
              this.getCategory();
            });
       }else{
          this.categoryservice.addTask({name} as Task,{parent} as any).subscribe(hero => {
            this.getCategory();
            this.resetForm();
          });
       }
        // });
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    
  }
  defaultUserLogin(): void {}
  getCategory(): void {
    console.log("get category...");
    this.categoryservice.getCategory().subscribe(Category => {
      this.ViewCate(Category);
    });
  }
  ViewCate(Category) {
    let cate_list = [];
    let tasks_completed = [];
    for (let index in Category) {
      let cate = Category[index];
        cate_list.push(cate);
    }
    this.categoryList = this.orderBy.transform(cate_list, ["+index"]);
    let data = this.orderBy.transform(cate_list, ["+index"]);
    let newdata = [];
   for (let i = 0; i < data.length; i++) {
    //console.log('data',data[i].categoryID);
    if(data[i].parent == ""){
      let tempdata = [];
      tempdata['id'] = data[i].categoryID;
      tempdata['name'] = data[i].name;
      tempdata['children'] = this.getChilCat(data[i].categoryID);
      newdata.push(tempdata);
     }
   }
   this.nodes = newdata;
  }
  getChilCat(cateId) {
   // console.log('this.userID',this.userID);
    let childrens = [];
    let childrens_ids = {};
    let childrens_next_ids = {};
    let datas = this.categoryList;
    //console.log('cate_list',datas);
    var data_abd = [];
    for (let i = 0; i < datas.length; i++) {
      if (
        datas[i].hasOwnProperty("name") &&
        datas[i].hasOwnProperty("categoryID") &&
        datas[i]["parent"] === cateId && datas[i]["user"]!=undefined && datas[i]["user"]['$id'] == this.userID
      ) {
        var child = {};
        child["name"] = datas[i].name;
        child["id"] = datas[i].categoryID;
        child["parentID"] = cateId;
        child["parentName"] = this.getCategoryName(cateId);
        child["children"] = this.getChilCat(datas[i].categoryID);
        childrens.push(child);
      }
    }
    return childrens;
  }
  resetForm() {
    this.name = "";
    this.parent = "";
    this.parent_name = "";
    this.cateName = "";
    this.parentName = "";
    this.parentID = "";
    this.cateID = "";
    this.showbutton = 0;
    this.CategoryForm.controls.name.markAsUntouched({ onlySelf: true });
    this.CategoryForm.controls.name.markAsPristine({ onlySelf: true });
    this.CategoryForm.controls.parent.markAsUntouched({ onlySelf: true });
    this.CategoryForm.controls.parent.markAsPristine({ onlySelf: true });
    this.edit = false;
    this.validationerror = 0;
    this.getCategory();
  }
  getCategoryName(cateId){
    let cate = [];
    for (let cat in this.categoryList) {
      cate[this.categoryList[cat]['categoryID']] = this.categoryList[cat]['name'];
    }
    return cate[cateId];
  }
  deleteCate(){
    let category = new Category();
    category.categoryID = this.cateID;
    if(this.parentID!=undefined && this.parentID!="" && this.cateID!=""){
      this.categoryservice.deletecate(category).subscribe(task=>{
        this.getCategory();
        this.resetForm();
      }); 
    }
  }
  initChildCat(category) {
    
    this.cateName = category.name;
    this.parentName = category.parentName;
    this.parentID = category.parentID;
    this.cateID = category.id;
    
    if(this.parentID){
      this.CategoryForm.setValue({
          name:this.cateName,
          parent:this.parentID,
          parent_name :this.parentName,
      });
    this.showbutton = 1;  
    this.edit = true;
    }else{
       this.CategoryForm.setValue({
          name:'',
          parent:this.cateID,
          parent_name :this.cateName,
      });
     this.edit = false;
     this.showbutton = 0;
    }
    this.validationerror = 0;
  }
  addNew(category){
    this.edit = false;
    this.cateName = this.cateName;
    this.parentName = this.parentName;
    this.parentID = this.parentID;
    this.CategoryForm.setValue({
          name:'',
          parent:this.cateID,
          parent_name :this.cateName,
      });
  }
}

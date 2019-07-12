import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { TreeviewI18n, TreeviewItem, TreeviewConfig, DropdownTreeviewComponent, TreeviewHelper } from 'ngx-treeview';
import { DropdownTreeviewSelectI18n } from '../dashboard/dropdown-treeview-select-i18n';
import { OrderBy } from "../util/orderBy.pipe";
import { GroupByPipe } from "../util/group-by.pipe";
import { TaskService } from "../services/task.service";
import { AuthService } from "../services/auth.service";
import { EventEmiterService } from "../services/event.emmiter.service";


@Component({
  selector: 'app-categorymodal',
  templateUrl: './categorymodal.component.html',
  styleUrls: ['./categorymodal.component.css'],
  providers: [OrderBy, GroupByPipe,
    { provide: TreeviewI18n, useClass: DropdownTreeviewSelectI18n }
  ]
})
export class CategorymodalComponent implements OnInit {
  
  @Input() items: TreeviewItem[];
  @Input() catvalue: any;
  @Output() valueChange = new EventEmitter<any>();
  @ViewChild(DropdownTreeviewComponent) dropdownTreeviewComponent: DropdownTreeviewComponent;
  
  userID: string;
  category: any;
  category_lists: [];
  category_id: string;
  catconfig = TreeviewConfig.create({
    hasFilter: true,
    hasAllCheckBox: false,
    hasCollapseExpand: false,
    maxHeight: 500
  });

  private dropdownTreeviewSelectI18n: DropdownTreeviewSelectI18n;
  constructor(
    public taskService: TaskService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService,
    public i18n: TreeviewI18n,
  ) {
    this.dropdownTreeviewSelectI18n = i18n as DropdownTreeviewSelectI18n;
  }

  ngOnInit() {
    this.items = [];
    var userdata = this.authService.getUser();
    this.userID = userdata['_id'];
    this.getCategory();
  }

  getCategory(): void {
    this.taskService.getCategory().subscribe(category => {
      this.filterCategroy(category);
    });
  }

  filterCategroy(category) {

    this.items = [];
    this.category = [];
    let category_list = [];
    for (let index in category) {

      let cat = category[index];
      let userID = "";
      if (cat["user"] != undefined) {
        userID = cat["user"]['$id'];
      }
      if (cat.parent == undefined || cat.parent == "" || userID == this.userID) {
        category_list.push({
          value: cat.categoryID,
          label: cat.name,
          index: cat.index,
          color: cat.color,
          parent: cat.parent,
          userID: userID,
          is_display: cat.name == "Unassigned" ? false : true
        });
      }
    }
    category_list.sort(function (a, b) {
      return a.index - b.index;
    });
    this.category = category_list;

    for (let index in category_list) {
      var cateId = category_list[index].value;
      if (category_list[index].parent == "") {
        const childrenCategory = new TreeviewItem({
          text: category_list[index].label,
          value: category_list[index].value,
          collapsed: true,
          checked: false,
          children: this.getChilCat(cateId)
        });
        this.items.push(childrenCategory);
      }
    }
    this.category_id = "";
  }
  getChilCat(cateId) {
    // console.log('this.userID',this.userID);
    let childrens = [];
    let childrens_ids = {};
    let childrens_next_ids = {};
    let datas = this.category;

    var data_abd = [];
    for (let i = 0; i < datas.length; i++) {
      if (
        datas[i].hasOwnProperty("label") &&
        datas[i].hasOwnProperty("value") &&
        datas[i]["parent"] === cateId && datas[i].userID == this.userID
      ) {
        var child = {};
        child["text"] = datas[i].label;
        child["value"] = datas[i].value;
        child["checked"] = false;
        child["children"] = this.getChilCat(datas[i].value);
        childrens.push(child);
      }
    }
    return childrens;
  }

  select(item: TreeviewItem) {
    this.selectItem(item);
  }
  selectItem(item: TreeviewItem) {
    if (this.dropdownTreeviewSelectI18n.selectedItem !== item) {
      this.dropdownTreeviewSelectI18n.selectedItem = item;
      if (this.catvalue !== item.value) {
        //console.log('Here', item.value);
        this.catvalue = item.value;
        this.valueChange.emit(item.value);
      }
    }
    this.dropdownTreeviewComponent.dropdownDirective.close();
  }
}

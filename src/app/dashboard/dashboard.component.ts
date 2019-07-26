import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  Injectable, 
  Input,
  OnChanges, 
  SimpleChanges
} from "@angular/core";
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
import { PlannerService } from "../services/planner.service";
import { AuthService } from "../services/auth.service";
import { EventEmiterService } from "../services/event.emmiter.service";
import {
  CdkDragDrop,
  transferArrayItem,
  moveItemInArray
} from "@angular/cdk/drag-drop";

import { Observable, of } from "rxjs";
import { map, filter, scan, startWith } from "rxjs/operators";
import { webSocket } from "rxjs/webSocket";
import { ajax } from "rxjs/ajax";
import { TestScheduler } from "rxjs/testing";
import { DayPilot, DayPilotSchedulerComponent } from "daypilot-pro-angular";
import { NgxSmartModalService } from 'ngx-smart-modal';
import * as moment from 'moment/moment.js';
import { TreeviewI18n, TreeviewItem, TreeviewConfig, DropdownTreeviewComponent, TreeviewHelper } from 'ngx-treeview';
import * as $ from "jquery";
import { isNil } from 'lodash';
import { DropdownTreeviewSelectI18n } from './dropdown-treeview-select-i18n';
import { ActionComponent } from "../action/action.component";
import { ModalService } from '../services/modal.service';
import { CategorymodalComponent } from '../categorymodal/categorymodal.component';

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
  providers: [OrderBy, GroupByPipe,
  { provide: TreeviewI18n, useClass: DropdownTreeviewSelectI18n }
  ]
})
export class DashboardComponent implements OnInit {

  @ViewChild(ActionComponent) action;
  @Input() items: TreeviewItem[];
  @Input() catitems: TreeviewItem[];
  @Input() catvalue: any;
  @Output() valueChange = new EventEmitter<any>();
  @ViewChild("timesheet") 
  timesheet: DayPilotSchedulerComponent;
  @ViewChild(DropdownTreeviewComponent) dropdownTreeviewComponent: DropdownTreeviewComponent;
  @ViewChild('myTable') table: any;

  objectKeys = Object.keys;
  tasks: Task[] = [];
  tasks_org: Task[] = [];
  tasks_completed: Task[] = [];
  tasks_archive: Task[] = [];
  timesheet_tasks: Task[] = [];
  filterTasks: Task[] = [];
  all_task: Task[] = [];
  priorityTasks = [];
  taskForm: any;
  task_name: string;
  is_add_task: boolean;
  sortableOptions: any;
  category_id: string;
  category: any;
  cat_name: any;
  cat_ids: Task[] = [];
  myTree: any;
  click = 0;
  todaysTask: any;
  tomorrowTask: any;
  upcommingTask: any;
  nodueTask: any;
  when_DueTask: any;
  category_lists: Task[] = [];
  unassinged_tasks: Task[] = [];
  public show_dialog: boolean = false;
  target_task: any;
  trigger_task: any;
  filter_no = 3;
  showSelected: boolean;
  timeevents: any[];
  tabs: string[] = ['Status','Manage'];
  selectedindex = this.tabs[0];
  sorting = 0;
  clearFilterSorting = 0;
  completedTaskDisplay = 0;
  archiveTasksDisplay = 0;
  selected = [];
  edittaskForm: FormGroup;
  submitted: boolean = false;
  updateDisplay = 0;
  sucessMsg = 0;
  times = [];
  checkedList = [];
  userID:string;
  tasklable = "Edit Task";
  popupplace = 0;
  updateCate = "";
  validationerror = 0; 
  daypilotstart = new Date();
  allchildcates = [];
  showcompleted = 0;
  showarchived = 0;
  showincompleted = 1;
  showrunning = 1;
  manageFilterList = [];
  manageFilterselected = [];
  bodyText: string;
  popuptaskID : any;
  timesheet_arg: any;
  isLoading = true;
  keyword = 'name';
  taskdata = [];
  temp = [];
  popuplabel = "Add Task";
  expanded: any = {};
  ranges: any = {
    'Date': [moment(), moment()],
    'Today': [moment(), moment()],
    'Tomorrow': [moment().add(1, 'days'), moment().add(1, 'days')],
    'Next Week': [moment().add(1, 'week').startOf('week'), moment().add(1, 'week').startOf('week')],
    'Next Month': [moment().add(1, 'month').startOf('month'), moment().add(1, 'month').startOf('month')],
  };
  timelineranges: any = {
    'Today': [moment(), moment()],
    'This Week': [moment().startOf('week'),moment().endOf('week')],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Next Month': [moment().add(1, 'month').startOf('month'), moment().add(1, 'month').endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
  };
  
  manage_rows = [
    { task: 'Family', description: 'test Task', category: 'Family',priority: 'High', dueOn: '10:00', frequency: 'Swimlane',action:'start' },
    { task: 'Work', description: 'this is test', category: 'Work',priority: 'Low', dueOn: '10:00', frequency: 'Swimlane',action:'start' },
  ];
  editing = {};
  dueonobj = [  
    { 'value': '1 '+ moment(new Date()).format("MM/DD/YYYY"),'label':'Today ('+moment(new Date()).format("MM/DD/YYYY")+')'},
    { 'value': '2 '+ moment(new Date()).add(1,'days').format("MM/DD/YYYY"),'label':'Tomorrow ('+ moment(new Date()).add(1,'days').format("MM/DD/YYYY") +')'},
    { 'value': '3 '+ moment().endOf('week').format("MM/DD/YYYY"),'label':'This week('+ moment().endOf('week').format("MM/DD/YYYY") +')'},
    { 'value': '4 '+ moment().add(1, 'weeks').endOf('week').format("MM/DD/YYYY"),'label':'Next week('+ moment().add(1, 'weeks').endOf('week').format("MM/DD/YYYY")+')'},
    { 'value': '5 '+ moment().endOf('month').format("MM/DD/YYYY"),'label':'This month('+ moment().endOf('month').format("MM/DD/YYYY")+')'},
    { 'value': '6 '+ moment().add(1, 'month').endOf('month').format("MM/DD/YYYY"),'label':'Next month('+ moment().add(1, 'month').endOf('month').format("MM/DD/YYYY")+')'},
    { 'value': '7','label':'Set Date' },
  ];
  repeatdayboxes = [
    {
      value: 'S',
      id: 0
    },
    {
      value: 'M',
      id: 1
    },
    {
      value: 'T',
      id: 2
    },
    {
      value: 'W',
      id: 3
    },
    {
      value: 'T',
      id: 4
    },
    {
      value: 'F',
      id: 5
    },
    {
      value: 'S',
      id: 6
    }
  ]; 
  dropdownSettings = {};


  private dropdownTreeviewSelectI18n: DropdownTreeviewSelectI18n;
  constructor(
    private formBuilder: FormBuilder,
    public taskService: TaskService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService,
    private plannerservice: PlannerService,
    private orderBy: OrderBy,
    public ngxSmartModalService: NgxSmartModalService,
    public i18n: TreeviewI18n,
    
    private modalService: ModalService
    ) {
    this.dropdownTreeviewSelectI18n = i18n as DropdownTreeviewSelectI18n;
    this._eventEmiter.dataStr.subscribe(data => {
      this.getEventResponse(data);
    });
    this.sortableOptions = {
      sort: true,
      onUpdate: (event: any) => {      
        this.postChangesToServer();
      }
    };
  } 
  filteredOptions: Observable<string[]>;
  options_abc: string[] = ['One', 'Two', 'Three'];
  myControl_abc = new FormControl();

  ngOnInit() {    

    this.defaultUserLogin();
    this.createTaskForm();
    this.getCategory();
    this.is_add_task = false;
    //this.filter(this.filter_no,0);
    var userdata = this.authService.getUser();
    this.userID = userdata['_id'];
     // time array
    var tt = 0; // start time
    var ap = ['AM', 'PM']; // AM-PM
    for (var i=0;tt<24*60; i++) {
      var hh = Math.floor(tt/60);
      var mm = (tt%60);
      this.times[i] = ("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh/12)];
      tt = tt + 30;
    };
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: false,
      closeDropDownOnSelection: true
    };
    this.manageFilterList = [
      { item_id: 1, item_text: 'InComplete' },
      { item_id: 2, item_text: 'Running' },
      { item_id: 3, item_text: 'Completed' },
      { item_id: 4, item_text: 'Archived' }
    ];
    this.manageFilterselected = [
      { item_id: 1, item_text: 'InComplete' },
      { item_id: 2, item_text: 'Running' }
    ];
    this.items = [];
    this.catitems = [];
    this.bodyText = '';
    //this.closeModal('custom-modal-1');

    this.filteredOptions = this.myControl_abc.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }
  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
 
    //return this.options_abc.filter(option => option.toLowerCase().includes(filterValue));
    return this.taskdata.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  config = {  
    showActionButtons: true,
    showAddButtons: true,
    /*hidden: true,*/
    showRenameButtons: true,
    showRootActionButtons: false,
    enableExpandButtons: true,
    enableDragging: true,
    rootTitle: "Task",
    validationText: "Enter valid Task",
    minCharacterLength: 4,
    setItemsAsLinks: false,
    setFontSize: 14,
    setIconSize: 14
  };
  config_timesheet: any = {
    locale: "en-us",
    onBeforeRowHeaderRender: function(args) {
      // console.log('Args',args);
    },
    onBeforeCellExport: function(e) {
      //OnBeforeTimeHeaderRender:function(args){
        console.log("Args1", e);
      },
    onBeforeEventRender: function(args) {
      //args.Columns[0].Html = args.Date.ToString("dddd");
      if (args.data.class === "Career Development") {
        args.data.backColor = "#8A084B";
        args.data.fontColor = "#FFF";
        args.data.barColor = "#FF4000"; 
        args.data.toolTip = "Career Development";
        //args.data.html = "<h1>"+args.data.text+"</h1>";
        // console.log('Args2',args);       
      } 
      if (args.data.class === "Chores") {
        args.data.backColor = "#013ADF";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Errands") {
        args.data.backColor = "#FF4000";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Family & Friends") {
        args.data.backColor = "#3B0B0B";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Health & Fitness") {
        args.data.backColor = "#0B610B";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Personal") {
        args.data.backColor = "#5F4C0B";
        args.data.fontColor = "#FFF";
      } 
      if (args.data.class === "Routine") {
        args.data.backColor = "#04B431";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Social & Leisure") {
        args.data.backColor = "#FA58F4";
      }
      if (args.data.class === "Volunteerism") {
        args.data.backColor = "#58D3F7";
      }
      if (args.data.class === "Work") {
        args.data.backColor = "#6E6E6E";
        args.data.fontColor = "#FFF";
      }
      if (args.data.class === "Unassigned") {
        args.data.backColor = "#F2D7D5";
      }
    },
    crosshairType: "Header",
    timeHeaders: [{ groupBy: "Hour" }, { groupBy: "Cell", format: "mm" }],
    scale: "CellDuration",
    cellDuration: 15,
    days: 7,
    viewType: "Days",
    startDate: this.daypilotstart.setDate(this.daypilotstart.getDate()-6),
    showNonBusiness: true,
    businessWeekends: false,
    floatingEvents: true,
    dayBeginsHour:10,
    eventHeight: 30,
    autoScroll :'Always',
    eventMovingStartEndEnabled: true,
    eventResizingStartEndEnabled: false,
    timeRangeSelectingStartEndEnabled: false,
    groupConcurrentEvents: false,
    eventStackingLineHeight: 100,
    allowEventOverlap: true,
    timeRangeSelectedHandling: "Enabled",
    onTimeRangeSelected: args => {
      let obj = this;
      this.openModal('custom-modal-1', args);
      args.control.clearSelection();
    },
    onEventMoved: args => {
      //this.message("Event moved");
      var oldid = args.e.data.id;
      var res = oldid.split(" ");
      var taskId = res[1];
      var state = 0;
      var event = args.e.data.event;
      var timelogIndex = Number(args.e.data.timelogIndex);

      let timeLog: any;
      let task = new Task();
      timeLog = event.timelog;
      let start = Date.parse(args.newStart.value);
      let end = Date.parse(args.newEnd.value);
      // console.log('oldtimeLog', timeLog);
      // console.log('timelogIndex',timelogIndex + 'New Time ' + start + 'End '+ end);
      timeLog[timelogIndex].start = start;
      timeLog[timelogIndex].end = end;
      task.timelog = timeLog;
      task.taskID = taskId;
      task.state = state;
      task.modifiedON = new Date();
      this.taskService.updateTask(task).subscribe(task => {
        this.filter(this.filter_no,0);
      });
    },
    onEventResized: args => {
      //this.message("Event resized");
      var oldid = args.e.data.id;
      var res = oldid.split(" ");
      var taskId = res[1];
      var state = 0;
      var event = args.e.data.event;
      var timelogIndex = Number(args.e.data.timelogIndex);

      let timeLog: any;
      let task = new Task();
      timeLog = event.timelog;
      let start = Date.parse(args.newStart.value);
      let end = Date.parse(args.newEnd.value);
      timeLog[timelogIndex].start = start;
      timeLog[timelogIndex].end = end;
      task.timelog = timeLog;
      task.taskID = taskId;
      task.state = state;
      task.modifiedON = new Date();
      this.taskService.updateTask(task).subscribe(task => {
        this.filter(this.filter_no,0);
      });
    },
    onBeforeCellRender: function onBeforeCellRender(args) {
      //console.log(args);
      if (args.cell.start.getDayOfWeek() === 0) {
        args.cell.backColor = "#dddddd";
      }
      // console.log('Start ',args.cell.start);
      // console.log('EnD ',args.cell.end);
      // console.log('Today ',DayPilot.Date.today());
      if (
        args.cell.start <= DayPilot.Date.today() &&
        DayPilot.Date.today() < args.cell.end
        ) {
        args.cell.backColor = "#dddddd";
      }
    },
    onEventDeleted: args =>{
      //this.message("Event deleted");
      if (confirm('Do you really want to delete ?')){
        var oldid = args.e.data.id;
        var res = oldid.split(" ");
        var taskId = res[1];
        var event = args.e.data.event;
        var timelogIndex = Number(args.e.data.timelogIndex);
        let timeLog: any;
        let task = new Task();
        timeLog = event.timelog;        
        for( var i = 0; i < timeLog.length; i++){
          if ( i === timelogIndex) {
            if(timeLog[i].end == ""){
              task.state = 0;
            }
            timeLog.splice(i, 1);
          }
        }     
      task.timelog = timeLog;
      task.taskID = taskId;
      task.modifiedON = new Date();
      console.log('Task', task);
      this.taskService.updateTask(task).subscribe(task => {
        this.filter(this.filter_no,0);
      });
      var click = 0;            
      this.getTasks(click);
    }else{
        var click = 0;            
        this.getTasks(click);
      }      
    },
    // onAfterRender: args => { 
    //   var startHour = 17;
    //   var startDate = (this.timesheet.control.startDate as DayPilot.Date); 
    //   startDate = startDate.addHours(startHour); //Adds the nr of hours ontop of current date 
    //   console.log('startDate',startDate);
    //   this.timesheet.control.scrollTo(startDate);
    // },
    eventMoveHandling: "Update",
    eventResizeHandling: "Update",
    eventDeleteHandling: "Update",
    eventClickHandling: "JavaScript",
    eventHoverHandling: "Bubble",
  };  
  values: any[];
  catconfig = TreeviewConfig.create({
    hasFilter: true,
    hasAllCheckBox: false,
    hasCollapseExpand: false,        
    maxHeight: 500
  });
  sidebarcatconfig = TreeviewConfig.create({
    hasFilter: true,
    hasAllCheckBox: false,
    hasCollapseExpand: false,        
    maxHeight: 500
  });

  getTasks(click): void {
    //console.log("get tasks...");
    this.taskService.getTasks().subscribe(newtasks => {
      //console.log("view update tasks",JSON.parse(JSON.stringify(newtasks))  );
      this.filterTask(newtasks,click);
    });
  }
  filterTask(tasks,click) {

    let tasks_anassgin = [];
    let tasks_completed = [];
    let tasks_archive = [];
    let all_task = [];
    let timesheet_tasks = [];
    for (let index in tasks) {
      /*task.status == 0(Incompleted), task.status == 1(Completed),
        task.status == 2(Archived)
      */
      let task = tasks[index];
      
      if(task.status == 2){
         tasks_archive.push(task);
      }else if(task.status == 0){
         tasks_anassgin.push(task);
      }else{
        tasks_completed.push(task);
      }
      if(this.showcompleted == 1 && task.status == 1){
       all_task.push(task);
      }
      if(this.showarchived == 1 && task.status == 2){
       all_task.push(task);
      }
      if(this.showincompleted == 1 && task.status == 0 && task.state == 0){
       all_task.push(task);
      }
      if(this.showrunning == 1 && task.state == 1 && task.status != 1 && task.status != 2){
       all_task.push(task);
      }
      timesheet_tasks.push(task);
    }
    var taskdatas = [];
    for (var index in tasks_anassgin) {
        var newdata = {};
        newdata['id'] = tasks_anassgin[index].taskID;
        newdata['name'] = tasks_anassgin[index].name;
        taskdatas.push(newdata);
    }
    this.taskdata = JSON.parse(JSON.stringify(taskdatas));
    this.tasks = tasks_anassgin;
    this.timesheet_tasks = timesheet_tasks;
    this.cat_name = Array.from(
    new Set(tasks_anassgin.map(({ category_name }) => category_name))
    );
    this.cat_ids = Array.from(
      new Set(tasks_anassgin.map(({ category_id }) => category_id))
    );
    this.tasks_org = JSON.parse(JSON.stringify(this.tasks));
    this.tasks_completed = tasks_completed;
    this.tasks_archive = tasks_archive;
    var intervalId = setInterval(function() {}, 500);
    this.myTree = [];
    var data_tree = [];
    var catData = this.getParentCategory(this.cat_ids);
    if(click == 1){
      if(this.sorting == 1){
        catData.sort(function(a,b){
          if(a.name > b.name) { return -1; }
          if(a.name < b.name) { return 1; }
          return 0;
        });
        this.sorting = 0;
      }else{
        catData.sort(function(a,b){
          if(a.name < b.name) { return -1; }
          if(a.name > b.name) { return 1; }
          return 0;
        });
        this.sorting = 1;
      }
    }
    if(click == 0){
      if(this.sorting == 1){
        catData.sort(function(a,b){
          if(a.name < b.name) { return -1; }
          if(a.name > b.name) { return 1; }
          return 0;
        });        
      }else{        
       catData.sort(function(a,b){
        if(a.name > b.name) { return -1; }
        if(a.name < b.name) { return 1; }
        return 0;
      });
     }
    }
    if (catData.length > 0) {
      for (var index in catData) {
        data_tree.push(catData[index]);
      }
    }
    let manageRows = [];
    for (var index in all_task) {
               
        let addRows = [];     
        addRows['action'] = all_task[index];
        addRows['task'] = all_task[index]['name'];
        addRows['timelog'] = all_task[index]['timelog'];
        addRows['taskID'] = all_task[index]['taskID'];
        addRows['id'] = all_task[index]['taskID'];
        addRows['category_id'] = all_task[index]['category_id'];              
        addRows['description'] = all_task[index]['description'];
        addRows['category'] = this.getCategoryName(all_task[index]['category_id']);
        addRows['priority'] = all_task[index]['priority'];        
        addRows['status'] = all_task[index]['status'];          
        let setDate = 0;
        if(all_task[index]['setDate']!=undefined && all_task[index]['setDate'] == 1){
          setDate = 1;
        }
        let frequency = "";
        if(all_task[index]['frequency'] == 1){
          frequency = 'Daily';
        }
        if(all_task[index]['frequency'] == 2){
          frequency = 'Weekly';
        }
        if(all_task[index]['frequency'] == 3){
          frequency = 'Monthly';
        }
        addRows['dueOn'] = all_task[index]['dueon'];
        addRows['whenDue'] = "No Due";
        if(all_task[index]['dueon']!=undefined && all_task[index]['dueon']!=""){
          addRows['whenDue'] = this.getwhendue(all_task[index]['dueon'],'1',setDate); 
        }
        addRows['lastModifyTime'] = "";
        if(all_task[index]['modifiedON']!=undefined && all_task[index]['modifiedON']!=""){
          addRows['lastModifyTime'] = moment(all_task[index]['modifiedON']).format("MM/DD/YYYY hh:mm A");
        }
        addRows['totalTime'] = this.getStatus(all_task[index],Taskstatus,3);       
        var Taskstatus = all_task[index]['status'];
        addRows['status'] = this.getStatus(all_task[index],Taskstatus,1);
        addRows['lastRecordTime'] = this.getStatus(all_task[index],Taskstatus,2);
        addRows['frequency'] = frequency;
        manageRows.push(addRows);
    }
    manageRows.sort(function(a,b){
      if(a.dueOn < b.dueOn) { return -1; }
      if(a.dueOn > b.dueOn) { return 1; }
      return 0;
    });
    for(const row of manageRows) {
        if(row.task.length > 20){
          row.height = 80;
        }else{
          row.height = 50;
        }        
    }
    //console.log('manageRows22',manageRows);
    this.temp = [...manageRows];
    this.manage_rows = manageRows;   
    this.getCalendarTask(this.timesheet_tasks);
    if (this.filter_no == 1) {
      this.myTree = data_tree;
    }else{
      if (this.filter_no == 2) {
        this.filter(this.filter_no, 0);
      }else{
        this.when_Duefilter();
      }
    }
    /*Temp Data*/
    const obj: Object ={
      name: 'test', 
      priority: 1,
      category_id:1,
      timelog :{'time':'0'},
      state:0
    };
    this.ngxSmartModalService.setModalData(obj, 'myBootstrapModal');
  }
  getCategory(): void {
    this.taskService.getCategory().subscribe(category => {
      this.filterCategroy(category);
      this.getTasks(0);
    });
  }
  getRowHeight(row) {
    //console.log('row', row);
    return row.height;
  }
  filterCategroy(category) {

   this.items = [];
   this.catitems = [];
   
   this.category = [];
    let category_list = [];
    for (let index in category) {

      let cat = category[index];
      let userID = "";
      if(cat["user"]!=undefined){
        userID = cat["user"]['$id'];
      }
      if(cat.parent==undefined || cat.parent =="" || userID == this.userID) {
        category_list.push({
        value: cat.categoryID,
        label: cat.name,
        index: cat.index,
        color: cat.color,
        parent: cat.parent,
        userID:userID,
        is_display: cat.name == "Unassigned" ? false : true
        });
      }
    }
    category_list.sort(function(a, b) {
      return a.index - b.index;
    });    
    this.category = category_list;
    
    for (let index in category_list) {
     var cateId = category_list[index].value;     
     if(category_list[index].parent==""){
       const childrenCategory = new TreeviewItem({
        text: category_list[index].label, 
        value: category_list[index].value, 
        collapsed: true,
        checked: false,
        children: this.getChilCat(cateId)
      });
       this.items.push(childrenCategory);
       //console.log(' this.items',  this.items);
       this.catitems.push(childrenCategory);
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
      ) 
      {
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
  getStatus(task,status,flag){
    if(flag == 1){
      /* Task Status */
      var taskStatus = "";
      var flg = 0;
      if(status == 1){
        taskStatus = "Completed"
      }else if(status == 2){
        taskStatus = "Archived";
      }else{
        if(task.timelog.length > 0 && task.timelog!=undefined){
          for (let index in task.timelog) {
            if(task.timelog[index].start!="" && task.timelog[index].end == ""){
              taskStatus = "Running"; 
              flg = 1;
            }
          }
        }
        if(flg == 0){
          taskStatus = "Incomplete";
        }        
      }
      return taskStatus; 
    }
    if(flag == 2){
      let Currenttime = moment(new Date()).format("MM/DD/YYYY hh:mm A");
      var flg = 0;
      /*Last Recorded Time of Task*/
      if(task.timelog.length > 0 && task.timelog!=undefined){    
        for (let index in task.timelog) {
          if(task.timelog[index].start!="" && task.timelog[index].end == ""){
            flg = 1;        
          }
        }
        if(flag == 1){
          return Currenttime;
        }else{          
          var lastrecord =  task.timelog[task.timelog.length-1];
          // console.log('Last time ',lastrecord);
          // console.log('Task Name ',task.name);
          var lasttime = Currenttime;
          if(lastrecord.end!=""){
             lasttime = moment(lastrecord.end).format("MM/DD/YYYY hh:mm A");
          }         
          //console.log('lasttime', lasttime);
          return lasttime;   
        }
      }else{
       return "";
      }
    }
    if(flag == 3){
      
      if(task.state == 0){
        if(task.timelog.length > 0 && task.timelog!=undefined){
          let total_hours = 0;      
          for (let i in task.timelog) {
            total_hours += parseInt(task.timelog[i].end) - parseInt(task.timelog[i].start);
          }
          var resolutionTime = (((total_hours / 1000) / 60));
          var totalH = this.timeConvert(resolutionTime);
          return totalH;        
        }else{
          return "0:0";
        }      
      }else{       
        if(task.timelog.length > 0 && task.timelog!=undefined){
          let total_hours = 0;      
          for (let i in task.timelog) {
            if(task.timelog[i].end!=""){
              total_hours += parseInt(task.timelog[i].end) - parseInt(task.timelog[i].start);
            }else{
              console.log('Task Name => ', task.name + ' '+ task.timelog[i].start)
              total_hours += Number(new Date()) - parseInt(task.timelog[i].start);
            }            
          }
          var resolutionTime = (((total_hours / 1000) / 60));
          var totalH = this.timeConvert(resolutionTime);
          return totalH;        
        }else{
          return "0:0";
        }
      }
    }
  }
  timeConvert(n) {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    return rhours + " : " + rminutes;
  }  
  select(item: TreeviewItem) {
    this.selectItem(item);
  }  
  selectItem(item: TreeviewItem) {
    console.log('Here',item.value + ' this.catvalue '+this.catvalue);
    if (this.dropdownTreeviewSelectI18n.selectedItem !== item) {        
      this.dropdownTreeviewSelectI18n.selectedItem = item;
      if (this.catvalue !== item.value) {          
            this.catvalue = item.value;
            this.valueChange.emit(item.value);
          }
        }else{
          this.valueChange.emit(item.value);
        }
      this.dropdownTreeviewComponent.dropdownDirective.close();
  }
  createTaskForm() {
    this.taskForm = this.formBuilder.group({
      task_name: ["", Validators.required],
      category_id: ["", ""]
    });
    this.edittaskForm = this.formBuilder.group({
      task: ["", ""],
      categoryID: ["", ""],
      priority: ["", ""],
      dueon: ["", ""],
      duration: ["", ""],
      description: ["", ""],
      taskID: ["", ""],
      setdueon: ["", ""],
      discretionary: ["", ""],
      routine: ["", ""],
      frequency:["", ""],
      starttime:["",""],
      repeatday:["", ""],
    });
  }
  deleteTasks(task: Task, filter_num): void {
    this.taskService.deleteTask(task).subscribe(task => {
      this.filter(this.filter_no,0);
    });
  }
  timelinechange(event){
    console.log('Time', event);
    var oneDay = 24*60*60*1000;
    var startDate = event.start._d;
    var endDate = event.end._d;
    var firstDate = new Date(startDate);
    var secondDate = new Date(endDate);
    firstDate.setDate(firstDate.getDate() + 1);
    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
    //console.log('timelineranges', this.timelineranges);
    this.config_timesheet.days = diffDays + 1;
    this.config_timesheet.startDate = firstDate;
    //this.config_timesheet.scrollTo = firstDate;
  }
  clear(e) {
    //this.dueon = null;
  }
  archiveTasks(task: Task, filter_num): void {
    console.log('archiveTasks',task);
    this.taskService.archiveTask(task).subscribe(task => {
      this.filter(this.filter_no,0);
    });
  }
  toggleCheckBox(event,filter){
    let task = new Task();
    let taskID = event.taskID;    
    let Stime = Number(new Date(Date.now() - event.duration * 60000));
    let Etime = Number(new Date());
    let timelogData: Array<any> = [{ "start": Stime, "end": Etime}];

    if (event.status == 0 && (event.enddate == "" || event.enddate==undefined)) {
      if(event.frequency!="" && event.frequency!=undefined){
        let repeatday = [];
        if(event.repeatday!="" && event.repeatday!=undefined){
          repeatday = JSON.parse("[" + event.repeatday + "]");
        }        
        var now = new Date();
        var todaydate = moment(new Date());
        var todayoccur = todaydate.day()
        let dueon = Date.parse(event.dueon);
        let todayDate = Date.parse(new Date().toDateString());
        let flag = 0;
        var state = 0;
        task.modifiedON = new Date();  
         /* Weekly frequency */
        if(event.frequency == 2){
            console.log('repeatday', repeatday);
            var days =  repeatday.sort();
            var duedate = "";
            var todaysDate = moment(event.dueon);
            var oDate = moment(new Date());
            var diffDays = oDate.diff(todaysDate, 'days'); 
            for (let i = 0; i <= diffDays; i++) {
              var todays = moment(event.dueon).add(i,'days').format('MM/DD/YYYY'); 
              var date = moment(todays);
              var today = date.day();
              let occur = [];              
              for (var index in days) { 
                var dayINeed = parseInt(days[index]);                  
                if (this.inArray(today, days)) {
                  if(todayoccur < dayINeed)
                  {
                    state = 0;
                    duedate = moment().day(dayINeed).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                    break;                    
                  }else{
                  }                    
                }
              }
            }
            if(duedate == ""){
              state = 0;
              for (var index in days) {
                 var dayINeed = parseInt(days[index]);
                 if(todayoccur < dayINeed){
                   duedate = moment().day(dayINeed).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                   break;
                 }else{
                  duedate = moment().day(days[0]).add(1, 'weeks').format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                 }
              }
            }
            task.taskID = taskID;
            task.status = 1;        
            if(event.state == 1){
              task.state = 0;
              let oldtimeLog:any;
              oldtimeLog = event.timelog;
              let oldIndex = oldtimeLog.length - 1;
              if(oldtimeLog.length > 0){
                if(oldtimeLog[oldIndex].end == ""){
                 oldtimeLog[oldIndex].end = Number(new Date());
                 task.timelog = oldtimeLog;
                }
              }
            }                
            if(event.timelog.length == 0){              
              task.timelog = timelogData;      
            }
            console.log('duedate', duedate);
            task.enddate = this.getHighestTime(event.timelog);
            this.taskService.updateTask(task).subscribe(task => {    
              event.state = state;  
              event.dueon = duedate;             
              this.cloneTasks(event,0,1);
            });    
            return;           
        }
        /* Daily frequency */
        else if(event.frequency == 1){
          task.status = 1;
          task.taskID = taskID;
          task.modifiedON = new Date();
          task.enddate = this.getHighestTime(event.timelog);
          if(event.state == 1){
            task.state = 0;
            let oldtimeLog:any;
            oldtimeLog = event.timelog;
            let oldIndex = oldtimeLog.length - 1;
            if(oldtimeLog.length > 0){
              if(oldtimeLog[oldIndex].end == ""){
               oldtimeLog[oldIndex].end = Number(new Date());
               task.timelog = oldtimeLog;
              }
            }
          }
          if(event.timelog.length == 0){
            task.timelog = timelogData;      
          }
          this.taskService.updateTask(task).subscribe(task => {
            event.state = 0;                  
            event.dueon = moment(new Date()).add(1,'days').format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
            this.cloneTasks(event,0,1);
          });
          return;
        }
        /* Monthly frequency */
        else if(event.frequency == 3){
          /* If Previous Day Task Running */
          task.status = 1;
          task.taskID = taskID;
          if(event.state == 1){
            task.state = 0;
            let oldtimeLog:any;
            oldtimeLog = event.timelog;
            let oldIndex = oldtimeLog.length - 1;
            if(oldtimeLog.length > 0){
              if(oldtimeLog[oldIndex].end == ""){
               oldtimeLog[oldIndex].end = Number(new Date());
               task.timelog = oldtimeLog;
              }
            }
          }
          if(event.timelog.length == 0){
            task.timelog = timelogData;      
          }
          task.enddate = this.getHighestTime(event.timelog);
          task.modifiedON = new Date();
          this.taskService.updateTask(task).subscribe(task => {
            event.state = 0;                
            event.dueon = moment(event.dueon).add(1, 'month').format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
            this.cloneTasks(event,0,1);
          });          
          return;        
        }
      }  
    }
    task.taskID =taskID;
    let tstatus = 0;
    if(event.status!=undefined && event.status == 0){
     tstatus = 1;
      if(event.timelog.length == 0){
        task.timelog = timelogData;      
      }
    }
    let oldtimeLog:any;
    if(event.state == 1){      
      oldtimeLog = event.timelog;
      let oldIndex = oldtimeLog.length - 1;
      if(oldtimeLog.length > 0){
        if(oldtimeLog[oldIndex].end == ""){
         oldtimeLog[oldIndex].end = Number(new Date());
         task.timelog = oldtimeLog;
        }
      }
    }    
    task.status = tstatus;
    task.state = 0;
    task.enddate = moment(new Date()).format("MM/DD/YYYY HH:mm:ss");  
    task.modifiedON = new Date();
    var input = {};
    this.taskService.updateTask(task).subscribe(task => {
      this.filter(this.filter_no,0);
    });
  }
  addUnassignedTask(name: string, category_id: string): void {

    if (this.taskForm.valid) {
      this.is_add_task = true;
      if (this.authService.isAuthenticate()) {
        this.is_add_task = false;
        name = name.trim();
        if (!name) {
          return;
        }
        let task = new Task();
        task['name'] = name;
        var now = new Date();
        task['dueon'] = moment(new Date()).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
        task['priority'] = 3;
        task['state'] = 0;
        task['modifiedON'] = new Date();
        task['discretionary'] = 1;
        task['routine'] = 0;
        task['frequency'] = 0;
        task['repeatday'] = '';
        task['duration'] = 30;
        task['timelog'] = [];

        this.taskService
        .addTask(task, { category_id } as any)
        .subscribe(hero => {
              
              this.resetForm();
              if (this.filter_no == 1) {
                var click = 0;
                this.getTasks(click);
              } else if (this.filter_no == 2) {
                this.taskService.getTasks().subscribe(tasks => {
                  this.priorityFilter(tasks);
                });
              } else if (this.filter_no == 3) {
                var click = 0;
                this.getTasks(click);
                setTimeout(() => {
                  this.when_Duefilter();
                }, 100);
              } else if (this.filter_no == 4) {
                this.taskService.getTasks().subscribe(tasks => {
                  this.clearFilter(tasks);
                });
              } else {
                var click = 0;
                this.getTasks(click);              
              }
              let task = new Task();
              task.taskID = hero.taskID;              
              task.parenttask = hero.taskID;
              this.taskService.updateTask(task).subscribe(hero => {
                console.log("Update task sucessfulluy", hero);
                this.filter(this.filter_no,0);
              });
            });
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    } else {
      this.validateAllFormFields(this.taskForm);
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
  defaultUserLogin(): void {}
  getEventResponse(data) {   
    var userdata = this.authService.getUser();
    if(userdata){
      this.userID = userdata['_id'];    
    } 
    if (
      (data.user_signin != undefined && data.user_signin == true) ||
      (data.user_signout != undefined && data.user_signout == true)
      ) {
         //console.log('Another login', data);
         this.getCategory();
         this.filter(this.filter_no,0);
      }
    if (
      this.is_add_task == true &&
      (data.user_signin != undefined && data.user_signin == true)
      ) {
      this.addUnassignedTask(this.task_name, this.category_id);
    }
  }
  postChangesToServer() {


    var logEntry = this.tasks
    .map(function(i) {
      return i.index;
    })
    .join(", ");
    var logEntry1 = this.tasks_org
    .map(function(i) {
      return i.index;
    })
    .join(", ");
    for (let index in this.tasks_org) {
      let o_task = this.tasks_org[index];
      if (this.tasks[index] != undefined) {
        this.tasks[index].index = o_task.index;
      }
    }
    for (var index in this.tasks) {
      let task = this.tasks[index];
      let input = {};
      input["task"] = task;
      task.modifiedON = new Date();
      this.taskService.updateTask(task).subscribe();
    }
  }
  resetForm() {
    this.task_name = "";
    this.taskForm.controls.task_name.markAsUntouched({ onlySelf: true });
    this.taskForm.controls.task_name.markAsPristine({ onlySelf: true });
      // this.category_id = "";
      // this.taskForm.controls.category_id.markAsUntouched({ onlySelf: true });
      // this.taskForm.controls.category_id.markAsPristine({ onlySelf: true });
  } 
  /*Tree View */
  getParentCategory(datas) {
    let parents = [];
    let category = this.category;
    //console.log('category', category);
    for (let i = 0; i < category.length; i++) {
      let childs = {};
      if (category[i] != "") {
        if (this.cat_name[i] == undefined) {
          this.cat_name[i] = "Unassigned";
        }
        if(category[i].parent==""){
          childs["name"] = category[i].label;
          childs["id"] = category[i].value;
          childs["taskID"] = category[i].value;
          childs["color"] = category[i].color;
          childs["childrens"] = this.orderBy.transform(this.getChilTask(category[i].value),["+index"]);
          let childscat = this.getChilCat(category[i].value);
          childs["childcats"] = childscat;
          if (childs["childrens"].length > 0 || childscat.length > 0) {
              parents.push(childs);
            }
          }        
      }
    }
    return parents;
  }
  filter_getParentCategory(cateID) {
      let parents = [];
      let category = this.category;
      for (let i = 0; i < category.length; i++) {
        let childs = {};
        if (category[i] != "") {
          if(category[i].value === cateID) {         
            childs["name"] = category[i].label;
            childs["id"] = category[i].value;
            childs["childrens"] = this.getChilTask(category[i].value);
            let childscat = this.getChilCat(category[i].value);
            childs["childcats"] = childscat;
            if (childs["childrens"].length > 0 || childscat.length > 0) {
              parents.push(childs);
            }
          }
        }
      }
      return parents;
  }
  getCategoryParent(catID){
     let category = this.category;
     let cate = [];
     for (let index in this.category) {
      if(this.category[index]['value'] == catID){
        if(this.category[index]['parent']!=""){
          cate = this.getCategoryParent(this.category[index]['parent']);
        }else{
           cate = this.category[index];          
        } 
         return cate;               
      }
     }
  }
  getChilTask(cate) {

    //console.log('Category ID', cate);
    let childrens = [];
    let childrens_ids = {};
    let childrens_next_ids = {};
    let datas = this.tasks;
    var data_abd = [];

    for (let i = 0; i < datas.length; i++) {
      if (
        datas[i].hasOwnProperty("name") &&
        datas[i].hasOwnProperty("category_id") &&
        datas[i]["category_id"] === cate
        ) {
          var child = {};
          child["name"] = datas[i].name;
          child["id"] = datas[i].taskID;
          child["taskID"] = datas[i].taskID;
          child["prev"] = datas[i].previous;
          child["next"] = datas[i].next;
          child["priority"] = datas[i].priority;
          child["state"] = datas[i].state;
          child["index"] = datas[i].index;
          child["category_id"] = datas[i].category_id;
          child["timelog"] = datas[i].timelog;
          child["dueon"] = datas[i].dueon;
          child["childrens"] = [];
          childrens.push(child);
      }
    }  
    childrens.sort((a, b) => a.index.toString().localeCompare(b.index));
    return childrens;
  }
  onDragStart(event) {
      //console.log("On drag star", event);
      if (event.target.prev != undefined && event.target.next != undefined) {
        this.trigger_task = event.target;
        //console.log("this.trigger_task ", this.trigger_task);
      }
  }
  onSetPriority(event) {
    let task = new Task();
    var taskID = event.element.id;
    if (event.element.priority == undefined) {
      task.priority = 1;
    } else {
      task.priority = event.element.priority;
    }
    task.taskID = event.element.id;
    var input = {};
    input["task"] = task;
    task.modifiedON = new Date();
    this.taskService.updateTask(task).subscribe(task => {
      var click = 0;
      this.getTasks(click);
    });
  }
  onStartTime(event,progress) {

    let task = new Task();
    let count = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if(this.tasks[i].state == 1){
       count++;
      }
    }
    //console.log('event',event);
    let oldtimeLog:any;
    let taskID:any;
    let taskState:any;
    let status:any;
    oldtimeLog = event.timelog;
    taskID = event.taskID;
    taskState = event.state;
    status = event.status;
    if(progress == 0){
      if(event.frequency!="" && (event.enddate == "" || event.enddate==undefined)){
        var now = new Date();
        let dueon = Date.parse(event.dueon);
        let todayDate = Date.parse(new Date().toDateString());
        let flag = 0;
        
        if(event.frequency == 2){
          let repeatday = [];
          if(event.repeatday!="" && event.repeatday!=undefined){
            repeatday = JSON.parse("[" + event.repeatday + "]");
          }
          if(dueon < todayDate){
            var days =  repeatday.sort();
            var todaysDate = moment(event.dueon);
            var oDate = moment(new Date());
            var diffDays = oDate.diff(todaysDate, 'days');
              for (let i = 0; i <= diffDays; i++) {
               var todays = moment(event.dueon).add(i,'days').format('MM/DD/YYYY'); 
               var date = moment(todays);
               var today = date.day();
               let occur = [];
               for (var index in days) {                  
                var dayINeed = parseInt(days[index]);
                if (this.inArray(today, days)) {
                  if(today == dayINeed){                      
                    let occurDate = Date.parse(moment(todays).format('L'));
                    if(todayDate == occurDate){
                      flag = 1;
                    }
                  }        
                }
              }
            }
            if(flag == 1){
              task.status = 2;
              task.taskID = taskID;
              task.enddate = this.getHighestTime(event.timelog);
              task.modifiedON = new Date();
              this.taskService.updateTask(task).subscribe(task => {    
                event.state = 1;              
                event.dueon = moment(new Date()).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                this.cloneTasks(event,0,1);
              });              
              return;
            }              
          }
        }
        else if(event.frequency == 1){    
          /* If Previous Day Task Running */
          if(dueon < todayDate){
            task.status = 2;
            task.taskID = taskID;
            task.enddate = this.getHighestTime(event.timelog);
            task.modifiedON = new Date();
            this.taskService.updateTask(task).subscribe(task => {
              event.state = 1;                 
              event.dueon = moment(new Date()).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
              this.cloneTasks(event,0,1);
            });
            return;
          }       
        }
        else if(event.frequency == 3){
          /* If Previous Day Task Running */
          if(dueon < todayDate){
            let repeatday = [];
            if(event.repeatday!="" && event.repeatday!=undefined){
              repeatday = JSON.parse("[" + event.repeatday + "]");
            }            
            var days =  repeatday.sort();              
            var todaysDate = moment(event.dueon);
            console.log('todaysDate',todaysDate);
            var oDate = moment(new Date());
            var diffDays = oDate.diff(todaysDate, 'days');              
            for (let i = 0; i <= diffDays; i++) {
             var todays = moment(event.dueon).add(i,'days').format('MM/DD/YYYY');               
             var arr = todays.split("/");
             var date = moment(todays);
             var today = parseInt(arr[1]);
             let occur = [];
               for (var index in days) {               
                var dayINeed = parseInt(days[index]);                  
                if (this.inArray(today, days)) {
                  if(today == dayINeed){
                   let occurDate = Date.parse(moment(todays).format('L'));
                    if(todayDate == occurDate){
                      flag = 1;
                    }
                  }        
                }
              }
            }           
            if(flag == 1){
              task.status = 2;
              task.taskID = taskID;
              task.enddate = this.getHighestTime(event.timelog);
              task.modifiedON = new Date();
              this.taskService.updateTask(task).subscribe(task => {    
                event.state = 0;
                event.dueon = moment(event.dueon).add(1, 'month').format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                this.cloneTasks(event,0,1);
              });              
              return;
            }              
          }         
        }
      }     
    }
    if(count < 5 || taskState == 1){
        //console.log('Count', count);
        let Stime = Number(new Date());
        let Etime = "";
        let timelogData: Array<any> = [
        { "start": Stime, "end": Etime}
        ];       
        let oldIndex = oldtimeLog.length - 1;
        var input = {};
        let state = 0;
        if(taskState == 0){
          //console.log('Hello ', timelogData);
          state = 1;
          oldtimeLog.push(timelogData[0]);
        }else{
          state = 0;
          if(oldtimeLog.length > 0){
            if(oldtimeLog[oldIndex].end == ""){
              oldtimeLog[oldIndex].end = Number(new Date());
            }
          }else{
           //oldtimeLog[oldIndex].end = Number(new Date());
         }
       }
       //console.log('oldtimeLog', oldtimeLog);
       task.timelog = oldtimeLog; 
       task.taskID = taskID;
       task.state = state;
       task.modifiedON = new Date();
       this.taskService.updateTask(task).subscribe(hero => {
        //console.log('hero', hero);
        var click = 0;
        this.getTasks(click);
        //this.filter(this.filter_no,0);
      });
     }else{
      $('.alertmsg').fadeIn("slow");
      $('.msg').html('You can start 5 task at time!');
      $("html, body").animate({ scrollTop: 0 }, "slow");
    }
  }
  hide_msg() {
    $(".alertmsg").fadeOut("slow");
    this.sucessMsg = 0;
  }
  onSetPriorityItem(tasks, priority, filter_no) {
      //console.log('priority set',tasks);
      let task = new Task();
      task.priority = priority;
      task.taskID = tasks.taskID;
      task.modifiedON = new Date();
      var input = {};
      input["task"] = task;
      this.taskService.updateTask(task).subscribe(task => {
        this.filter(this.filter_no,0);
      });
  }
  onDrop(event) {
    //console.log("events", event);
    if (event.target.prev != undefined && event.target.next != undefined) {
      this.target_task = event.target;
      //console.log("this.target_task  ", this.target_task);
      this.taskService
      .updateTaskOrder(this.target_task, this.trigger_task,event.target.next)
      .subscribe(hero => {
          //console.log("call service ", hero);
          if (this.filter_no == 1) {
            // var click = 0;
            // this.getTasks(click);
          } else {
            //this.filter(this.filter_no,0);
          }
        });
    }
  }
  filter(filter,click) {

    if (filter == 1) {
      this.getTasks(click);
    }
    if (filter == 2) {
      //this.getTasks(click); 
      this.taskService.getTasks().subscribe(tasks => {
        this.priorityFilter(tasks);
      });
    }
    if (filter == 3) {
     this.getTasks(click);
    }
    if (filter == 4) {
      this.taskService.getTasks().subscribe(tasks => {
        this.clearFilter(tasks);
      });      
    }
    this.filter_no = filter;
  }
  clearFilter(tasks) {

    let filter_tasks = [];
    for (let index in tasks) {
      let task = tasks[index];
      if (task.status == 0) {
       filter_tasks.push(task);
     }
   }
    // console.log('Added And Get');
    var filter_taskss = Array.from(
      Object.keys(filter_tasks),
      k => filter_tasks[k]
      );
    if(this.clearFilterSorting == 1){
      filter_taskss.sort(function(a, b) {
        var localDate = new Date(a.createdON);      
        return new Date(b.createdON).getTime() - new Date(a.createdON).getTime();
      });
      this.clearFilterSorting = 0;
    }else{
      filter_taskss.sort(function(a, b) {
        var localDate = new Date(a.createdON);      
        return new Date(a.createdON).getTime() - new Date(b.createdON).getTime();
      });
      this.clearFilterSorting = 1;
    }
    this.getTasks(0);
    this.filterTasks = filter_taskss;
  }
  priorityFilter(tasks) {

    let filter_tasks = [];
    let critical = "Critical";
    let high = "High";
    let medium = "Medium";
    let low = "Low";
    let unprioritized = "Unprioritized"; 

    let sortable = [];
    sortable[critical] = [];
    sortable[high] = [];
    sortable[medium] = [];
    sortable[low] = [];
    sortable[unprioritized] = [];
    for (let index in tasks) {
      let task = tasks[index];
      if (task.status == 0) {
        if (task.priority == 1) {
          //task.sort = 1;
          sortable[critical].push(task);
        }
        if (task.priority == 2) {
          //task.sort = 2;
          sortable[high].push(task);
        }
        if (task.priority == 3) {
          //task.sort = 3;
          sortable[medium].push(task);
        }
        if (task.priority == 4) {
          //task.sort = 4;
          sortable[low].push(task);
        }
        if (task.priority == "") {
          //task.sort = 5;
          sortable[unprioritized].push(task);
        }
      }
    }
    sortable[critical].sort = 1;
    sortable[high].sort = 2;
    sortable[medium].sort = 3;
    sortable[low].sort = 4;
    sortable[unprioritized].sort = 5;

    if (sortable[critical].length === 0) {
      delete sortable[critical];
    }
    if (sortable[high].length === 0) {
      delete sortable[high];
    }
    if (sortable[medium].length === 0) {
      delete sortable[medium];
    }
    if (sortable[low].length === 0) {
      delete sortable[low];
    }
    if (sortable[unprioritized].length === 0) {
      delete sortable[unprioritized];
    }
    sortable.sort(function(a, b) {
      return a.sort - b.sort;
    });

    this.priorityTasks = sortable;
    console.log('this.priorityTasks',this.priorityTasks);
  }
  when_Duefilter() {
    this.plannerservice.getData().subscribe(planner => {
      this.plannerData(planner);
    });
  }
  plannerData(data) {

    let timelogData = [];
    var d = new Date();
    let current_day = d.getDay();
    let current_time = this.formatAMPM(new Date());
    var current_time_number = this.timeToDecimal(current_time);
    
    var data_tree = [];
    var today_tree = [];
    var tomorrow_tree = [];
    var upcomming_tree = [];
    var nodue_tree = [];
    var todaysTasks = [];
    var tomorrowTask = [];
    var upcommingTask = [];
    var nodueTask = [];    
    
    let added_category = [];
    /*Current Category as per planner*/
    for (let index in data) {
      let timelog = [];
      if (
        current_time_number > data[index].timelog[current_day].start &&
        current_time_number < data[index].timelog[current_day].end
        ) {
        timelog["timelog"] = data[index].timelog[current_day].start;
        timelog["category"] = data[index].categoryID;
        added_category.push(data[index].categoryID);
        //timelogData.push(timelog);
        var catData = this.filter_getParentCategory(data[index].categoryID);
        //console.log('Cate Data', catData);
        if (catData.length > 0) {
          for (var idx in catData) {
            //console.log('cate ID',catData[idx].id);
            if (catData[idx].id === data[index].categoryID) {
              data_tree.push(catData[idx]);
              today_tree.push(JSON.parse(JSON.stringify(catData[idx])));
              tomorrow_tree.push(JSON.parse(JSON.stringify(catData[idx])));
              upcomming_tree.push(JSON.parse(JSON.stringify(catData[idx])));
              nodue_tree.push(JSON.parse(JSON.stringify(catData[idx])));

            }
          }
        }
        break;
      }
    }
    /*Current 2nd Category as per planner*/
    for (let index in data) {
      let timelog = []; 
      if (
        current_time_number < data[index].timelog[current_day].start
        ) 
      {
        if (!this.inArray(data[index].categoryID, added_category)) {
          var catData = this.filter_getParentCategory(data[index].categoryID);
          added_category.push(data[index].categoryID);
          if (catData.length > 0) {
            for (var idx in catData) {
              //console.log('cate ID',catData[idx].id);
              if (catData[idx].id === data[index].categoryID) {
                data_tree.push(catData[idx]);
                today_tree.push(JSON.parse(JSON.stringify(catData[idx])));
                tomorrow_tree.push(JSON.parse(JSON.stringify(catData[idx])));
                upcomming_tree.push(JSON.parse(JSON.stringify(catData[idx])));
                nodue_tree.push(JSON.parse(JSON.stringify(catData[idx])));
              }
            }
          }
          break;
        }
      }
    }
    /*Remain Category as per planner */
    var catDatas = this.getParentCategory(data);
    if (catDatas.length > 0) {
      for (var idx in catDatas) {
        if (!this.inArray(catDatas[idx].id, added_category)) {
          data_tree.push(catDatas[idx]);
          today_tree.push(JSON.parse(JSON.stringify(catDatas[idx])));
          tomorrow_tree.push(JSON.parse(JSON.stringify(catDatas[idx])));
          upcomming_tree.push(JSON.parse(JSON.stringify(catDatas[idx])));
          nodue_tree.push(JSON.parse(JSON.stringify(catDatas[idx])));
        }
      }
    }
    let childrens = [];
    let tadded_category = [];
    let tchild = [];
    /* Today Task */
    for (var i in today_tree) {
      let cateId = today_tree[i].id;      
      let chield = [];
      this.allchildcates = [];          
      this.getIds(today_tree[i].childcats);
      chield = this.getsheduleTask(cateId,'today');
      if(chield.length > 0){
        today_tree[i].childrens = "";
        today_tree[i].childrens = this.orderBy.transform(chield, ["+index"]) ;
        todaysTasks.push(today_tree[i]);
      }
    } 
    /* Tomorrow Task */
    for (var i in tomorrow_tree) {
      let cateId = tomorrow_tree[i].id;
      let chield = [];
      this.allchildcates = [];          
      this.getIds(tomorrow_tree[i].childcats);
      chield = this.getsheduleTask(cateId,'tomorrow'); 
      if(chield.length > 0){
        tomorrow_tree[i].childrens = "";
        tomorrow_tree[i].childrens = chield;
        tomorrowTask.push(tomorrow_tree[i]);
      }
    }
    /* upcomming Task */
    for (var i in upcomming_tree) {
      let cateId = upcomming_tree[i].id;
      let chield = [];
      this.allchildcates = [];          
      this.getIds(upcomming_tree[i].childcats);
      chield = this.getsheduleTask(cateId,'upcomming'); 
      if(chield.length > 0){
        upcomming_tree[i].childrens = "";
        upcomming_tree[i].childrens = chield;
        upcommingTask.push(JSON.parse(JSON.stringify(upcomming_tree[i])));
      }
    }
    /* nodue Task */
    for (var i in nodue_tree) {
      let cateId = nodue_tree[i].id;
      let chield = [];
      this.allchildcates = [];          
      this.getIds(nodue_tree[i].childcats);
      chield = this.getsheduleTask(cateId,'nodue'); 
      if(chield.length > 0){
        nodue_tree[i].childrens = "";
        nodue_tree[i].childrens = chield;
        nodueTask.push(JSON.parse(JSON.stringify(nodue_tree[i])));
      }
    }
    this.todaysTask = todaysTasks;
    this.tomorrowTask = tomorrowTask;
    this.upcommingTask = upcommingTask;
    this.nodueTask = nodueTask;
  }
  getIds(obj) {
    for (var x in obj) {
      if (typeof obj[x] === 'object') {
        this.getIds(obj[x]);
      } else if (x == 'value') {
        this.allchildcates.push(obj.value);
      }
    }
  }
  getsheduleTask(cateId,flag){

    var todayDate = new Date().toDateString(); //Today Date         
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString();
    let task = this.tasks;
    if(flag == 'today'){
      //console.log('this cate ', this.childcats);
      let childst = [];
      for (var i in task) {
        if(cateId == task[i].category_id || this.inArray(task[i].category_id, this.allchildcates)){           
          var event = new Date(task[i].dueon);
          event.setHours(0,0,0);
          let dueDate = event.toString();
          let DueDates = Date.parse(dueDate);
          let todayDates = Date.parse(todayDate);                   
          if (todayDates >= DueDates) {              
            childst.push(task[i]);              
          }
        }
      }
      return childst;
    }
    if(flag == 'tomorrow'){
      let childtm = [];
      for (var i in task) {
        if(cateId == task[i].category_id || this.inArray(task[i].category_id, this.allchildcates)){
          var event = new Date(task[i].dueon);
          event.setHours(0,0,0);
          let dueDate = event.toString();
          let DueDates = Date.parse(dueDate);
          let tomorrows = Date.parse(tomorrow);
          if (tomorrows  == DueDates) {
            childtm.push(task[i]);
          }
        }
      } 
      return childtm;
    }
    if(flag == 'upcomming'){
      let childup = [];
      for (var i in task) {
        if(cateId == task[i].category_id || this.inArray(task[i].category_id, this.allchildcates)){
          var event = new Date(task[i].dueon);
          event.setHours(0,0,0);
          let dueDate = event.toString();
          let DueDates = Date.parse(dueDate);
          let tomorrows = Date.parse(tomorrow);
            //console.log(' Due Date '+ dueDate +' tomorrow ',tomorrow);
            if (DueDates > tomorrows) {
              childup.push(task[i]);
            }
          }
        } 
        return childup;
    } 
    if(flag == 'nodue'){
      let childst = [];
      for (var i in task) {
        if(cateId == task[i].category_id || this.inArray(task[i].category_id, this.allchildcates)){
          if (task[i].dueon=="") {
            childst.push(task[i]);
          }
        }
      } 
      return childst;
    } 
    }
  completedTask(type){
    if(type == '5'){
      if(this.completedTaskDisplay == 0){
        this.completedTaskDisplay = 1;
      }else{
        this.completedTaskDisplay = 0;
      }
    }else{
      if(this.archiveTasksDisplay == 0){
        this.archiveTasksDisplay = 1;
      }else{
        this.archiveTasksDisplay = 0;
      }
    }    
  }
  inArray(needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
      if (haystack[i] == needle) return true;
    }
    return false;
  }
  manageFilter(flag){ 
    console.log('event', flag);
    /* 1 =  Show Completed, 2 =  Show Archived, 
       3 =  Show InCompleted, 4 =  Show Running */
    if(flag.item_id == 1){
      if(this.showincompleted == 0){
        this.showincompleted = 1;
      }
    }
    if(flag.item_id == 2){
      if(this.showrunning == 0){
        this.showrunning = 1;
      }
    }
    if(flag.item_id == 3){
      if(this.showcompleted == 0){
        this.showcompleted = 1;
      }
    }
    if(flag.item_id == 4){
      if(this.showarchived == 0){
        this.showarchived = 1;
      }
    }    
    this.getTasks(0);
  } 
  manageFilterAll(flag){ 
    console.log('Select all event', flag);
    /* 1 =  Show Completed, 2 =  Show Archived, 
       3 =  Show InCompleted, 4 =  Show Running */ 
    this.showincompleted = 1;
    this.showrunning = 1;
    this.showcompleted = 1;
    this.showarchived = 1; 
    this.getTasks(0);
  }
  manageFilterDeSelect(flag){ 
    //console.log('Deselet All', flag);
    if(flag.item_id == 1){
      if(this.showincompleted == 1){
        this.showincompleted = 0;
      }
    }
    if(flag.item_id == 2){
      if(this.showrunning == 1){
        this.showrunning = 0;
      }
    }
    if(flag.item_id == 3){
      if(this.showcompleted == 1){
        this.showcompleted = 0;
      }
    }
    if(flag.item_id == 4){
      if(this.showarchived == 1){
        this.showarchived = 0;
      }
    }      
    this.getTasks(0);
  }
  manageFilterDeSelectAll(flag){
    console.log('Deselet All Items');
    this.showincompleted = 0;
    this.showrunning = 0;
    this.showcompleted = 0;
    this.showarchived = 0; 
    this.updateDisplay = 0;
    this.getTasks(0);
  }
  timeToDecimal(t) {
    var arr = t.split(":");
    var dec = arr[0] * 60 + +arr[1];
    return dec;
  }
  changetime(number) {
    var hours1;
    var minutes1;
    var val = 0;
    if (number < 0) {
      val = 0;
    } else {
      val = number;
    }
    hours1 = Math.floor(val / 60);
    minutes1 = val - hours1 * 60;

    //if (hours1 <= 9) hours1 = '0' + hours1;
    if (minutes1 < 9) minutes1 = "0" + minutes1;
    if (minutes1 == 0) minutes1 = "00";

    if (hours1 >= 12) {
      //console.log('Hours => ',hours1);
      if (hours1 == 12) {
        hours1 = hours1;
        minutes1 = minutes1 + " PM";
      } else {
        if (hours1 == 24) {
          hours1 = hours1 - 13;
          if (minutes1 == 0) minutes1 = "59";
        } else {
          hours1 = hours1 - 12;
        }

        minutes1 = minutes1 + " PM";
      }
    } else {
      if (hours1 == 0 && minutes1 == 0) {
        hours1 = 12;
        minutes1 = "00" + " AM";
      } else {
        minutes1 = minutes1 + " AM";
      }
      if (hours1 == 0) {
        hours1 = 12;
      }
    }
    if (hours1 <= 9) hours1 = "0" + hours1;
    return hours1 + ":" + minutes1;
  }
  formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    //hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes;
    return strTime;
  }
  convertStamptoDate(timestamp) {
    var dates = new Date(timestamp);
    let date = this.formatDate(dates);
    //2019-03-12 09:30:00
    return date;
  }
  formatDate(date) {
    var year = date.getFullYear().toString();
    var month = (date.getMonth() + 101).toString().substring(1);
    var day = (date.getDate() + 100).toString().substring(1);
    var hr = (date.getHours() + 100).toString().substring(1);
    var min = (date.getMinutes() + 100).toString().substring(1);
    var sec = (date.getSeconds() + 100).toString().substring(1);
    return year + "-" + month + "-" + day + " " + hr + ":" + min + ":" + sec;
  }
  getCalendarTask(task) {
    var taskList = [];
    for (let index in task) {
      let timelogData = task[index].timelog;
      let taskName = task[index].name;
      let taskID = task[index].taskID;
      // let category = task[index].category_name;
      let parentCateName = this.getCategoryParent(task[index].category_id);
      let category = parentCateName['label'];
      if (timelogData.length > 0) {
        for (let i in timelogData) {
          let startTime = this.convertStamptoDate(timelogData[i].start);
          let endTime = this.convertStamptoDate(timelogData[i].end);
          if (timelogData[i].end.length == 0) {
            var timestamp = Number(new Date());
            endTime = this.convertStamptoDate(timestamp);
          }
          var datas = {
            start: startTime,
            end: endTime,
            text: taskName,
            id: DayPilot.guid() + " " + taskID,
            class: category,
            timelogIndex: i,
            event: task[index]
          };
          //console.log('Time Start => ',startTime +'Time End => '+endTime);
          taskList.push(datas);
        }
      }
    }
    //console.log('taskList',taskList);
    this.timeevents = taskList;
  }
  /**  Drop Down  */
  activeNumIndex: number;

  enter(i) {
    this.activeNumIndex = i;
  }
  setDropData(target, trigger, cat) {
    // console.log("target  = ", target);
    // console.log("trigger =  ", trigger);
    // console.log("cat =  ", cat);
    if(trigger != undefined){
      var index = target;
      //console.log("index  = ",index);
      var cat_id = undefined;
      if(cat != undefined && cat.category_id != undefined){
        cat_id = cat.category_id;
      }
      this.taskService
      .updateTaskOrder(index, trigger, cat_id)
      .subscribe(hero => {
        //this.filter(this.filter_no,0);
        var click = 0;
      //console.log('Updated Task1 ', task);
      //this.todaysTask.childrens.find(item => item.taskID == task.taskID);
      for (var index in this.todaysTask) {            
       for (var j in this.todaysTask[index].childrens) {
        if(this.todaysTask[index].childrens[j].taskID == hero.taskID){
             this.todaysTask[index].childrens.find(item => item.taskID == hero.taskID).index = hero.index;
                }
              }
            }
           // this.getTasks();
         });
    }else{
      //this.filter(this.filter_no,0);
      //this.getTasks();
    }
    /* if(trigger != undefined){
      this.target_task = target
      this.trigger_task = trigger;
      var index = 0;
      if(target != undefined && target.index != undefined && target.index <= trigger.index){
        index = target.index/2;
      }else if(target != undefined && target.index != undefined && target.index > trigger.index){
        index = target.index * 2;
      }
      console.log("index  = ",index);
      this.taskService
          .updateTaskOrder(index, this.trigger_task)
          .subscribe(hero => {
            console.log("call service ", hero);
            this.getTasks();
        });
    }else{
      this.getTasks();
    } */
  }
  drop(event: CdkDragDrop<string[]>) {
    //moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
    if (event.previousContainer === event.container) {
      var childrens:any;
      if (this.filter_no == 1) {
        //childrens = this.myTree[this.activeNumIndex].childrens;
        childrens = JSON.parse(JSON.stringify(event.container.data)) ;
      }else{
        //var childrens = this.myTrees[this.activeNumIndex].childrens;
        childrens = JSON.parse(JSON.stringify(event.container.data)) ;
      }
      if (
        childrens[event.currentIndex] != undefined &&
        childrens[event.previousIndex] != undefined &&
        childrens[event.currentIndex].taskID != undefined &&
        childrens[event.currentIndex].taskID != childrens[event.previousIndex].taskID
        ) {
        var previous = childrens[event.previousIndex];
      var current = childrens[event.currentIndex];
      var current_pre = childrens[event.currentIndex - 1];
      if (previous != undefined && previous.index < current.index) {
        current_pre = childrens[event.currentIndex + 1];
        if (current_pre == undefined) {
          current_pre = { index: current.index + 1 };
        }
      }
      var index = current.index;
      if (current_pre != undefined) {
        index = index + current_pre.index;
      }
      index = index / 2;
        //console.log("index ", index);
        this.setDropData(index, childrens[event.previousIndex] , undefined);
        moveItemInArray(
          //childrens,
          event.container.data,
          event.previousIndex,
          event.currentIndex
          );
      }
    } else {

      var index_1 = event.container.data.length + 1;
      var current_1 = event.container.data[event.currentIndex];
      //console.log('current_1',current_1);
      var current_pre_1 = event.container.data[event.currentIndex - 1];
      
      
      
      if (current_1 != undefined && current_pre_1 != undefined) {
        index_1 = (current_1['index'] + current_pre_1['index'] ) / 2;
      } else if (current_1 != undefined) {
        index_1 = current_1['index'] / 2;
      }
     // console.log("index = ",index_1);
      var container_data = event.container.data[event.currentIndex];
      if(container_data == undefined){
      container_data = event.container.data[event.currentIndex - 1];
      }
      this.setDropData(
        index_1,
        event.previousContainer.data[event.previousIndex],
        container_data
        );
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
        );
    }
  }
  hasTab(tab){
    if(tab == "Status"){
      this.selectedindex = this.tabs[0];
    }else{
      this.selectedindex = this.tabs[1];
    }   
    this.sucessMsg = 0; 
  }
  unarchive(task){
    if (task.status != undefined) {
      task.status = 0;
      task.state = 0;
    }
    var input = {};
    task.modifiedON = new Date();
    this.taskService.updateTask(task).subscribe(task => {
     var click = 0;
     this.getTasks(click);
    });
  }
  /*TimeLine Chnages*/

  /*Manage Tab - Data-Table*/
  getPriority(pr){
    let prlable = "";
    if(pr == 0){
      prlable = "/assets/images/no-pr.png";
    }else if(pr == 1){
      prlable = "/assets/images/p1.png";
    }else if(pr == 2){
      prlable = "/assets/images/p2.png";       
    }else if(pr == 3){
      prlable = "/assets/images/p3.png";
    }else if(pr == 4){
      prlable = "/assets/images/p4.png";
    }else{
      prlable = "/assets/images/p4.png";
    }
    return prlable;
  }
  getCategoryName(cateId){
    let cate = [];
    for (let cat in this.category) {
      cate[this.category[cat]['value']] = this.category[cat]['label'];
    }
      return cate[cateId];
    }
  getCategoryId(cateName){
    let cate = [];
    for (let cat in this.category) {
      cate[this.category[cat]['label']] = this.category[cat]['value'];
    }  
    return cate[cateName];
  }
  onSelect({ selected }) {
    if(selected!=undefined){
      if(selected.length > 0){
        this.updateDisplay = 1;
      }else{
        this.updateDisplay = 0;
      }
      this.selected.splice(0, this.selected.length);
      this.selected.push(...selected);
    }else{
      this.updateDisplay = 0;
    }
  }
  onActivate(event) {
    //console.log('Activate Event', event);
  }
  update() {
    this.selected = [this.manage_rows[1], this.manage_rows[3]];
  }
  updateValue(event, cell, rowIndex,rowdata,opt) {

    this.editing[rowIndex + '-' + cell] = false;
    this.manage_rows[rowIndex][cell] = event.target.value;
    this.manage_rows = [...this.manage_rows];
    let task = new Task();
    if(opt == "taskname"){
      task.name = this.manage_rows[rowIndex][cell];
      $(".succssmsg").html("<strong>Success!</strong> Task has been updated.");
    }else if(opt=="categoryId"){
      let cateId = this.getCategoryId(this.manage_rows[rowIndex][cell]);
      task.category_id = cateId;
      $(".succssmsg").html("<strong>Success!</strong> Category has been updated.");
    }else if(opt=="description"){
      let descriptions = this.manage_rows[rowIndex][cell];
      task.description = descriptions;
      $(".succssmsg").html("<strong>Success!</strong> Description has been updated.");
    }else{
      if(this.manage_rows[rowIndex][cell] == "Select Priority"){
        this.manage_rows[rowIndex][cell] = "";
      }
      task.priority = this.manage_rows[rowIndex][cell];
      $(".succssmsg").html("<strong>Success!</strong> Priority has been updated.");
    }  
    // console.log('event.target.value', event.target)
    // console.log('rowdata', rowdata);      
    task.taskID = rowdata.taskID;
    task.modifiedON = new Date();
    var input = {};
    input["task"] = task;
    //console.log('Update',task);
    this.taskService.updateTask(task).subscribe(task => {
      var click = 0;
      //console.log('Updated Task1 ', task);
      //this.todaysTask.childrens.find(item => item.taskID == task.taskID);
      for (var index in this.todaysTask) {            
             for (var j in this.todaysTask[index].childrens) {
              if(this.todaysTask[index].childrens[j].taskID == task.taskID){
                  if(this.todaysTask[index].childrens[j].category_id!=task.category_id){
                    // this.todaysTask[index].childrens.find(item => item.taskID == task.taskID).category_id = task.category_id; 
                    this.getTasks(click);
                  }
                  this.todaysTask[index].childrens.find(item => item.taskID == task.taskID).name = task.name;
                  this.todaysTask[index].childrens.find(item => item.taskID == task.taskID).priority = task.priority;
                  this.todaysTask[index].childrens.find(item => item.taskID == task.taskID).description = task.description;
              }
             }
      }
      //this.todaysTask = this.todaysTask;
      console.log('Updated Task ', this.todaysTask);
      //this.getTasks(click);
    });   
    this.sucessMsg = 1;
    this.updateCate = '';
  }
  cloneTasks(task,isclone,flag){

    let category_id = task.category_id;
    let priority =  task.priority;

    if(flag == 1){

      let timeLog = [];
      if(task.state == 1){
        let Stime = Number(new Date());
        let Etime = "";
        let timelogData: Array<any> = [
        { "start": Stime, "end": Etime}
        ];
        timeLog.push(timelogData[0]);
      }
      task['timelog'] = timeLog;
      task['parenttask'] = task.parenttask;
      this.sucessMsg = 0;
    }else{      
      if(isclone == 1){        
        this.taskService.archiveTask(task).subscribe(task => {
          this.filter(this.filter_no,0);
        });
        $(".succssmsg").html("<strong>Success!</strong> Original task has been archived & new created."); 
      }else{
        $(".succssmsg").html("<strong>Success!</strong> Duplicate task has been created."); 
      }
      this.sucessMsg = 1;
      task['name'] = task.name;
      task['priority'] = task.priority;
      task['parenttask'] = '';
      task['timelog'] = [];
    }
    task['modifiedON'] = new Date();
    console.log('Added Clone Task', task);
    this.taskService.addTask(task, { category_id } as any)
    .subscribe(hero => {
      var click = 0;
      this.getTasks(click);   
    });
  }
  openConfirmDialog(value,tab) { 
    this.popupplace = tab;
    this.edittaskForm.controls.task.markAsUntouched({ onlySelf: true });
    this.edittaskForm.controls.task.markAsPristine({ onlySelf: true });
    this.checkedList = [];
    this.validationerror = 0;
    if(value!=""){
      
      var dueonDate = []; 
      var setdueonDate = []; 
      let dueonDateVal = 1;
      
      setdueonDate['startDate'] = "";
      setdueonDate['endDate'] = "";

      if(value.setDate == 1){
        setdueonDate['startDate'] = value.dueon;
        setdueonDate['endDate'] =  value.dueon;
      }
      if(value.dueon!=""){
        dueonDateVal = this.getwhendue(value.dueon,'0', value.setDate);
      }
      let discretionary = "";
      if(value.discretionary!=undefined || value.discretionary!=""){
        discretionary = value.discretionary;
      }
      let routine = "";
      if(value.routine!=undefined || value.routine!=""){
        routine = value.routine;
      }
      let frequency = 0;
      if(value.frequency!=undefined || value.frequency!=""){
        frequency = value.frequency;
      }
      let repeatday = "";
      if(value.repeatday!=undefined && value.repeatday!=""){
        repeatday = value.repeatday;
        this.checkedList = JSON.parse("[" + repeatday + "]");
      }
      let priority = "";
      if(value.priority!=undefined || value.priority!=""){
        priority = value.priority;
      }
      let duration = "";
      if(value.duration!=undefined || value.duration!=""){
        duration = value.duration;
      }
      let description = "";
      if(value.description!=undefined || value.description!=""){
        description = value.description;
      }
      let starttime = "1"         
      this.edittaskForm.patchValue({
        task: value.name,
        taskID:value.taskID,
        priority:priority,
        duration:duration,
        description:value.description,
        dueon: dueonDateVal,
        setdueon: setdueonDate,
        discretionary: discretionary,
        routine: routine,
        frequency:frequency,
        repeatday:repeatday,
        starttime:starttime,
      });     
      this.catvalue = value.category_id;
      var selectedItem = TreeviewHelper.findItemInList(this.items, value.category_id);
      this.select(selectedItem);
      this.tasklable = "Edit Task";
    }else{  
      var dueonDate = []; 
      dueonDate['startDate'] = '';
      dueonDate['endDate'] =   '';
      
      this.edittaskForm.patchValue({
        task: '',
        taskID:'',
        categoryID:'',
        priority:3,
        duration:30,
        description:'',
        dueon: '1 ' + moment(new Date()).format("MM/DD/YYYY"),
        setdueon: dueonDate,
        discretionary: 1,
        routine: 0,
        frequency:0,
        repeatday : '',
        starttime : '',
      });
      this.catvalue = '';
      this.tasklable = "Add Task";    
      console.log('this.items', this.items);
      var selectedItem = TreeviewHelper.findItemInList(this.items, 12345);
      this.select(selectedItem);
    }
    this.ngxSmartModalService.resetModalData('myBootstrapModal');
    this.ngxSmartModalService.open('myBootstrapModal');
  }
  onSave(){ 

    let duedate = this.edittaskForm.value.dueon;
    let setDate = 0;
    let dueon = "";
    let starttime = "";
    let repeatday = "";
    let frequency = this.edittaskForm.value.frequency;
    if(this.edittaskForm.value.task == "" || this.edittaskForm.value.task==undefined){
      this.validationerror = 1;
      return;
    }
    //console.log('Form Value ', this.edittaskForm.value.frequency);

     var now = new Date(); 
    if(duedate!="" && duedate!=1){      
      if(duedate!=7){
        var res = duedate.split(" ");
        if(res[1] !="" && res[1] != undefined){
          dueon = new Date(res[1]).toString();
          dueon = moment(dueon).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
        }    
      }else{
        setDate = 1;
        let dueson = this.edittaskForm.value.setdueon; 
        if(dueson.endDate != undefined || dueson.endDate != ""){
          dueon = moment(dueson.endDate._d).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+''); 
        }
      }
    }else{
      dueon = "";
    }
    if(frequency!=""){
      if(frequency == 1){
          if(this.edittaskForm.value.starttime=="" || this.edittaskForm.value.starttime==undefined){
            this.validationerror = 2;          
            return;
          }
          starttime = this.edittaskForm.value.starttime;
      }else if(frequency == 2){
          if(this.checkedList.length == 0){
           this.validationerror = 3;           
           return;
         }
        var weeklynumber = this.checkedList.join();
        let todayDate = Date.parse(new Date().toDateString());                      
        let occurDate = Date.parse(moment(dueon).format('L'));
        if(todayDate == occurDate){
          var today = moment().day();
          if (!this.inArray(today, weeklynumber)) {
           this.validationerror = 5;           
           return;
          }
        }
        repeatday = weeklynumber;
      }else if(frequency == 3){
        if(this.edittaskForm.value.repeatday=="" || this.edittaskForm.value.repeatday==undefined){
         this.validationerror = 4;          
         return;
        }
        repeatday = this.edittaskForm.value.repeatday;
      }
    }
    if(frequency == 3){
      var day = repeatday;
      var month = now.getMonth() + 1;
      var year = now.getFullYear();
      let dates = moment(month+'/'+day+'/'+year).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
      if(Date.parse(dates) < Date.parse(new Date().toDateString())){
        month = now.getMonth() + 2;        
      }
      dueon = moment(month+'/'+day+'/'+year).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
    }
    let taskName =  this.edittaskForm.value.task;
    let category_id = this.catvalue;
    if(this.catvalue == undefined || category_id==""){
      category_id = "";
    }
    let description = this.edittaskForm.value.description;
    let duration = this.edittaskForm.value.duration;
    let priority = this.edittaskForm.value.priority;
    let discretionary = this.edittaskForm.value.discretionary;
    let routine = this.edittaskForm.value.routine;
    if(priority == ""){
      priority = 3;
    }
    if(discretionary == "" || routine == discretionary){
      discretionary = 1;
    }
    if(routine == "" || routine == undefined){
      routine = 0;
    }
    let taskID = this.edittaskForm.value.taskID;
    let task = new Task();
    task.name = taskName;
    task.category_id = category_id;  
    task.description = description; 
    task.priority = priority;  
    task.duration = duration;
    task.dueon = dueon;
    task.setDate = setDate;
    task.discretionary = discretionary;
    task.routine = routine;
    task.frequency = frequency;
    task.repeatday = repeatday;
    task.starttime = starttime;
    task.modifiedON = new Date();

    var input = {};
    input["task"] = task;
    //console.log('Input Data',task);
    if (this.edittaskForm.valid) {
      if(taskID!=""){
        task.taskID = taskID;
        this.taskService.updateTask(task).subscribe(task => {
          var click = 0;
          this.getTasks(click);
        });
        $(".succssmsg").html("<strong>Success!</strong> Task has been updated.");
      }else{
        task.state = 0;
        if(this.popupplace == 1){
          let todayDate = Date.parse(new Date().toDateString());                      
          let occurDate = Date.parse(moment(dueon).format('L'));
          if(todayDate == occurDate){            
            let Stime = Number(new Date());
            let Etime = "";
            let timelogData: Array<any> = [
            { "start": Stime, "end": Etime}
            ];
            task.state = 1;
            task.timelog = timelogData;            
          }
        }
        this.taskService.addTask(task,{ category_id } as any)
        .subscribe(hero => {   
          let task = new Task();
          task.taskID = hero.taskID;              
          task.parenttask = hero.taskID;
          this.taskService.updateTask(task).subscribe(hero => {
            var click = 0;
            this.getTasks(click);
          });
          
        });
        $(".succssmsg").html("<strong>Success!</strong> Task has been added");
      }
      this.validationerror = 0;
      this.sucessMsg = 1; 
      this.catvalue = '';
      this.popupplace = 0;
      this.ngxSmartModalService.close('myBootstrapModal');
    }else{
      this.validateAllFormFields(this.edittaskForm);
      return;
    }   
    this.checkedList = [];
  }
  remove() {
     let task = new Task();
      var total = this.selected.length;
      if(total > 0){     
        for (let i in this.selected) {            
          if(this.selected[i]['timelog'].length > 0){
            task.taskID = this.selected[i]['taskID'];
            task.status = 2;
            task.modifiedON = new Date();
            var input = {};
            input["task"] = task;
            this.taskService.updateTask(task).subscribe(task => {
            });
            //console.log('TimeLog', this.selected[i]['timelog']);  
          }else{
            this.deleteTasks(this.selected[i], this.filter_no);
          }        
         }
       }
      $(".succssmsg").html("<strong>Success!</strong> Task has been Remove/Archive"); 
      this.selected = [];
      this.updateDisplay = 0;
      var click = 0;
      this.sucessMsg = 1;
      this.getTasks(click);
  }
  multiupdateValue(value,type){
    let task = new Task();

    if(type == 'cate' && value!=""){

      if(this.selected.length > 0){       
       for (let i in this.selected) {
        var taskid = this.selected[i]['taskID'];
        task.taskID = taskid;
        task.category_id = value;
        task.modifiedON = new Date();
        var input = {};
        input["task"] = task;
        this.taskService.updateTask(task).subscribe(task => {
          var click = 0;
          this.getTasks(click);
        });
      }
    }      
      $(".succssmsg").html("<strong>Success!</strong> Categroy has been updated.");
      // console.log('Category value',value);
      // console.log('Type',type);
    }else{
        if(this.selected.length > 0){       
         for (let i in this.selected) {
          var taskid = this.selected[i]['taskID'];
          task.taskID = taskid;
          task.priority = value;
          task.modifiedON = new Date();
          var input = {};
          input["task"] = task;
          this.taskService.updateTask(task).subscribe(task => {
            var click = 0;
            this.getTasks(click);
          });
        }
        $(".succssmsg").html("<strong>Success!</strong> Priority has been updated.");
      }
    }
    this.sucessMsg = 1;
    this.selected = [];
    this.updateDisplay = 0;
  }
  getwhendue(date,label,setdate){

    if(date!="" && date!=undefined){
      date = date.split(" ");
      date = date[0];
      var todayDate = Date.parse(new Date().toDateString());
      var tomorrow = moment(new Date()).add(1,'days').format("MM/DD/YYYY");
      let thisweek = Date.parse(moment().endOf('week').format("MM/DD/YYYY"));
      let nextweek = Date.parse(moment().add(1, 'weeks').endOf('week').format("MM/DD/YYYY"));
      let thismonth = Date.parse(moment().endOf('month').format("MM/DD/YYYY"));
      let nextmonth = Date.parse(moment().add(1, 'month').endOf('month').format("MM/DD/YYYY"));
      let DueDates = Date.parse(date);
      if (todayDate >= DueDates) {
        if(label == 1){
          if(setdate == 1){
            return 'Today </br>' + date;
          }
          return 'Today';
        }else{
          return '1 '+ moment(new Date()).format("MM/DD/YYYY");
        }      
      }    
      let tomorrows = Date.parse(tomorrow);
      if (DueDates == tomorrows) {
        if(label == 1){
          if(setdate == 1){
            return 'Tomorrow </br>' + date;
          }
          return 'Tomorrow';
        }else{
          return '2 '+ moment(new Date()).add(1,'days').format("MM/DD/YYYY");
        }      
      }
      if (tomorrows < DueDates && DueDates <= thisweek) {
        if(label == 1){
          if(setdate == 1){
            return 'This Week </br>' + date;
          }
          return 'This Week';
        }else{
          return '3 '+moment().endOf('week').format("MM/DD/YYYY");
        }       
      } 
      if (thisweek < DueDates && DueDates <= nextweek) {
        if(label == 1){
          if(setdate == 1){
            return 'Next Week </br>' + date;
          }
          return 'Next Week';
        }else{
         return '4 '+ moment().add(1, 'weeks').endOf('week').format("MM/DD/YYYY");
       }       
      }
      if (nextweek < DueDates && DueDates <= thismonth) {
        if(label == 1){
          if(setdate == 1){
            return 'This Month </br>' + date;
          }
          return 'This Month';
        }else{
          return '5 '+moment().endOf('month').format("MM/DD/YYYY");
        }       
      }
      if (thismonth < DueDates && DueDates <= nextmonth) {
        if(label == 1){
          if(setdate == 1){
            return 'Next Month </br>' + date;
          }
          return 'Next Month';
        }else{
          return '6 '+ moment().add(1, 'month').endOf('month').format("MM/DD/YYYY");
        }       
      }
      if (nextmonth < DueDates) {
        if(label == 1){
          return date;
        }else{
          return 7;
        }   
      } 
    }else{
      return 'No Due';
    }
  }
  onCheckboxChange(option, event) {
    if(event.target.checked) {
      if (!this.inArray(option.id, this.checkedList)) {
        this.checkedList.push(option.id);
      }
    } else {
     for(var i=0 ; i < this.repeatdayboxes.length; i++) {
       if(this.checkedList[i] == option.id) {
         this.checkedList.splice(i,1);
       }
     }
   }
   console.log('List Checked ', this.checkedList);
  }
  getHighestTime(timelog){

    if(timelog!=""){
      var data = [];
      for (var index in timelog) {
        data.push(timelog[index].end); 
      }
      var timestamp = Math.max.apply(null, data);
      var dueon = moment(timestamp).format('MM/DD/YYYY HH:mm:ss');
      return dueon;
    }else{
      return moment(new Date()).format("MM/DD/YYYY HH:mm:ss");
    }
  }
  popoupaction(task){
    this.action.onShowAction(task);
  }
  popupclose(){
    //console.log('Hello call action');
    this.action.oncloseAction();
  }
  openModal(id: string, args: any) {
    //console.log("arg ", args);    
    this.timesheet_arg = args; // store timesheet argeument in class variable.
    this.modalService.open(id);
    this.popuptaskID = "";
    this.catvalue = "";
  }

  closeModal(id: string) {
    this.timesheet.control.clearSelection();
    this.modalService.close(id);
    this.bodyText = "";
    this.catvalue = "";
    this.popuptaskID = "";
    this.timesheet_arg = null; // clear timesheet argeument in class variable.
  }
  okModal(id: string) {
    console.log("modal ok");
   
    this.modalService.close(id);
    let name = this.bodyText;
    let start = Date.parse(this.timesheet_arg.start.value);
    var dueon = moment(start).format('MM/DD/YYYY HH:mm:ss');
    let end = Date.parse(this.timesheet_arg.end.value);
    let timelogData: Array<any> = [{ start: start, end: end }];
    let category_id = this.catvalue;
    if(this.catvalue == undefined || category_id==""){
      category_id = "";
    }
    // console.log('this category', this.catvalue);
    // return;
    if(name){
        let task = new Task();
        /*Edit Task */
        if(this.popuptaskID){
          let oldtimeLog:any;
          for (let i in this.tasks) {
            if(this.popuptaskID == this.tasks[i].taskID){             
              oldtimeLog = this.tasks[i].timelog;
            }
          }
          if(oldtimeLog.length > 0){
            oldtimeLog.push(timelogData[0]);
            task['timelog'] = oldtimeLog;           
          }else{
            task['timelog'] = timelogData;
          }
          task['category_id'] = category_id;
          task['taskID'] = this.popuptaskID;
          task['modifiedON'] = new Date();        
          this.taskService.updateTask(task).subscribe(tasks => {
            this.getTasks(0);
            this.bodyText = "";
            this.catvalue = "";
            this.category_id = "";
          });

        }else{    
          /* Add task */         
          task['name'] = name;
          task['dueon'] = dueon;
          task['priority'] = 3;
          task['state'] = 0;
          task['modifiedON'] = new Date();
          task['discretionary'] = 1;
          task['routine'] = 0;
          task['frequency'] = 0;
          task['repeatday'] = '';
          task['duration'] = 30;
          task['timelog'] = timelogData;
          this.taskService
          .addTask(task, { category_id } as any)
          .subscribe(hero => {
            let task = new Task();
            task.taskID = hero.taskID;              
            task.parenttask = hero.taskID;
              this.taskService.updateTask(task).subscribe(tasks => {
                this.getTasks(0);
                this.bodyText = "";
                this.catvalue = "";
                this.category_id = "";
              });
          })
        }
        
    }    
    // console.log("task Name", name);
    // console.log("timelogData ", timelogData);
  }
  onCategorySelect(data: any){    
    console.log("data ",data);
    this.category_id = data;
    this.catvalue = data;
  }
  selectEvent(item) {
    this.bodyText = item.name;
    console.log('Items',this.bodyText);
    // do something with selected item
  }

  onChangeSearch(val: string) {
    console.log('Items',val);
    // fetch remote data from here
    // And reassign the 'data' which is binded to 'data' property.
  }
  
  onFocused(e){
    // do something when input is focused
  }

  getSelectedTask(val: any){
    if(val){
      console.log('val', val);
      this.popuptaskID = val;
      for (let i in this.tasks) {
        if(val == this.tasks[i].taskID){             
          this.catvalue =  this.tasks[i].category_id;
          this.popuplabel = "Edit Task";
        }
      }     
    }else{
      this.popuptaskID = "";
      this.popuplabel = "Add Task";
    }    
    //console.log("value ", val);
  }
  updateFilter(event,filter) {
    
    var val = event.target.value.toLowerCase();
    if(filter == 'priority'){
      val = event.target.value;
    }
    if(val){      
      const temp = this.temp.filter(function(d) {
        if(filter == 'name'){           
            return d.task.toLowerCase().indexOf(val) !== -1 || !val;
        }        
        if(filter == 'cate'){
            return d.category.toLowerCase().indexOf(val) !== -1 || !val;
        }
        if(filter == 'priority'){
            if(val == 5){              
               if(d.priority == ""){  
                val = '';  
                return d.priority.toString().indexOf(val) !== -1 || !val;                
               }
            }else{
              return d.priority.toString().indexOf(val) !== -1 || !val;
            }            
        }
      });
      this.manage_rows = temp;
    }else{
      console.log('No value');
      this.manage_rows = this.temp;
    }
  }
  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    console.log('Detail Toggled', event);
  }
  
}
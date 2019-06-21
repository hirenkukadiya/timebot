import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild
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
import { map, filter, scan } from "rxjs/operators";
import { webSocket } from "rxjs/webSocket";
import { ajax } from "rxjs/ajax";
import { TestScheduler } from "rxjs/testing";
import { DayPilot, DayPilotSchedulerComponent } from "daypilot-pro-angular";
import { NgxSmartModalService } from 'ngx-smart-modal';
import * as moment from 'moment/moment.js';
import * as $ from "jquery";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
  providers: [OrderBy, GroupByPipe]
})
export class DashboardComponent implements OnInit {
  objectKeys = Object.keys;
  tasks: Task[] = [];
  tasks_org: Task[] = [];
  tasks_completed: Task[] = [];
  tasks_archive: Task[] = [];
  timesheet_tasks: Task[] = [];
  filterTasks: Task[] = [];
  all_task: Task[] = [];
  priorityTasks = {};
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
  myTrees: any;
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
  tasklable = "Edit Task";
  updateCate = "";
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
 daypilotstart = new Date();
 @ViewChild("timesheet")
 timesheet: DayPilotSchedulerComponent;

  constructor(
    private formBuilder: FormBuilder,
    public taskService: TaskService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService,
    private plannerservice: PlannerService,
    private orderBy: OrderBy,
    public ngxSmartModalService: NgxSmartModalService
  ) {
    this._eventEmiter.dataStr.subscribe(data => {
      this.getEventResponse(data);
    });
    this.sortableOptions = {
      sort: true,
      onUpdate: (event: any) => {
        //console.log("event ", event);
        this.postChangesToServer();
      }
    };     
  }  
  ngOnInit() {    
    this.defaultUserLogin();
    this.createTaskForm();
    this.getCategory();
    this.is_add_task = false;
    this.filter(this.filter_no,0);
     // time array
    var tt = 0; // start time
    var ap = ['AM', 'PM']; // AM-PM
    for (var i=0;tt<24*60; i++) {
      var hh = Math.floor(tt/60);
      var mm = (tt%60);
      this.times[i] = ("0" + (hh % 12)).slice(-2) + ':' + ("0" + mm).slice(-2) + ap[Math.floor(hh/12)];
      tt = tt + 30;
    };
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
      } 
      if (args.data.class === "Routine") {
        args.data.backColor = "#04B431";
      }
      if (args.data.class === "Social & Leisure") {
        args.data.backColor = "#FA58F4";
      }
      if (args.data.class === "Volunteerism") {
        args.data.backColor = "#58D3F7";
      }
      if (args.data.class === "Work") {
        args.data.backColor = "#6E6E6E";
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
      let dp = this.timesheet.control;
      let obj = this;
      DayPilot.Modal.prompt("Create a new task:", "", this).then(function(
        modal
      ) {
        dp.clearSelection();
        if (!modal.result) {
          return;
        }
        let name = modal.result;
        let category_id = "";
        let start = Date.parse(args.start.value);
        let end = Date.parse(args.end.value);
        let timelogData: Array<any> = [{ start: start, end: end }];
        obj.taskService
          .addCalendarTask(
            { name } as Task,
            { category_id } as any,
            timelogData
          )
          .subscribe(hero => {
            var click = 0;            
            obj.getTasks(click);
            obj.when_Duefilter();
          });
      });
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
          //console.log('Args', args);
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
  createTaskForm() {
    this.taskForm = this.formBuilder.group({
      task_name: ["", Validators.required],
      category_id: ["", ""]
    });
    this.edittaskForm = this.formBuilder.group({
      task: ["", Validators.required],
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
      starttime:["", ""],
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
  public getTasks(click): void {
    //console.log("get tasks...");
    this.taskService.getTasks().subscribe(tasks => {
      //console.log("view update ", tasks);
      this.filterTask(tasks,click);
    });
  }
  getCategory(): void {
    this.taskService.getCategory().subscribe(category => {
      this.filterCategroy(category);
    });
  }
  filterTask(tasks,click) {

    let tasks_anassgin = [];
    let tasks_completed = [];
    let tasks_archive = [];
    let all_task = [];
    let timesheet_tasks = [];
    for (let index in tasks) {
      
      let task = tasks[index];
      
      if(task.status == 2){
         tasks_archive.push(task);
      }else if(task.status == 0){
       tasks_anassgin.push(task);
      }else{
        tasks_completed.push(task);
      }
      all_task.push(task);
      timesheet_tasks.push(task);
    }
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
    //console.log('catData',catData);
    if (catData.length > 0) {
      for (var index in catData) {
        data_tree.push(catData[index]);
      }
    }
    //console.log('data_tree',data_tree);
    if (this.filter_no == 1) {
      this.myTree = data_tree;
    }else{
      this.when_Duefilter();
    }
    let manageRows = [];
    for (var index in all_task) {
       let addRows = [];
       addRows['task'] = all_task[index]['name'];
       addRows['taskID'] = all_task[index]['taskID'];
       addRows['id'] = all_task[index]['taskID'];
       addRows['category_id'] = all_task[index]['category_id'];              
       addRows['description'] = all_task[index]['description'];
       addRows['category'] = this.getCategoryName(all_task[index]['category_id']);
       addRows['priority'] = all_task[index]['priority'];
       addRows['timelog'] = all_task[index]['timelog'];
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
       if(all_task[index]['dueon']!=undefined && all_task[index]['dueon']!=""){
        addRows['whenDue'] = this.getwhendue(all_task[index]['dueon'],'1',setDate); 
       }else{
        addRows['whenDue'] = "No Due";
       }       
       addRows['frequency'] = frequency;
       addRows['action'] = all_task[index];
       manageRows.push(addRows);
    }
    //console.log('manageRows',manageRows);

    manageRows.sort(function(a,b){
      if(a.dueOn < b.dueOn) { return -1; }
      if(a.dueOn > b.dueOn) { return 1; }
      return 0;
    });
    //console.log('manageRows22',manageRows);
    this.manage_rows = manageRows;   
    this.getCalendarTask(this.timesheet_tasks);
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
  filterCategroy(category) {
    let category_list = [];
    let tasks_completed = [];
    for (let index in category) {
      let cat = category[index];
      category_list.push({
        value: cat.categoryID,
        label: cat.name,
        index: cat.index,
        color: cat.color,
        is_display: cat.name == "Unassigned" ? false : true
      });
    }
    category_list.sort(function(a, b) {
      return a.index - b.index;
    });
    this.category_lists = category_list;
    //console.log('Category List', category_list);
    this.category = category_list;
    this.category_id = "";
  }
  toggleCheckBox(event,filter){
    let task = new Task();
    let taskID = event.taskID;
    //console.log('event Completed ',event);
    if (event.status == 0) {
      if(event.frequency!=""){
        let repeatday = JSON.parse("[" + event.repeatday + "]");
        var now = new Date();
        var todaydate = moment(new Date());
        var todayoccur = todaydate.day()
        let dueon = Date.parse(event.dueon);
        let todayDate = Date.parse(new Date().toDateString());
        let flag = 0;
        var nOccurence = 0;
        task.modifiedON = new Date();  
        if(event.frequency == 2){
          //if(dueon < todayDate){
              var days =  repeatday.sort();
              var todaysDate = moment(event.dueon);
              var oDate = moment(new Date());
              var diffDays = oDate.diff(todaysDate, 'days');
              //console.log('custdate ',oDate+' '+'Today Date '+todaysDate+ ' diffDays ' +diffDays);
             
              for (let i = 0; i <= diffDays; i++) {
               var todays = moment(event.dueon).add(i,'days').format('MM/DD/YYYY'); 
               var date = moment(todays);
               var today = date.day();
               let occur = [];
                for (var index in days) {        
                  var dayINeed = parseInt(days[index]);                  
                  if (this.inArray(today, days)) {
                   
                    if(todayoccur == dayINeed)
                    {
                      console.log('today',todays +' Today occurence '+ today +' DayIndeed '+ dayINeed);
                      nOccurence = 1;
                      var occurence = dayINeed;
                      var duedate = moment().day(occurence).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                      
                    }else{
                      if(todayoccur < dayINeed){
                        var duedate = moment().day(dayINeed).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                        nOccurence = 2;
                      }else{                      
                        var duedate = moment().day(days[0]).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                        nOccurence = 3;
                      }
                    }
                  }
                }
              }
              console.log('duedate',duedate +' occurence '+nOccurence);
            if(flag = 1){
             
              console.log('Completed using Weekly Task');
              task.taskID = taskID;
              task.status = 0;
              task.enddate = this.getHighestTime(event.timelog);
              this.taskService.updateTask(task).subscribe(task => {    
                  event.state = 0;          
                  event.dueon = duedate;
                  this.cloneTasks(event,0,1);
              });         
              return;
            }    
          //}
        }
        else if(event.frequency == 1){
          task.status = 2;
          task.taskID = taskID;
          task.modifiedON = new Date();
          task.enddate = this.getHighestTime(event.timelog);
          if(dueon < todayDate){            
            this.taskService.updateTask(task).subscribe(task => {
                event.state = 1;                  
                event.dueon = moment(new Date()).format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                this.cloneTasks(event,0,1);
            });
            console.log('Task Crated');            
          }else{
            this.taskService.updateTask(task).subscribe(task => {
                event.state = 0;                  
                event.dueon = moment(new Date()).add(1,'days').format('MM/DD/YYYY '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds()+'');
                this.cloneTasks(event,0,1);
            });
            console.log('Task Crated');
          }
          return;
        }
      }  
    }
    task.taskID =taskID;
    task.status = 0;
    task.state = 0;
    task.modifiedON = new Date();
    console.log('Completed Task');
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
        task['dueon'] = moment(new Date()).format("MM/DD/YYYY");
        task['priority'] = 3;
        task['state'] = 0;

        this.taskService
          .addTask(task, { category_id } as any)
          .subscribe(hero => {
            //console.log("Add task sucessfulluy");
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
          });
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    } else {
      //console.log("invlid form");
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
    //console.log(" data ", data);
    if (
      (data.user_signin != undefined && data.user_signin == true) ||
      (data.user_signout != undefined && data.user_signout == true)
    ) {
      this.getCategory();
      this.filter(this.filter_no,0);
      //this.getTasks();
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
    for (let i = 0; i < category.length; i++) {
      let childs = {};
      if (category[i] != "") {
        if (this.cat_name[i] == undefined) {
          //console.log('category data', this.cat_name[i]+' => '+ this.cat_ids[i]);
          this.cat_name[i] = "Unassigned";
        }
        childs["name"] = category[i].label;
        childs["id"] = category[i].value;
        childs["taskID"] = category[i].value;
        childs["color"] = category[i].color;
        childs["childrens"] = this.getChilTask(category[i].value);
        if (childs["childrens"].length > 0) {
          parents.push(childs);
        }
      }
    }
    return parents;
  }
  getChilTask(cate) {
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
        childrens_ids[datas[i].taskID] = child;
        childrens_next_ids[datas[i].taskID] = datas[i].next;
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
    let oldtimeLog:any;
    let taskID:any;
    let taskState:any;
    let status:any;
    oldtimeLog = event.timelog;
    taskID = event.taskID;
    taskState = event.state;
    status = event.status;
    if(progress == 0){

      if(event.frequency!=""){

        let repeatday = JSON.parse("[" + event.repeatday + "]");
        var now = new Date();
        let dueon = Date.parse(event.dueon);
        let todayDate = Date.parse(new Date().toDateString());
        let flag = 0;
        
        if(event.frequency == 2){
          if(dueon < todayDate){
              var days =  repeatday.sort();
              var todaysDate = moment(event.dueon);
              var oDate = moment(new Date());
              var diffDays = oDate.diff(todaysDate, 'days');
              //console.log('custdate ',oDate+' '+'Today Date '+todaysDate+ ' diffDays ' +diffDays);
             
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
                        //console.log('Date ',moment(todays).format('L') +' Days '+ days[index]);
                      }
                    }        
                  }
                }
              }
            if(flag = 1){
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
            console.log('Task Crated');
            return;
          }
          console.log('event',event);          
        }
      }
      console.log('oldtimeLog',event);
    }
    if(count < 5 || taskState == 1){
      //console.log('Count', count);
      let Stime = Number(new Date());
      let Etime = "";
      let timelogData: Array<any> = [
          { "start": Stime, "end": Etime}
      ]; 
      
      let oldIndex = oldtimeLog.length - 1;
      let newIndex = oldtimeLog.length + 1;
      
      var input = {};
      let state = 0;
      if(taskState == 0){
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
      task.timelog = oldtimeLog; 
      task.taskID = taskID;
      task.state = state;
      task.modifiedON = new Date();
      //console.log('task',task);
      this.taskService.updateTask(task).subscribe(task => {
          this.filter(this.filter_no,0);
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
    //$(".alert-success").fadeOut("slow");
    //this.showSelected = !this.showSelected;
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
            var click = 0;
            this.getTasks(click);
          } else {
            this.filter(this.filter_no,0);
          }
        });
    }
  }
  onFinishDelete(event) {
    //console.log("On Delete", event.element.state);
    let task = new Task();
    task["taskID"] = event.element.id;
    if (event.element.state == 0) {
      this.deleteTasks(task, this.filter_no);
    } else {
      $(".msg").html("You can not delete this task!");
      $(".alertmsg").fadeIn("slow");
      $("html, body").animate({ scrollTop: 0 }, "slow");
      //setTimeout(function(){ $('.alertmsg').fadeOut() }, 2000);
    }
  }
  filter(filter,click) {
   
    if (filter == 1) {
      this.getTasks(click);
    }
    if (filter == 2) {
      this.getTasks(click); 
      this.taskService.getTasks().subscribe(tasks => {
        this.priorityFilter(tasks);
      });
    }
    if (filter == 3) {
     this.getTasks(click);
      setTimeout(() => {
        this.when_Duefilter();
      }, 50); 
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
    //console.log('this.priorityTasks',this.priorityTasks);
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
    var myTrees = [];
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
    for (let index in data) {
      let timelog = []; 
      //console.log('current_time_number ', current_time_number +'current_day' + current_day);
      //console.log('Category => ',this.getCategoryName(data[index].categoryID) +' '+data[index].timelog[current_day].start);
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
    //console.log('Data',data);
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
    this.myTrees = data_tree;
    let childrens = [];
    let tadded_category = [];
    let tchild = [];
    /* Today Task */
    for (var i in today_tree) {
      let cateId = today_tree[i].id;
      let chield = [];
      chield = this.getsheduleTask(cateId,'today'); 
      if(chield.length > 0){
        today_tree[i].childrens = "";
        today_tree[i].childrens = chield;
        todaysTasks.push(today_tree[i]);
      }
    } 
    /* Tomorrow Task */
    for (var i in tomorrow_tree) {
      let cateId = tomorrow_tree[i].id;
      let chield = [];
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
    //console.log('nodueTask',nodueTask);
    this.getCalendarTask(this.timesheet_tasks);
  }
  getsheduleTask(cateId,flag){

    var todayDate = new Date().toDateString(); //Today Date         
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString();
    let task = this.tasks;
    if(flag == 'today'){
      let childst = [];
      for (var i in task) {
        if(cateId == task[i].category_id){           
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
        if(cateId == task[i].category_id){
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
        if(cateId == task[i].category_id){
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
        if(cateId == task[i].category_id){
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
  filter_getParentCategory(cateID) {
    let parents = [];
    let category = this.category;
    for (let i = 0; i < category.length; i++) {
      let childs = {};
      if (category[i] != "") {
        if (category[i].value === cateID) {
          //console.log('Name',category[i].label +' Orignal'+ category[i].value);
          childs["name"] = category[i].label;
          childs["id"] = category[i].value;
          childs["childrens"] = this.getChilTask(category[i].value);
          if (childs["childrens"].length > 0) {
            parents.push(childs);
          }
        }
      }
    }
    return parents;
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
      let category = task[index].category_name;
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
            this.filter(this.filter_no,0);
            console.log("call service ", hero);
           // this.getTasks();
        });
    }else{
      this.filter(this.filter_no,0);
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
      if (this.filter_no == 1) {
        var childrens = this.myTree[this.activeNumIndex].childrens;
      }else{
        var childrens = this.myTrees[this.activeNumIndex].childrens;
      }
      if (
        childrens[event.currentIndex] != undefined &&
        childrens[event.previousIndex] != undefined &&
        childrens[event.currentIndex].id != undefined &&
        childrens[event.currentIndex].id != childrens[event.previousIndex].id
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
          childrens,
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
    for (let cat in this.category_lists) {
      cate[this.category_lists[cat]['value']] = this.category_lists[cat]['label'];
    }
    //console.log('Category',cate);
    return cate[cateId];
  }
  getCategoryId(cateName){
    let cate = [];
    for (let cat in this.category_lists) {
      cate[this.category_lists[cat]['label']] = this.category_lists[cat]['value'];
    }
    //console.log('Category',cate);
    return cate[cateName];
  }
  onSelect({ selected }) {

    console.log('Show',selected);
    if(selected.length > 0){
      this.updateDisplay = 1;
    }else{
      this.updateDisplay = 0;
    }
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
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
    var taskID = rowdata.taskID;
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
    task.taskID = rowdata.taskID;
    task.modifiedON = new Date();
    var input = {};
    input["task"] = task;
    console.log('Update',task);
    this.taskService.updateTask(task).subscribe(task => {
    });
    var click = 0;
    this.getTasks(click);
    
    this.sucessMsg = 1;
    this.updateCate = '';
    //console.log('UPDATED!', this.manage_rows[rowIndex][cell]);
  }
  cloneTasks(task,isclone,flag){
    
    let category_id = task.category_id;
    let priority =  task.priority;

    if(flag == 1){
      
      let timeLog = [];
      let Stime = Number(new Date());
      let Etime = "";
      let timelogData: Array<any> = [
          { "start": Stime, "end": Etime}
      ];
      timeLog.push(timelogData[0]);
      task['timelog'] = timeLog;
      this.sucessMsg = 0;
    }else{      
      if(isclone == 1){
        task.modifiedON = new Date();
        this.taskService.archiveTask(task).subscribe(task => {
          //this.filter(this.filter_no,0);
        });
       $(".succssmsg").html("<strong>Success!</strong> Original task has been archived & new created."); 
      }else{
        $(".succssmsg").html("<strong>Success!</strong> Duplicate task has been created."); 
      }
      this.sucessMsg = 1;
      task['name'] = task.name;
      task['priority'] = task.priority;
      task['timelog'] = [];
    }
    //console.log('add Data',task);
    this.taskService.addTask(task, { category_id } as any)
          .subscribe(hero => {
    });
    var click = 0;
    this.getTasks(click);    
  }
  openConfirmDialog(value) { 
    
    this.edittaskForm.controls.task.markAsUntouched({ onlySelf: true });
    this.edittaskForm.controls.task.markAsPristine({ onlySelf: true });
    this.checkedList = [];
    
   if(value!=""){
     
      var dueonDate = []; 
      var setdueonDate = []; 
      let dueonDateVal = 1;
     
      setdueonDate['startDate'] = "";
      setdueonDate['endDate'] = "";

      if(value.setDate == 1){
        setdueonDate['startDate'] = value.dueon;
        setdueonDate['endDate'] =  value.dueon;
        //console.log('setdueonDate', setdueonDate);
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
      let frequency = "";
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
      console.log('dueonDateVal ', dueonDateVal);
      //console.log('repeatday ', value.repeatday);
      
      this.edittaskForm.patchValue({
        task: value.name,
        taskID:value.taskID,
        categoryID:value.category_id,
        priority:priority,
        duration:duration,
        description:value.description,
        dueon: dueonDateVal,
        setdueon: setdueonDate,
        discretionary: discretionary,
        routine: routine,
        frequency:frequency,
        repeatday:repeatday,
        starttime:value.starttime,
      });
      this.tasklable = "Edit Task";
      //console.log('this.edittaskForm ',this.edittaskForm);
    }else{  
      var dueonDate = []; 
      dueonDate['startDate'] = '';
      dueonDate['endDate'] =   '';
       this.tasklable = "Add Task";    
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
        frequency:'',
        repeatday : '',
        starttime : '',
       });
    }
    this.ngxSmartModalService.resetModalData('myBootstrapModal');
    this.ngxSmartModalService.open('myBootstrapModal');
  }
  onSave(){ 

    let duedate = this.edittaskForm.value.dueon;
    // this.edittaskForm.get('task').markAsTouched();
    console.log('Form Value ',this.edittaskForm);

    let setDate = 0;
    let dueon = "";
    let starttime = "";
    let repeatday = "";
    let frequency = this.edittaskForm.value.frequency;
    //console.log('Form Value ', this.edittaskForm.value.frequency);
    if(frequency!=""){
      if(frequency == 1){
        starttime = this.edittaskForm.value.starttime;
      }else if(frequency == 2){
        var weeklynumber = this.checkedList.join();
        repeatday = weeklynumber;
      }else if(frequency == 3){
        repeatday = this.edittaskForm.value.repeatday;
      }
    }
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
    let taskName =  this.edittaskForm.value.task;
    let category_id = this.edittaskForm.value.categoryID;
    let description = this.edittaskForm.value.description;
    let duration = this.edittaskForm.value.duration;
    let priority = this.edittaskForm.value.priority;
    let discretionary = this.edittaskForm.value.discretionary;
    let routine = this.edittaskForm.value.routine;
    if(priority == ""){
      priority = 3;
    }

    let taskID = this.edittaskForm.value.taskID;
    let task = new Task();
    task.name = taskName;
    task.category_id = category_id;  
    task.description = description; 
    task.priority = priority;       
    task.taskID = taskID;
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
    console.log('Input Data',task);
    if (this.edittaskForm.valid) {
      if(taskID!=""){
        this.taskService.updateTask(task).subscribe(task => {
      });
      $(".succssmsg").html("<strong>Success!</strong> Task has been updated.");
      }else{
        task.state = 0;
        this.taskService.addTask(task,{ category_id } as any)
          .subscribe(hero => {
            console.log("Add task sucessfulluy");
        });
        $(".succssmsg").html("<strong>Success!</strong> Task has been added");
    }
     this.sucessMsg = 1; 

    this.ngxSmartModalService.close('myBootstrapModal');
   }else{
      this.validateAllFormFields(this.edittaskForm);
      return;
   }   
   this.checkedList = [];
   var click = 0;
   this.getTasks(click);
  }
  remove() {
   let task = new Task();
   if(this.selected.length > 0){       
     for (let i in this.selected) {        
        if(this.selected[i]['timelog'].length > 0){
          task.taskID = this.selected[i]['taskID'];
          task.status = 2;
          task.modifiedON = new Date();
          var input = {};
          input["task"] = task;
          this.taskService.updateTask(task).subscribe(task => {
          });
          console.log('TimeLog', this.selected[i]['timelog']);  
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
        });
       }
      }      
      $(".succssmsg").html("<strong>Success!</strong> Categroy has been updated.");
      console.log('Category value',value);
      console.log('Type',type);
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
        });
       }
       $(".succssmsg").html("<strong>Success!</strong> Priority has been updated.");
      }
    }
    this.sucessMsg = 1;
    this.selected = [];
    this.updateDisplay = 0;
    var click = 0;
    this.getTasks(click);
    console.log('this.selected', this.selected);
  }
  getwhendue(date,label,setdate){
    
    if(date!=""){
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
}
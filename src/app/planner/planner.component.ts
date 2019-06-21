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
import {
  CdkDragDrop,
  transferArrayItem,
  moveItemInArray
} from "@angular/cdk/drag-drop";

import { OrderBy } from "../util/orderBy.pipe";
import { GroupByPipe } from "../util/group-by.pipe";
import { Task } from "../task";
import { Category } from "../category";
import { Planner } from "../planner";
import { TaskService } from "../services/task.service";
import { PlannerService } from "../services/planner.service";
import { AuthService } from "../services/auth.service"; 
import { EventEmiterService } from "../services/event.emmiter.service";
import { Observable, of } from "rxjs";
import { map, filter, scan,delay } from "rxjs/operators";
import { webSocket } from "rxjs/webSocket";
import { ajax } from "rxjs/ajax";
import { TestScheduler } from "rxjs/testing";
import { Options, ChangeContext } from 'ng5-slider';

import * as $ from 'jquery';

@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.css'],
  providers: [OrderBy, GroupByPipe]
})
export class PlannerComponent implements OnInit {
  public form: FormGroup;
  category_lists: Task[] = [];
  category: any;
  items:any;
  rowId:any;
  row:any;
  data: any;
  editField: string;
  error:any;
  updatedrowList:any;
  totalHours:any;
  summery:any;
  minValue: number = 0;
  maxValue: number = 1439;
  options: Options = {
    floor: 0,
    ceil: 1439,
    step: 15
  };
  tabs: string[] = ['Details','Summary'];
  selectedindex = this.tabs[0];
  validate = 0;

  rowList: Array<any> = [
    { id: 1, name: 'Aurelia Vega', age: 30, companyName: 'Deepends', country: 'Spain', city: 'Madrid' }
  ];
  awaitingRowList: Array<any> = [
    { id: 6, name: 'George Vega', age: 28, companyName: 'Classical', country: 'Russia', city: 'Moscow' },
    { id: 6, name: 'George Vega', age: 28, companyName: 'Classical', country: 'Russia', city: 'Moscow' }
  ];

  constructor(private taskService: TaskService,
    private fb: FormBuilder,
    private plannerservice: PlannerService,
    private authService: AuthService,
    private _eventEmiter: EventEmiterService
    ) {}
  ngOnInit() {
    this.getCategory();
    this.getdatarow();
    this.getUpdateddatarow();
  }
  getCategory(): void {
    this.taskService.getCategory().subscribe(category => {
      this.filterCategroy(category);
    });
  }

  filterCategroy(category) {
    let category_list = [];
    for (let index in category) {
      let cate = category[index];

      category_list.push({
          value: cate.categoryID,
          label: cate.name,
          index: cate.index,
          is_display:(cate.name == "unassinged")? false:true
      });
    }    
    category_list.sort(function(a,b){
      if(a.label < b.label) { return -1; }
      if(a.label > b.label) { return 1; }
      return 0;
    });
    this.category_lists = category_list;
  }
  getdatarow(): void {
    //console.log("get tasks...");
    this.plannerservice.getData().subscribe(planner => {
      //console.log("view not update ", planner);
      this.filterData(planner);
    });
  }
  filterData(data){   
    let cate = [];
    for (let cat in this.category_lists) {
      cate[this.category_lists[cat]['value']] = this.category_lists[cat]['label'];
    }
    for (let index in data) {
        data[index].cate_name = cate[data[index].categoryID];
    }
    data.sort(function(a,b){
       if(a.cate_name < b.cate_name) { return -1; }
       if(a.cate_name > b.cate_name) { return 1; }
        return 0;
    });
    this.rowList = data; 
  }
  getUpdateddatarow(): void {
    this.plannerservice.getData().subscribe(planner => {
      this.updateFilterData(planner);
    });
  }  
  updateFilterData(data){
    let cate = [];
    for (let cat in this.category_lists) {
      cate[this.category_lists[cat]['value']] = this.category_lists[cat]['label'];
    }
    for (let index in data) {
        data[index].cate_name = cate[data[index].categoryID];
    }
    data.sort(function(a,b){
       if(a.cate_name < b.cate_name) { return -1; }
       if(a.cate_name > b.cate_name) { return 1; }
        return 0;
    });
    this.updatedrowList = data;
  }
  onUserChangeStart(changeContext: ChangeContext): void {
    //console.log('onUserChangeStart', changeContext.value);
  }
  onUserChange(event,day,rowid,daynumber){
     
     console.log('event',event + 'rowid' + rowid +' daynumber'+ daynumber);

     var Stime = this.changetime(event.value);
     var Etime = this.changetime(event.highValue);
     if(daynumber == 0){
      $('#sun_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#sun_start_'+rowid).val(event.value);
        $('#sun_end_'+rowid).val(event.highValue);
      }
     }
     if(daynumber == 1){
      $('#mon_'+rowid).html(Stime + ' - '+ Etime);
      if(rowid == 100){
        $('#mon_start_'+rowid).val(event.value);
        $('#mon_end_'+rowid).val(event.highValue);
      }

     }
     if(daynumber == 2){
      $('#tue_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#tue_start_'+rowid).val(event.value);
        $('#tue_end_'+rowid).val(event.highValue);
      }
     }
     if(daynumber == 3){
      $('#wed_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#wed_start_'+rowid).val(event.value);
        $('#wed_end_'+rowid).val(event.highValue);
      }
     }
     if(daynumber == 4){
      $('#thu_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#thu_start_'+rowid).val(event.value);
        $('#thu_end_'+rowid).val(event.highValue);
      }
     }
     if(daynumber == 5){
      $('#fri_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#fri_start_'+rowid).val(event.value);
        $('#fri_end_'+rowid).val(event.highValue);
      }
     }
     if(daynumber == 6){
      $('#sat_'+rowid).html(Stime + ' - '+ Etime); 
      if(rowid == 100){
        $('#sat_start_'+rowid).val(event.value);
        $('#sat_end_'+rowid).val(event.highValue);
      }
     }     
  }
  onUserChangeEnd(event,day,rowid,daynumber,rowID){
    
    var Stime = event.value;
    var Etime = event.highValue;
    var valid = this.checkExistTime(Stime,Etime,daynumber,rowID); 
    this.validate = valid;     
    if(valid == 0 && rowID != 100){
      
      if (rowid >= 0) {      
        var timelog : Array<any> = [
        { "start": Stime, "end": Etime}]; 

        var dayIndex = daynumber;
        var cate_id = $('#cat_'+rowid+'').val();
        if(cate_id == 'Select Category'){
          cate_id = "";
        }       
        if (this.authService.isAuthenticate()) {
          this.plannerservice.updateData({rowID} as Planner,{ timelog } as any,dayIndex as any,cate_id as any).subscribe(hero => {
            console.log("Add Data sucessfulluy");
             this.getUpdateddatarow();
          });
        } else {
          this._eventEmiter.sendMessage({ signin: true });
        }
    }
   }
  }  
  rangeValueChanged(event, start:any, end:any,day) {
    var hours1 : any;
    var minutes1 : any;
    var str = event.id;
     
     var rows_ID = $('#'+str).parent().parent().attr("id");
     
    var numberOnly= str.replace(/^\D+/g, '');
    var rowid = parseInt(numberOnly);
    //console.log('lenght -> ', rowid);
    var time_str = this.changetime($('#no_val-start-value').val());
    console.log("time_str ",time_str);
    
    if (rowid >= 0) {
    
    var mon_start_value = $('#range_mon_'+rowid+'-start-value').val();
    var mon_end_value = $('#range_mon_'+rowid+'-end-value').val();
    
    var tue_start_value = $('#range_tue_'+rowid+'-start-value').val();
    var tue_end_value = $('#range_tue_'+rowid+'-end-value').val();

    var wed_start_value = $('#range_wed_'+rowid+'-start-value').val();
    var wed_end_value = $('#range_wed_'+rowid+'-end-value').val();

    var thu_start_value = $('#range_thu_'+rowid+'-start-value').val();
    var thu_end_value = $('#range_thu_'+rowid+'-end-value').val();

    var fri_start_value = $('#range_fri_'+rowid+'-start-value').val();
    var fri_end_value = $('#range_fri_'+rowid+'-end-value').val();

    var sat_start_value = $('#range_sat_'+rowid+'-start-value').val();
    var sat_end_value = $('#range_sat_'+rowid+'-end-value').val();

    var sun_start_value = $('#range_sun_'+rowid+'-start-value').val();
    var sun_end_value = $('#range_sun_'+rowid+'-end-value').val();
    
    if(day == 0){
      var timelog : Array<any> = [
       { "start": mon_start_value, "end": mon_end_value}
      ]; 
    }
    if(day == 1){
      var timelog : Array<any> = [
       { "start": tue_start_value, "end": tue_end_value}
      ];
    }
    if(day == 2){
      var timelog : Array<any> = [
       { "start": wed_start_value, "end": wed_end_value}
      ];
    }
    if(day == 3){
      var timelog : Array<any> = [
       { "start": thu_start_value, "end": thu_end_value}
      ];
    }
    if(day == 4){
      var timelog : Array<any> = [
       { "start": fri_start_value, "end": fri_end_value}
      ];
    }
    if(day == 5){
      var timelog : Array<any> = [
       { "start": sat_start_value, "end": sat_end_value}
      ];
    }
    if(day == 6){
      var timelog : Array<any> = [
       { "start": sun_start_value, "end": sun_end_value}
      ];
    }
    var dayIndex = day;
    var cate_id = $('#cat_'+rowid+'').val();
    console.log('Category', cate_id);
    if(cate_id == 'Select Category'){
      cate_id = "";
    }
    var time_str = this.changetime(timelog[0]['end']);
    //console.log("time_str ",time_str);
      if (this.authService.isAuthenticate()) {
        var rowID = rows_ID;
        this.plannerservice.updateData({rowID} as Planner,{ timelog } as any,dayIndex as any,cate_id as any).subscribe(hero => {
          console.log("Add Data sucessfulluy");
        });
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    } else {
      console.log("please login first");
    }
  }
  getElement(data){
      if (typeof(data)=='string') {
          return document.getElementById(data);
      }
      if (typeof(data)=='object' && data instanceof Element) {
          return data;
      }
      return null;
  }
  addItem(event,rowid) {
    if(this.validate == 0){
    var cate_id = $('#cat_'+rowid+'').val();
    if(cate_id == 'Select Category' || cate_id == "" ){
      $('#msg').fadeIn();
      $('#msg').html('Please Select Category');
      return;
    }else{
      var sun_start = $('#sun_start_'+rowid).val();
      var sun_end = $('#sun_end_'+rowid).val();      
      var mon_start = $('#mon_start_'+rowid).val();
      var mon_end = $('#mon_end_'+rowid).val();      
      var tue_start = $('#tue_start_'+rowid).val();
      var tue_end = $('#tue_end_'+rowid).val();      
      var wed_start = $('#wed_start_'+rowid).val();
      var wed_end = $('#wed_end_'+rowid).val();      
      var thu_start = $('#thu_start_'+rowid).val();
      var thu_end = $('#thu_end_'+rowid).val();      
      var fri_start = $('#fri_start_'+rowid).val();
      var fri_end = $('#fri_end_'+rowid).val();
      var sat_start = $('#sat_start_'+rowid).val();
      var sat_end = $('#sat_end_'+rowid).val();
        
      var timelog : Array<any> = [        
        { "start": mon_start, "end": mon_end},
        { "start": tue_start, "end": tue_end},
        { "start": wed_start, "end": wed_end},
        { "start": thu_start, "end": thu_end},
        { "start": fri_start, "end": fri_end},
        { "start": sat_start, "end": sat_end},
        { "start": sun_start, "end": sun_end},
        ];
      if (this.authService.isAuthenticate()) {
        var rowID = "";      
        this.plannerservice.addRow({rowID} as Planner,{ timelog } as any,cate_id as any).subscribe(hero => {
          console.log('Add Daata');
        });      
        setTimeout(() => {
          this.getdatarow();
        }, 500);
        this.getUpdateddatarow();
      } else {
        this._eventEmiter.sendMessage({ signin: true });
      }
    } 
   }
  }
  checkExistTime(Stime,Etime,daynumber,rowID){
        //console.log(daynumber);
        this.getUpdateddatarow();
        let starttime = Stime;
        let endtime = Etime;
        var timeDiff = endtime - starttime;
       
        var total_slot = timeDiff / 15;  
        var cate = [];    
        let rowData = this.updatedrowList;
        for (let cat in this.category_lists) {
          cate[this.category_lists[cat]['value']] = this.category_lists[cat]['label'];
        }
        let j = 1;
        let rowindexval = '';
        var error = 0;
        for (let i = 0; i < total_slot; i++) {
            var total_slot_val = j * 15;
            var start = starttime; 
            var end = parseInt(start) + total_slot_val;
            //console.log('Value',start +' END '+ end);
            
            var mon_value = "";
            if(error == 0){
            for (let index in rowData) {
              mon_value = rowData[index].timelog[daynumber];
              if(rowID != rowData[index].rowID){               
                if(start < mon_value['start'] && start > mon_value['end']){
                  var error = 1;
                  var cat_name = cate[rowData[index].categoryID];
                // console.log('Row Data1', rowData[index].rowID); 
                 rowindexval =  rowData[index].rowID;    
                }else if(end > mon_value['start'] && end < mon_value['end']){
                  var error = 1;
                  var cat_name = cate[rowData[index].categoryID];
                  //console.log('Row Data2', rowData[index].rowID);
                  rowindexval =  rowData[index].rowID
                }
              }     
            }
           }
          j++;
        }
        if(error == 1){
          //$('#msg').fadeIn("slow");
          $(".alertmsg").fadeIn("slow");
          $(".highlight").removeClass("highlight");
          $('#'+ rowindexval).addClass('highlight');
          $('#msg').html(cat_name+' Time Already Exists');
          $('html, body').animate({
              scrollTop: "0px"
          }, 800);
        }else{     
           $(".highlight").removeClass("highlight");
            $(".alertmsg").fadeOut(1000);
        }
        return error;
  }
  remove(id: Planner) {
      //alert(id); 
      if(confirm("Are you sure to delete?")) {
        $('#'+id.rowID).remove(); 
        this.plannerservice.deleterow(id as Planner).subscribe(hero => {
          console.log("Remove Data sucessfulluy");
        });
      } 
  }
  changetime(number){
                
      var hours1;
      var minutes1;
      var val = 0;
      if(number < 0){
          val = 0;
      }else{
          val = number;
      }
      hours1 = Math.floor(val / 60);
      minutes1 = val - (hours1 * 60);

      //if (hours1 <= 9) hours1 = '0' + hours1;
      if (minutes1 < 9) minutes1 = '0' + minutes1;
      if (minutes1 == 0) minutes1 = '00';

      if (hours1 >= 12) {
        //console.log('Hours => ',hours1);
          if (hours1 == 12) {
              hours1 = hours1;
              minutes1 = minutes1 + " PM";
          } else {
               if (hours1 == 24) {
                  hours1 = hours1 - 13;
                  if (minutes1 == 0) minutes1 = '59';
               }else{
                hours1 = hours1 - 12;
               }
              
              minutes1 = minutes1 + " PM";
          }
      } else {           
          if (hours1 == 0 && minutes1 == 0) {
                hours1 = 12;
                minutes1 = "00" + " AM";
          }else{
              minutes1 = minutes1 + " AM";
          }
          if (hours1 == 0){
             hours1 = 12;
          }
      }   
      if (hours1 <= 9) hours1 = '0' + hours1;   
      return hours1+':'+minutes1;
  }
  plannerSummery(tab){
  
    if(tab == 'Summary'){
      this.selectedindex = this.tabs[1];
      
      let rowData = this.updatedrowList;
      let rowsData = {};
      let rowssData = [];
      let catewiseTimeLog = [];
      let data = [];
      //console.log(rowData);
      let cate = [];
      for (let cat in this.category_lists) {
        cate[this.category_lists[cat]['value']] = this.category_lists[cat]['label'];
      }
      for (let index in rowData) {
       data[rowData[index].categoryID] = rowData[index].categoryID;
      }
      for (let j in data) {
        rowssData[cate[j]] = [];
        for (let index in rowData) { 
            if(j == rowData[index].categoryID){
              rowssData[cate[j]].push(rowData[index].timelog);
            }
        } 
      }
      for (let j in rowssData) {
        let newdata = rowssData[j];         
        let cat_name = j;
        catewiseTimeLog[j] = [];
        catewiseTimeLog[j]['sun'] = [];
        catewiseTimeLog[j]['mon'] = [];
        catewiseTimeLog[j]['tue'] = [];
        catewiseTimeLog[j]['wed'] = [];
        catewiseTimeLog[j]['thu'] = [];
        catewiseTimeLog[j]['fri'] = [];
        catewiseTimeLog[j]['sat'] = [];
        
        let sun_hours = 0;
        let mon_hour = 0;
        let tue_hour = 0;
        let wed_hour = 0;
        let thu_hour = 0;
        let fri_hour = 0;
        let sat_hour = 0;
        let sun_minute = 0;
        let mon_minute = 0;
        let tue_minute = 0;
        let wed_minute = 0;
        let thu_minute = 0;
        let fri_minute = 0; 
        let sat_minute = 0;
        for (let i in newdata) {
           sun_hours += newdata[i][6].end-newdata[i][6].start;           
           catewiseTimeLog[j]['sun'] = sun_hours; 
           mon_hour += newdata[i][0].end-newdata[i][0].start;           
           catewiseTimeLog[j]['mon'] = mon_hour;
           tue_hour += newdata[i][1].end-newdata[i][1].start;           
           catewiseTimeLog[j]['tue'] = tue_hour;
           wed_hour += newdata[i][2].end-newdata[i][2].start;           
           catewiseTimeLog[j]['wed'] = wed_hour;
           thu_hour += newdata[i][3].end-newdata[i][3].start;           
           catewiseTimeLog[j]['thu'] = thu_hour;
           fri_hour += newdata[i][4].end-newdata[i][4].start;           
           catewiseTimeLog[j]['fri'] = fri_hour;
           sat_hour += newdata[i][5].end-newdata[i][5].start;           
           catewiseTimeLog[j]['sat'] = sat_hour;
        }        
        }         
        let c = 0;
        let rowdata = [];
        let datas = [];
        for (let i in catewiseTimeLog) {      
          rowdata[c] = [];   
          rowdata[c].push(i);
          rowdata[c].push(catewiseTimeLog[i]);
          c++;
        }
        let sun_hours = 0;
        let mon_hours = 0;
        let tue_hours = 0;
        let wed_hours = 0;
        let thu_hours = 0;
        let fri_hours = 0;
        let sat_hours = 0;
        let total_hours = [];
        for (let i in rowdata) {

          sun_hours += rowdata[i][1]['sun'];
          mon_hours += rowdata[i][1]['mon'];
          tue_hours += rowdata[i][1]['tue'];
          wed_hours += rowdata[i][1]['wed'];
          thu_hours += rowdata[i][1]['thu'];
          fri_hours += rowdata[i][1]['fri'];
          sat_hours += rowdata[i][1]['sat'];

          //catewiseTimeLog[j]['sun'] = sun_hours;             
        }
        total_hours[0] = [];
        total_hours[0].push(sun_hours);
        total_hours[0].push(mon_hours);
        total_hours[0].push(tue_hours);
        total_hours[0].push(wed_hours);
        total_hours[0].push(thu_hours);
        total_hours[0].push(fri_hours);
        total_hours[0].push(sat_hours);
      this.totalHours = total_hours;
      //console.log('totalHours',total_hours);
      this.summery = rowdata;
    }else{
      this.selectedindex = this.tabs[0];
      this.getdatarow();
    } 
  } 
  timeConvert(n) {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    return rhours + "." + rminutes;
  }
  getCategoryName(cateId){
    let cate = [];
    for (let cat in this.category_lists) {
      cate[this.category_lists[cat]['categoryID']] = this.category_lists[cat]['name'];
    }
    return cate[cateId];
  }
  hide_msg() {
    $(".alertmsg").fadeOut("slow");
  }
} 

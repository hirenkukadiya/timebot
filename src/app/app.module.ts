import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule,HTTP_INTERCEPTORS  } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { SignupComponent } from "./signup/signup.component";
import { SigninComponent } from "./signin/signin.component";
import { EventEmiterService } from "./services/event.emmiter.service";
import { TokenInterceptor } from "./auth/token.interceptor";
import { SortablejsModule } from "angular-sortablejs";
import { OrderBy } from "./util/orderBy.pipe";
import { ListsComponent } from './lists/lists.component';
import { CategoryComponent } from './category/category.component';
import { RowsComponent } from './rowsplanner/rows.component';
import { PlannerComponent } from './planner/planner.component'; 
import { GroupByPipe } from './util/group-by.pipe';
import { Ng5SliderModule } from 'ng5-slider';
import {DayPilotModule} from "daypilot-pro-angular";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {MatTabsModule,MatExpansionModule} from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxSmartModalModule, NgxSmartModalService } from 'ngx-smart-modal';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TreeModule } from 'angular-tree-component';
import { TreeviewModule } from 'ngx-treeview';
import { ActionComponent } from './action/action.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TaskmodalComponent } from './taskmodal/taskmodal.component';
import { CategorymodalComponent } from './categorymodal/categorymodal.component';
import {AutocompleteLibModule} from 'angular-ng-autocomplete';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminComponent } from './admin/admin.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SignupComponent,
    SigninComponent,
    OrderBy,
    ListsComponent,
    CategoryComponent,
    GroupByPipe,
    PlannerComponent,
    RowsComponent,
    ActionComponent,
    TaskmodalComponent,
    CategorymodalComponent,
    AdminComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'}),
    SortablejsModule,
    BrowserAnimationsModule,
    DragDropModule,
    Ng5SliderModule,
    DayPilotModule,
    MatExpansionModule,
    MatTabsModule,
    NgxDatatableModule,
    NgxSmartModalModule.forRoot(),
    NgxDaterangepickerMd.forRoot(),
    TreeModule.forRoot(),
    TreeviewModule.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    AutocompleteLibModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [EventEmiterService,{
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule {}

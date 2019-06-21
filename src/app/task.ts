export class Task {
  _id: number;
  taskID: string;
  name: string;
  index: number;
  active: boolean;
  status: number;
  priority: number;
  category_id: number;
  category_name: string;
  previous: string;
  next: string;
  timelog:any;
  taskData:any;
  state: number;
  description: string;
  duration: number;
  dueon: string;
  setDate: number;
  discretionary: boolean;
  routine: boolean;
  frequency:number;
  repeatday:string;
  starttime:string;
  modifiedON:any;
  enddate:any;
}

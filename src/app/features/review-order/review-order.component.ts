import {Component,ChangeDetectionStrategy,computed,inject,OnInit,signal,ElementRef,HostListener} from '@angular/core';
import {Router,RouterLink} from '@angular/router';
import {DatePipe,TitleCasePipe} from '@angular/common';
import {PatientFlowService} from '../../core/services/patient-flow.service';
import {WorkflowStepperComponent,WorkflowStep} from '../../shared/components/workflow-stepper/workflow-stepper.component';
import { PatientCardComponent } from '../../shared/components/patient-card/patient-card.component';
@Component({selector:'app-review-order',standalone:true,imports:[RouterLink,TitleCasePipe,DatePipe,WorkflowStepperComponent,PatientCardComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./review-order.component.html',styleUrl:'./review-order.component.css'})
export class ReviewOrderComponent implements OnInit{
 protected readonly flow=inject(PatientFlowService);private readonly router=inject(Router);private readonly elementRef=inject(ElementRef<HTMLElement>);saving=signal(false);
 alertsOpen=signal(false);
 alertFilter=signal<'all'|'action'|'warning'|'info'>('all');
 alertItems=computed(()=>{const items:{id:string,title:string,message:string,severity:'action'|'warning'|'info',icon:string}[]=[];if(this.hasFastingRequirement())items.push({id:'fasting-confirmation',title:'Fasting confirmation required',message:'Confirm whether the patient has fasted for 8–10 hours before collection.',severity:'action',icon:'ti-alert-triangle'});for(const [index,note] of this.preparationNotes().filter(n=>!/fasting/i.test(n)).entries())items.push({id:'prep-'+index,title:'Preparation instruction',message:note,severity:'warning',icon:'ti-alert-triangle'});if(this.flow.priority()==='stat')items.push({id:'stat-processing',title:'STAT processing selected',message:'Process this order immediately and notify the responsible team.',severity:'action',icon:'ti-bolt'});return items;});
 filteredAlerts=computed(()=>this.alertItems().filter(item=>this.alertFilter()==='all'||item.severity===this.alertFilter()));

 protected readonly workflowSteps:WorkflowStep[]=[{label:'Register',icon:'ti-user-plus'},{label:'Test Order',icon:'ti-test-pipe'},{label:'Review Order',icon:'ti-clipboard-check'},{label:'Billing',icon:'ti-receipt'}];protected readonly workflowActiveIndex=2;
 protected readonly priorities=[{value:'routine' as const,label:'Routine',hint:'Normal queue',icon:'ti-list-check'},{value:'urgent' as const,label:'Urgent',hint:'Priority queue',icon:'ti-clock-bolt'},{value:'stat' as const,label:'STAT',hint:'Immediate',icon:'ti-bolt'}];
 get patient(){return this.flow.patient();}
 ngOnInit():void{if(!this.flow.patient())this.router.navigate(['/dashboard/registration']);}
 get patientInitials():string{const p=this.patient;return p?(p.firstName[0]+p.lastName[0]).toUpperCase():'?';}
 specimenGroups=computed(()=>{const groups=new Map<string,{tube:string,sample:string,tests:string[]}>();for(const t of this.flow.selectedTests()){const key=t.tubeType;const g=groups.get(key)??{tube:key,sample:t.sampleType,tests:[]};g.tests.push(t.id);groups.set(key,g);}return [...groups.values()];});
 preparationNotes=computed(()=>[...new Set(this.flow.selectedTests().map(t=>t.prep).filter(p=>p&&p!=='None'))]);
 hasFastingRequirement():boolean{return this.preparationNotes().some(n=>/fasting/i.test(n));}
 countAlerts(severity:'action'|'warning'|'info'):number{return this.alertItems().filter(item=>item.severity===severity).length;}
 toggleAlerts():void{this.alertsOpen.update(open=>!open);}
 closeAlerts():void{this.alertsOpen.set(false);}
 setAlertFilter(filter:'all'|'action'|'warning'|'info'):void{this.alertFilter.set(filter);}
 @HostListener('document:click',['$event']) onDocumentClick(event:MouseEvent):void{if(this.alertsOpen()&&!this.elementRef.nativeElement.querySelector('.alert-popover-host')?.contains(event.target as Node))this.closeAlerts();}
 @HostListener('document:keydown.escape') onEscape():void{this.closeAlerts();}
 removeTest(testId:string,testName:string):void{if(!window.confirm('Remove '+testName+' from this order?'))return;this.flow.toggleTest(testId);}
 continueToBilling():void{if(!this.flow.selectedTests().length||this.saving())return;this.saving.set(true);setTimeout(()=>{this.saving.set(false);this.router.navigate(['/dashboard/billing']);},350);}
}
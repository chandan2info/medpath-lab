import {Component,ChangeDetectionStrategy,computed,inject,OnInit,signal} from '@angular/core';
import {Router,RouterLink} from '@angular/router';
import {DatePipe,TitleCasePipe} from '@angular/common';
import {PatientFlowService} from '../../core/services/patient-flow.service';
import {WorkflowStepperComponent,WorkflowStep} from '../../shared/components/workflow-stepper/workflow-stepper.component';
@Component({selector:'app-review-order',standalone:true,imports:[RouterLink,TitleCasePipe,DatePipe,WorkflowStepperComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./review-order.component.html',styleUrl:'./review-order.component.css'})
export class ReviewOrderComponent implements OnInit{
 protected readonly flow=inject(PatientFlowService);private readonly router=inject(Router);saving=signal(false);
 protected readonly workflowSteps:WorkflowStep[]=[{label:'Register',icon:'ti-user-plus'},{label:'Test Order',icon:'ti-test-pipe'},{label:'Review Order',icon:'ti-clipboard-check'},{label:'Billing',icon:'ti-receipt'}];protected readonly workflowActiveIndex=2;
 protected readonly priorities=[{value:'routine' as const,label:'Routine',hint:'Normal queue',icon:'ti-list-check'},{value:'urgent' as const,label:'Urgent',hint:'Priority queue',icon:'ti-clock-bolt'},{value:'stat' as const,label:'STAT',hint:'Immediate',icon:'ti-bolt'}];
 get patient(){return this.flow.patient();}
 ngOnInit():void{if(!this.flow.patient())this.router.navigate(['/dashboard/registration']);}
 get patientInitials():string{const p=this.patient;return p?(p.firstName[0]+p.lastName[0]).toUpperCase():'?';}
 specimenGroups=computed(()=>{const groups=new Map<string,{tube:string,sample:string,tests:string[]}>();for(const t of this.flow.selectedTests()){const key=t.tubeType;const g=groups.get(key)??{tube:key,sample:t.sampleType,tests:[]};g.tests.push(t.id);groups.set(key,g);}return [...groups.values()];});
 preparationNotes=computed(()=>[...new Set(this.flow.selectedTests().map(t=>t.prep).filter(p=>p&&p!=='None'))]);
 hasFastingRequirement():boolean{return this.preparationNotes().some(n=>/fasting/i.test(n));}
 continueToBilling():void{if(!this.flow.selectedTests().length||this.saving())return;this.saving.set(true);setTimeout(()=>{this.saving.set(false);this.router.navigate(['/dashboard/billing']);},350);}
}
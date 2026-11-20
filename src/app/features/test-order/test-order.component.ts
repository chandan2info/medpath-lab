// Test selection page. Review and final confirmation live on a separate screen.
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabTest, TestPackage } from '../../shared/models/lis.models';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';

const CATEGORY_ICON: Record<string,string> = { All:'ti-apps', Haematology:'ti-droplet', Biochemistry:'ti-flask', Endocrinology:'ti-activity', Urine:'ti-droplet-half-2' };
@Component({selector:'app-test-order',standalone:true,imports:[RouterLink,FormsModule,TitleCasePipe,DatePipe,WorkflowStepperComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./test-order.component.html',styleUrl:'./test-order.component.css'})
export class TestOrderComponent implements OnInit {
  protected readonly flow=inject(PatientFlowService);
  private readonly router=inject(Router);
  @ViewChild('searchInput') searchInputRef?:ElementRef<HTMLInputElement>;
  protected readonly workflowSteps:WorkflowStep[]=[{label:'Register',icon:'ti-user-plus'},{label:'Test Order',icon:'ti-test-pipe'},{label:'Review Order',icon:'ti-clipboard-check'},{label:'Billing',icon:'ti-receipt'}];
  protected readonly workflowActiveIndex=1;
  protected readonly categoryIcon=CATEGORY_ICON;
  testQuery=signal(''); activeCategory=signal('All'); packagesVisible=signal(false); showRecent=signal(false); showFavorites=signal(false);
  savingDraft=signal(false); draftSaved=signal(false); highlightedIndex=signal(-1);
  filteredTests=computed(()=>{const q=this.testQuery().toLowerCase();const c=this.activeCategory();return this.flow.allTests.filter(t=>(c==='All'||t.category===c)&&(t.name.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)));});
  get patient(){return this.flow.patient();}
  ngOnInit():void{if(!this.flow.patient())this.router.navigate(['/dashboard/registration']);}
  get hasTests():boolean{return this.flow.selectedIds().size>0;}
  isSelected(id:string):boolean{return this.flow.selectedIds().has(id);}
  toggle(t:LabTest):void{this.flow.toggleTest(t.id);}
  categoryCount(cat:string):number{return cat==='All'?this.flow.allTests.length:this.flow.allTests.filter(t=>t.category===cat).length;}
  clearSearch():void{this.testQuery.set('');this.highlightedIndex.set(-1);}
  addPackage(pkg:TestPackage):void{for(const id of pkg.testIds)if(!this.flow.selectedIds().has(id))this.flow.toggleTest(id);}
  packagePrice(pkg:TestPackage):number{return pkg.testIds.reduce((s,id)=>s+(this.flow.allTests.find(t=>t.id===id)?.price??0),0);}
  packageTestNames(pkg:TestPackage):string{return pkg.testIds.map(id=>this.flow.allTests.find(t=>t.id===id)?.id??id).join(' + ');}
  testIcon(t:LabTest):string{switch(t.category){case 'Haematology':return 'ti-droplet';case 'Biochemistry':return 'ti-flask-2';case 'Endocrinology':return 'ti-activity';case 'Urine':return 'ti-test-pipe';default:return 'ti-microscope';}}
  goToReview():void{if(this.hasTests)this.router.navigate(['/dashboard/review-order']);}
  saveDraft():void{if(this.savingDraft())return;this.savingDraft.set(true);this.draftSaved.set(false);setTimeout(()=>{this.savingDraft.set(false);this.draftSaved.set(true);setTimeout(()=>this.draftSaved.set(false),1800);},350);}
  get patientInitials():string{const p=this.patient;return p?(p.firstName[0]+p.lastName[0]).toUpperCase():'?';}
  patientAgeBreakdown():string{return this.patient?this.flow.formatAgeBreakdown(this.patient.dob):'';}
  @HostListener('document:keydown',['$event']) onKeydown(e:KeyboardEvent):void{
    const target=e.target as HTMLElement;const typing=!!target&&['INPUT','TEXTAREA','SELECT'].includes(target.tagName);const mod=e.ctrlKey||e.metaKey;
    if(mod&&e.key.toLowerCase()==='f'){e.preventDefault();this.searchInputRef?.nativeElement.focus();return;}
    if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();this.saveDraft();return;}
    if(mod&&e.key==='Enter'){e.preventDefault();this.goToReview();return;}
    if(e.key==='ArrowDown'){e.preventDefault();this.highlightedIndex.update(i=>Math.min(i+1,this.filteredTests().length-1));return;}
    if(e.key==='ArrowUp'){e.preventDefault();this.highlightedIndex.update(i=>Math.max(i-1,0));return;}
    if(e.key==='Enter'&&!typing){const t=this.filteredTests()[this.highlightedIndex()];if(t){e.preventDefault();this.toggle(t);}}
    if(e.key==='Escape'&&typing)this.clearSearch();
  }
}
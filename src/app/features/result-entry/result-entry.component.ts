import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, NgStyle } from '@angular/common';
import { ResultParameter, ResultFlag } from '../../shared/models/lis.models';

interface ParamRow extends ResultParameter {
  editing: boolean;
}

const KFT_PARAMS: ParamRow[] = [
  { id:'cr',  name:'Serum creatinine',      value:'2.4',  unit:'mg/dL',  refLow:0.7, refHigh:1.3,  refLabel:'0.7 – 1.3',  flag:'high',     editing:false },
  { id:'bun', name:'Blood urea nitrogen',   value:'48',   unit:'mg/dL',  refLow:7,   refHigh:20,   refLabel:'7 – 20',     flag:'high',     editing:false },
  { id:'k',   name:'Serum potassium (K⁺)',  value:'6.8',  unit:'mEq/L',  refLow:3.5, refHigh:5.0,  refLabel:'3.5 – 5.0',  flag:'critical', editing:false },
  { id:'na',  name:'Serum sodium (Na⁺)',    value:'138',  unit:'mEq/L',  refLow:136, refHigh:145,  refLabel:'136 – 145',  flag:'normal',   editing:false },
  { id:'ua',  name:'Serum uric acid',       value:'5.2',  unit:'mg/dL',  refLow:3.5, refHigh:7.2,  refLabel:'3.5 – 7.2',  flag:'normal',   editing:false },
  { id:'egfr',name:'eGFR (CKD-EPI)',        value:'32',   unit:'mL/min', refLow:60,  refHigh:null, refLabel:'≥ 60',       flag:'low',      editing:false },
];

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [RouterLink, NgClass, NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './result-entry.component.html',
    styleUrl: './result-entry.component.css',
})
export class ResultEntryComponent {
  protected readonly tabs = ['KFT (Kidney function)', 'Urine R/M', 'Haematology'];
  activeTab = signal('KFT (Kidney function)');
  params = signal<ParamRow[]>([...KFT_PARAMS]);

  hasCritical = computed(() => this.params().some(p => p.flag === 'critical'));
  enteredCount = computed(() => this.params().filter(p => p.value !== '').length);
  pct = computed(() => Math.round(this.enteredCount() / this.params().length * 100));
  normalCount  = computed(() => this.params().filter(p => p.flag === 'normal').length);
  abnCount     = computed(() => this.params().filter(p => p.flag === 'high' || p.flag === 'low').length);
  critCount    = computed(() => this.params().filter(p => p.flag === 'critical').length);

  evalFlag(i: number): void {
    this.params.update(rows => {
      const updated = [...rows];
      const p = { ...updated[i] };
      const v = parseFloat(p.value);
      if (isNaN(v)) { p.flag = 'normal'; }
      else if (p.id === 'k' && v > 6.0) { p.flag = 'critical'; }
      else if (p.refHigh !== null && v > p.refHigh) { p.flag = 'high'; }
      else if (p.refLow !== null && v < p.refLow)   { p.flag = 'low';  }
      else { p.flag = 'normal'; }
      updated[i] = p;
      return updated;
    });
  }

  updateValue(i: number, value: string): void {
    this.params.update(rows => {
      const updated = [...rows];
      updated[i] = { ...updated[i], value };
      return updated;
    });
    this.evalFlag(i);
  }

  flagLabel(f: ResultFlag): string {
    return { normal:'Normal', high:'High', low:'Low', critical:'Critical' }[f] ?? f;
  }
}

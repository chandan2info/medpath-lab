import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabTest, PaymentMode } from '../../shared/models/lis.models';

const ALL_TESTS: LabTest[] = [
  { id:'CBC', name:'CBC — Complete blood count', category:'Haematology',  price:200, tatHours:4 },
  { id:'ESR', name:'ESR',                         category:'Haematology',  price:80,  tatHours:2 },
  { id:'GLU', name:'Blood glucose (fasting)',      category:'Biochemistry', price:120, tatHours:2 },
  { id:'HBA', name:'HbA1c',                       category:'Biochemistry', price:400, tatHours:4 },
  { id:'LFT', name:'Liver function test',          category:'Biochemistry', price:550, tatHours:6 },
  { id:'KFT', name:'Kidney function test',         category:'Biochemistry', price:500, tatHours:6 },
  { id:'LIP', name:'Lipid profile',                category:'Biochemistry', price:450, tatHours:6 },
  { id:'TSH', name:'TSH',                          category:'Endocrinology',price:350, tatHours:6 },
  { id:'URI', name:'Urine routine & microscopy',   category:'Urine',        price:100, tatHours:2 },
];

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent {
  protected readonly steps = [
    {n:1,label:'Patient'},{n:2,label:'Select tests'},{n:3,label:'Payment'},{n:4,label:'Receipt & samples'}
  ];
  protected readonly cats = ['All','Haematology','Biochemistry','Endocrinology','Urine'];
  protected readonly payModes = [
    {id:'cash'   as PaymentMode, icon:'cash',        label:'Cash'},
    {id:'upi'    as PaymentMode, icon:'qrcode',      label:'UPI'},
    {id:'card'   as PaymentMode, icon:'credit-card', label:'Card'},
    {id:'credit' as PaymentMode, icon:'clock',       label:'Credit'},
  ];

  activeCat   = 'All';
  query       = '';
  discountPct = 0;
  activeStep  = signal(2);
  payMode     = signal<PaymentMode>('cash');
  private _sel = signal(new Set<string>(['CBC','LFT','URI']));

  filteredTests = computed(() => {
    const q = this.query.toLowerCase();
    return ALL_TESTS.filter(t =>
      (this.activeCat === 'All' || t.category === this.activeCat) &&
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  });
  selectedTests = computed(() => ALL_TESTS.filter(t => this._sel().has(t.id)));
  selected      = computed(() => this._sel());
  subtotal      = computed(() => this.selectedTests().reduce((a, t) => a + t.price, 0));
  discAmt       = computed(() => Math.round(this.subtotal() * this.discountPct / 100));
  grandTotal    = computed(() => this.subtotal() - this.discAmt());

  toggle(id: string): void {
    this._sel.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  nextStep(): void {
    if (this.activeStep() < this.steps.length) this.activeStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.activeStep() > 1) this.activeStep.update(s => s - 1);
  }
}

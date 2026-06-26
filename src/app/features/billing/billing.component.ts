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
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Billing</h1>
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb">
            <li><a routerLink="/dashboard/home">Home</a></li>
            <li aria-current="page">New invoice</li>
          </ol>
        </nav>
      </div>
      <span class="lis-mono" style="font-size:13px;margin-top:4px">INV-2406-0092</span>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      @for (s of steps; track s.n) {
        <div class="step" [class.step--done]="s.n < 2" [class.step--active]="s.n === 2">
          <div class="step-num">
            @if (s.n < 2) { <i class="ti ti-check"></i> } @else { {{s.n}} }
          </div>
          <span class="step-label">{{s.label}}</span>
        </div>
        @if (s.n < steps.length) { <i class="ti ti-chevron-right step-arrow"></i> }
      }
    </div>

    <div class="bill-layout">
      <!-- Left: patient + tests -->
      <div class="bill-main">
        <!-- Patient card -->
        <div class="lis-card">
          <div class="lis-card__header">
            <i class="ti ti-user" style="color:var(--lis-primary,#1D9E75);font-size:15px"></i>
            <h2 class="lis-card__title">Patient</h2>
            <span class="lis-badge"><i class="ti ti-check" style="font-size:10px"></i> Confirmed</span>
          </div>
          <div class="form-grid lis-card__body">
            <div class="lis-field"><label>Name</label><input value="Kavitha Nair" readonly /></div>
            <div class="lis-field"><label>Patient ID</label><input value="PAT-2406-0318" readonly class="lis-mono" style="font-size:11px" /></div>
            <div class="lis-field"><label>Age / Sex</label><input value="34 yrs / Female" readonly /></div>
            <div class="lis-field"><label>Referred by</label><input value="Dr. Suresh Menon" readonly /></div>
          </div>
        </div>

        <!-- Test selection -->
        <div class="lis-card">
          <div class="lis-card__header">
            <i class="ti ti-test-pipe" style="color:var(--lis-primary,#1D9E75);font-size:15px"></i>
            <h2 class="lis-card__title">Select tests</h2>
            <span class="lis-badge">{{ selected().size }} selected</span>
          </div>

          <div class="ts-row">
            <i class="ti ti-search"></i>
            <input type="search" placeholder="Search test…" [(ngModel)]="query" aria-label="Search tests" />
          </div>
          <div class="cat-pills" role="group">
            @for (c of cats; track c) {
              <button type="button" class="cat-pill" [class.cat-pill--active]="activeCat === c" (click)="activeCat = c">{{ c }}</button>
            }
          </div>
          <div class="test-scroll" role="list">
            @for (t of filteredTests(); track t.id) {
              <div class="test-row" role="listitem" [class.test-row--sel]="selected().has(t.id)" (click)="toggle(t.id)">
                <div class="test-info">
                  <div class="test-name">{{ t.name }}</div>
                  <div class="test-cat">{{ t.category }}</div>
                </div>
                <div class="test-price">₹{{ t.price }}</div>
                <div class="test-tog">
                  @if (selected().has(t.id)) { <i class="ti ti-check"></i> } @else { <i class="ti ti-plus"></i> }
                </div>
              </div>
            }
          </div>

          <!-- Payment mode -->
          <div style="padding:10px 14px;border-top:0.5px solid var(--border-color)">
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;font-weight:500">Payment mode</div>
            <div class="pay-row" role="group" aria-label="Payment mode">
              @for (m of payModes; track m.id) {
                <button type="button" class="pay-opt"
                  [class.pay-opt--active]="payMode() === m.id"
                  [class.pay-opt--credit]="m.id === 'credit' && payMode() === 'credit'"
                  (click)="payMode.set(m.id)"
                  [attr.aria-pressed]="payMode() === m.id"
                >
                  <i class="ti ti-{{ m.icon }}"></i><br>{{ m.label }}
                </button>
              }
            </div>
            @if (payMode() === 'credit') {
              <div class="credit-warn" role="alert">
                <i class="ti ti-alert-triangle"></i>
                Credit billing — collect payment before report dispatch.
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Invoice panel -->
      <aside class="invoice-panel lis-card" aria-label="Invoice">
        <div class="inv-hd">
          <div class="inv-title">Invoice</div>
          <div class="lis-mono" style="font-size:10px">INV-2406-0092 · 23 Jun 2026</div>
        </div>
        <div class="inv-pat">
          <div class="inv-av" aria-hidden="true">KN</div>
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--text-primary)">Kavitha Nair</div>
            <div style="font-size:10px;color:var(--text-secondary)">34F · PAT-2406-0318 · Dr. Suresh Menon</div>
          </div>
        </div>

        <!-- Items -->
        <div class="inv-items" role="list" aria-label="Billed tests">
          @for (t of selectedTests(); track t.id) {
            <div class="inv-item" role="listitem">
              <span class="inv-iname">{{ t.name }}</span>
              <span class="inv-iprice">₹{{ t.price }}</span>
              <button type="button" class="inv-del" (click)="toggle(t.id)" [attr.aria-label]="'Remove ' + t.name">
                <i class="ti ti-x"></i>
              </button>
            </div>
          }
        </div>

        <!-- Discount -->
        <div class="disc-row">
          <label for="disc-inp"><i class="ti ti-tag"></i> Discount (%)</label>
          <input id="disc-inp" type="number" [(ngModel)]="discountPct" min="0" max="100" aria-label="Discount percentage" />
        </div>

        <!-- Totals -->
        <div class="inv-totals" aria-label="Invoice totals">
          <div class="tot-row"><span>Subtotal</span><span>₹{{ subtotal().toLocaleString('en-IN') }}</span></div>
          <div class="tot-row"><span>Discount ({{ discountPct }}%)</span><span style="color:#0F6E56">−₹{{ discAmt().toLocaleString('en-IN') }}</span></div>
          <div class="tot-row"><span>GST (exempt)</span><span>₹0</span></div>
          <div class="tot-row tot-row--grand"><span>Total payable</span><span>₹{{ grandTotal().toLocaleString('en-IN') }}</span></div>
        </div>

        <div class="inv-actions">
          <a routerLink="/dashboard/collection" class="lis-btn lis-btn--primary lis-btn--full">
            <i class="ti ti-printer"></i> Confirm & print receipt
          </a>
          <button type="button" class="lis-btn lis-btn--secondary lis-btn--full">
            <i class="ti ti-device-floppy"></i> Save as draft
          </button>
          <a routerLink="/dashboard/collection" class="lis-btn lis-btn--secondary lis-btn--full">
            <i class="ti ti-test-pipe"></i> Proceed to sample collection
          </a>
        </div>
      </aside>
    </div>
  `,
  styles:[`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
    .page-title { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; &:hover { color:var(--lis-primary,#1D9E75); } }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }
    .stepper { display:flex; align-items:center; gap:0; padding-bottom:14px; }
    .step    { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); }
    .step--active { color:var(--lis-primary-deep,#085041); font-weight:500; }
    .step-num {
      width:20px; height:20px; border-radius:50%;
      border:1.5px solid var(--border-color);
      display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; flex-shrink:0;
    }
    .step--done .step-num { background:var(--lis-primary-xlight,#E1F5EE); border-color:var(--lis-primary,#1D9E75); color:var(--lis-primary-deep,#085041); }
    .step--active .step-num { background:var(--lis-primary,#1D9E75); border-color:var(--lis-primary,#1D9E75); color:#fff; }
    .step-arrow { color:var(--border-color); font-size:13px; margin:0 6px; }
    .bill-layout { display:grid; grid-template-columns:1fr 272px; gap:14px; align-items:start; }
    @media (max-width:900px) { .bill-layout { grid-template-columns:1fr; } }
    .bill-main { display:flex; flex-direction:column; gap:12px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .ts-row { display:flex; align-items:center; gap:7px; background:var(--body-bg); border-bottom:0.5px solid var(--border-color); padding:8px 13px; i { color:var(--text-secondary); font-size:14px; } input { background:transparent; border:none; outline:none; font-size:12px; color:var(--text-primary); flex:1; } }
    .cat-pills { display:flex; gap:5px; flex-wrap:wrap; padding:8px 13px 6px; }
    .cat-pill  { font-size:10px; padding:3px 8px; border-radius:20px; border:0.5px solid var(--border-color); cursor:pointer; color:var(--text-secondary); background:var(--card-bg); }
    .cat-pill--active { background:var(--lis-primary-xlight,#E1F5EE); color:var(--lis-primary-deep,#085041); border-color:var(--lis-primary-mid,#5DCAA5); }
    .test-scroll { padding:0 13px 10px; display:flex; flex-direction:column; gap:5px; max-height:230px; overflow-y:auto; }
    .test-row { display:flex; align-items:center; gap:7px; padding:7px 9px; border:0.5px solid var(--border-color); border-radius:8px; cursor:pointer; }
    .test-row:hover { background:var(--body-bg); }
    .test-row--sel { background:var(--lis-primary-xlight,#E1F5EE); border-color:var(--lis-primary-mid,#5DCAA5); }
    .test-info { flex:1; }
    .test-name { font-size:11px; font-weight:500; color:var(--text-primary); }
    .test-cat  { font-size:10px; color:var(--text-secondary); }
    .test-price { font-size:11px; font-weight:500; color:var(--lis-primary-deep,#085041); min-width:40px; text-align:right; }
    .test-tog  { width:18px; height:18px; border-radius:50%; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--text-secondary); }
    .test-row--sel .test-tog { background:var(--lis-primary,#1D9E75); border-color:var(--lis-primary,#1D9E75); color:#fff; }
    .pay-row  { display:flex; gap:8px; }
    .pay-opt  { flex:1; padding:7px 4px; border:0.5px solid var(--border-color); border-radius:7px; text-align:center; font-size:10px; color:var(--text-secondary); cursor:pointer; background:var(--card-bg); }
    .pay-opt i { font-size:14px; }
    .pay-opt--active { border-color:var(--lis-primary,#1D9E75); background:var(--lis-primary-xlight,#E1F5EE); color:var(--lis-primary-deep,#085041); font-weight:500; }
    .pay-opt--credit { border-color:#E24B4A; background:#FCEBEB; color:#791F1F; }
    .credit-warn { background:#FAEEDA; border-radius:7px; padding:8px 10px; display:flex; gap:7px; align-items:flex-start; margin-top:8px; font-size:10px; color:#633806; i { color:#633806; font-size:14px; flex-shrink:0; margin-top:1px; } }
    .invoice-panel { display:flex; flex-direction:column; position:sticky; top:80px; }
    .inv-hd  { padding:11px 14px; border-bottom:0.5px solid var(--border-color); }
    .inv-title { font-size:13px; font-weight:500; color:var(--text-primary); }
    .inv-pat { padding:10px 14px; border-bottom:0.5px solid var(--border-color); display:flex; align-items:center; gap:9px; }
    .inv-av  { width:30px; height:30px; border-radius:50%; background:var(--lis-primary-xlight,#E1F5EE); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; color:var(--lis-primary-deep,#085041); }
    .inv-items { display:flex; flex-direction:column; }
    .inv-item  { display:flex; align-items:center; gap:7px; padding:7px 14px; border-bottom:0.5px solid var(--border-color); font-size:11px; }
    .inv-iname { flex:1; color:var(--text-primary); }
    .inv-iprice{ color:var(--text-primary); min-width:45px; text-align:right; }
    .inv-del  { background:none; border:none; cursor:pointer; color:var(--text-secondary); font-size:12px; &:hover { color:#E24B4A; } }
    .disc-row { padding:9px 14px; border-bottom:0.5px solid var(--border-color); display:flex; align-items:center; gap:8px; label { font-size:11px; color:var(--text-secondary); flex:1; display:flex; align-items:center; gap:4px; i { font-size:12px; } } input { width:65px; height:28px; border:0.5px solid var(--border-color); border-radius:6px; padding:0 8px; font-size:12px; text-align:right; color:var(--text-primary); background:var(--card-bg); outline:none; font-family:var(--font-family); } }
    .inv-totals { padding:10px 14px; background:var(--body-bg); }
    .tot-row { display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); padding:2px 0; }
    .tot-row--grand { font-size:14px; font-weight:500; color:var(--text-primary); padding-top:6px; border-top:0.5px solid var(--border-color); margin-top:4px; }
    .inv-actions { padding:10px 14px; display:flex; flex-direction:column; gap:7px; }
  `]
})
export class BillingComponent {
  protected readonly steps = [
    {n:1,label:'Patient'},{n:2,label:'Select tests'},{n:3,label:'Payment'},{n:4,label:'Receipt & samples'}
  ];
  protected readonly cats = ['All','Haematology','Biochemistry','Endocrinology','Urine'];
  protected readonly payModes = [
    {id:'cash' as PaymentMode, icon:'cash',        label:'Cash'},
    {id:'upi'  as PaymentMode, icon:'qrcode',      label:'UPI'},
    {id:'card' as PaymentMode, icon:'credit-card', label:'Card'},
    {id:'credit' as PaymentMode, icon:'clock',     label:'Credit'},
  ];

  activeCat   = 'All';
  query       = '';
  discountPct = 0;
  payMode     = signal<PaymentMode>('cash');
  private _sel = signal(new Set<string>(['CBC','LFT','URI']));

  filteredTests = computed(() => {
    const q = this.query.toLowerCase();
    return ALL_TESTS.filter(t =>
      (this.activeCat === 'All' || t.category === this.activeCat) &&
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  });
  selectedTests  = computed(() => ALL_TESTS.filter(t => this._sel().has(t.id)));
  selected       = computed(() => this._sel());
  subtotal       = computed(() => this.selectedTests().reduce((a,t) => a + t.price, 0));
  discAmt        = computed(() => Math.round(this.subtotal() * this.discountPct / 100));
  grandTotal     = computed(() => this.subtotal() - this.discAmt());

  toggle(id: string): void {
    this._sel.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
}

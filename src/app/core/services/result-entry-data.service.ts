import { Injectable } from '@angular/core';
import { LabTest, ResultFlag, Sample } from '../../shared/models/lis.models';

export type TestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TestFilter = 'ALL' | TestStatus;
export type WorkflowStatus = 'COMPLETED' | 'PENDING';
export interface MockParameter {
  id: string;
  name: string;
  method: string;
  value: string;
  unit: string;
  range: string;
  flag: ResultFlag;
  isCalculated?: boolean;
  note?: string;
  previousValue?: string;
}
export interface MockOrderedTest {
  id: string;
  code: string;
  name: string;
  shortName: string;
  status: TestStatus;
  parameters: MockParameter[];
}
export interface NoteDraft { parameterId: string; text: string; }
export interface NotificationDraft { parameterId: string; recipient: string; channel: string; }

const PARAMETER_TEMPLATES: Record<string, Array<Omit<MockParameter, 'value' | 'flag'>>> = {
  KFT: [
    {id:'cr',name:'Serum creatinine',method:'Enzymatic method',unit:'mg/dL',range:'0.7 – 1.3',previousValue:'1.1'},
    {id:'bun',name:'Blood urea nitrogen',method:'Urease',unit:'mg/dL',range:'7 – 20',previousValue:'19'},
    {id:'k',name:'Serum potassium (K⁺)',method:'ISE',unit:'mEq/L',range:'3.5 – 5.0',previousValue:'4.2',note:'Demo note: verify sample integrity.'},
    {id:'na',name:'Serum sodium (Na⁺)',method:'ISE',unit:'mEq/L',range:'136 – 145',previousValue:'139'},
    {id:'ua',name:'Serum uric acid',method:'Uricase',unit:'mg/dL',range:'3.5 – 7.2',previousValue:'5.0'},
    {id:'egfr',name:'eGFR (CKD-EPI)',method:'Calculated',unit:'mL/min/1.73 m²',range:'≥ 60',previousValue:'82',isCalculated:true},
  ],
  LFT: ['Bilirubin total','Bilirubin direct','SGOT (AST)','SGPT (ALT)','Alkaline phosphatase','Total protein','Albumin','Globulin'].map((name,i)=>({id:'lft-'+i,name,method:'Configured method',unit:i<2?'mg/dL':'U/L',range:'Configured range'})),
  CBC: ['Haemoglobin','Total WBC count','Platelet count','RBC count','Haematocrit','MCV','MCH','MCHC','Neutrophils','Lymphocytes','Monocytes','Eosinophils','Basophils','RDW','MPV','PCV','PCT','PDW','ESR','ANC','ALC','Reticulocyte count'].map((name,i)=>({id:'cbc-'+i,name,method:'Configured method',unit:i===0?'g/dL':i===1||i===2?'cells/µL':'',range:'Configured range'})),
  HBA: [{id:'hba-0',name:'HbA1c',method:'HPLC',unit:'%',range:'4.0 – 5.6'},{id:'hba-1',name:'Estimated average glucose',method:'Calculated',unit:'mg/dL',range:'70 – 126',isCalculated:true}],
  GLU: [{id:'glu-0',name:'Blood glucose',method:'Hexokinase',unit:'mg/dL',range:'70 – 99'}],
  ESR: [{id:'esr-0',name:'Erythrocyte sedimentation rate',method:'Westergren',unit:'mm/hr',range:'0 – 20'}],
  LIP: ['Total cholesterol','Triglycerides','HDL cholesterol','LDL cholesterol','VLDL cholesterol','Total cholesterol / HDL ratio'].map((name,i)=>({id:'lip-'+i,name,method:i===5?'Calculated':'Enzymatic',unit:i===5?'ratio':'mg/dL',range:'Configured range',isCalculated:i===5})),
  TSH: [{id:'tsh-0',name:'Thyroid stimulating hormone (TSH)',method:'CLIA',unit:'µIU/mL',range:'0.4 – 4.5'}],
  FT3: [{id:'ft3-0',name:'Free T3',method:'CLIA',unit:'pg/mL',range:'2.0 – 4.4'},{id:'ft3-1',name:'Free T4',method:'CLIA',unit:'ng/dL',range:'0.8 – 1.8'},{id:'ft3-2',name:'TSH',method:'CLIA',unit:'µIU/mL',range:'0.4 – 4.5'}],
  VTD: [{id:'vtd-0',name:'25-OH Vitamin D',method:'CLIA',unit:'ng/mL',range:'30 – 100'}],
  URI: ['Colour','Appearance','Specific gravity','pH','Protein','Glucose','Ketones','Blood','Pus cells','RBCs','Epithelial cells','Casts'].map((name,i)=>({id:'uri-'+i,name,method:'Microscopy / dipstick',unit:i>7?' /HPF':'',range:'As per lab reference'})),
  UCR: [{id:'ucr-0',name:'Urine creatinine',method:'Enzymatic',unit:'mg/dL',range:'Configured range'}],
  CRP: [{id:'crp-0',name:'C-reactive protein',method:'Immunoturbidimetry',unit:'mg/L',range:'0 – 5'}],
  FER: [{id:'fer-0',name:'Serum ferritin',method:'CLIA',unit:'ng/mL',range:'Configured range'}],
  B12: [{id:'b12-0',name:'Vitamin B12',method:'CLIA',unit:'pg/mL',range:'200 – 900'}],
};
const DEMO_VALUES: Record<string,string[]> = {KFT:['2.4','48','6.8','138','5.2','32'],LFT:['0.8','0.2','28','32','92','7.1','4.2','2.9'],CBC:['13.5','7800','210000','4.8','42','88','29','33','62','30','5','2','1','13','9','40'],HBA:['6.2','131'],GLU:['96'],ESR:['12'],LIP:['182','145','48','112','29','3.8'],TSH:['2.4'],FT3:['3.1','1.2','2.4'],VTD:['28'],UCR:['85'],CRP:['3.2'],FER:['86'],B12:['420'],URI:['Pale yellow','Clear','1.020','6.0','Nil','Nil','Nil','Nil','1–2','0–1','Few','Nil']};
const DEMO_FLAGS: Record<string,ResultFlag[]> = {KFT:['high','high','critical','normal','normal','low'],HBA:['high','normal'],VTD:['low']};
export function flagFromValue(value:string,range:string):ResultFlag {
  if(!value.trim()) return 'normal';
  const numeric=Number(value);
  if(!Number.isFinite(numeric)) return 'normal';
  const bounds=range.match(/[0-9.]+/g)?.map(Number)??[];
  if(!bounds.length) return 'normal';
  if(/[≥>]=?/.test(range)) return numeric<bounds[0]?'low':'normal';
  if(/[≤<]=?/.test(range)) return numeric>bounds[0]?'high':'normal';
  if(bounds.length<2) return 'normal';
  if(numeric<bounds[0]) return 'low';
  if(numeric>bounds[1]) return 'high';
  return 'normal';
}
export const createDemoTests = (testIds:string[],catalogue:LabTest[]):MockOrderedTest[] => {
  const aliases:Record<string,string>={'URINE R/M':'URI','URINE R/M – ROUTINE & MICROSCOPY':'URI','THYROID PANEL':'TSH','LIPIDS':'LIP'};
  return testIds.map(rawId=>{
    const normalized=aliases[rawId.toUpperCase()]??rawId.toUpperCase();
    const labTest=catalogue.find(test=>test.id.toUpperCase()===normalized||test.name.toUpperCase()===rawId.toUpperCase());
    const code=labTest?.id??normalized;
    const templates=PARAMETER_TEMPLATES[code]??[{id:code.toLowerCase()+'-0',name:(labTest?.name??rawId)+' result',method:'Configured method',unit:'',range:'Configured range'}];
    const values=DEMO_VALUES[code]??[]; const flags=DEMO_FLAGS[code]??[];
    const parameters:MockParameter[]=templates.map((template,index)=>{const value=values[index]??'';return {...template,value,flag:flags[index]??flagFromValue(value,template.range)};});
    return {id:code,code,name:labTest?.name??rawId,shortName:code==='KFT'?'KFT – Kidney Function Test':code==='LFT'?'LFT – Liver Function Test':code==='CBC'?'CBC – Complete Blood Count':labTest?.name??rawId,status:parameters.every(p=>p.value.trim())?'COMPLETED':parameters.some(p=>p.value.trim())?'IN_PROGRESS':'PENDING',parameters};
  });
};

export interface ResultEntryRecord {
  sampleId: string;
  tests: MockOrderedTest[];
  workflowStatus: 'DRAFT' | 'SUBMITTED_FOR_VALIDATION';
  updatedAt: string;
  notifications?: Array<{ parameterId: string; parameterName: string; value: string; unit: string; recipient: string; channel: string; recordedAt: string }>;
}

/**
 * Result-entry data boundary.
 * The current implementation is a local mock repository. When the LIS API
 * is ready, replace these methods with HttpClient calls while keeping the
 * component contract and result-entry view model unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ResultEntryDataService {
  private readonly storagePrefix = 'medpath.result-entry.v1';

  loadForSample(sample: Sample, catalogue: LabTest[]): ResultEntryRecord {
    const saved = this.read(sample.id);
    if (saved) return saved;
    return {
      sampleId: sample.id,
      tests: createDemoTests(sample.tests, catalogue),
      workflowStatus: 'DRAFT',
      updatedAt: new Date().toISOString(),
    };
  }

  saveDraft(record: ResultEntryRecord): ResultEntryRecord {
    const existing = this.read(record.sampleId);
    const next = { ...existing, ...record, notifications: existing?.notifications ?? [], workflowStatus: 'DRAFT' as const, updatedAt: new Date().toISOString() };
    this.write(next);
    return next;
  }

  submitForValidation(record: ResultEntryRecord): ResultEntryRecord {
    const existing = this.read(record.sampleId);
    const next = { ...existing, ...record, notifications: existing?.notifications ?? [], workflowStatus: 'SUBMITTED_FOR_VALIDATION' as const, updatedAt: new Date().toISOString() };
    this.write(next);
    return next;
  }

  recordNotification(sampleId: string, notification: { parameterId: string; parameterName: string; value: string; unit: string; recipient: string; channel: string }): void {
    const current = this.read(sampleId) ?? {
      sampleId, tests: [], workflowStatus: 'DRAFT' as const, updatedAt: new Date().toISOString()
    };
    this.write({
      ...current,
      notifications: [...(current.notifications ?? []), { ...notification, recordedAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    });
  }

  private read(sampleId: string): ResultEntryRecord | null {
    try {
      const raw = localStorage.getItem(this.storagePrefix + ':' + sampleId);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ResultEntryRecord;
      return parsed?.sampleId === sampleId && Array.isArray(parsed.tests) ? parsed : null;
    } catch { return null; }
  }

  private write(record: ResultEntryRecord): void {
    try { localStorage.setItem(this.storagePrefix + ':' + record.sampleId, JSON.stringify(record)); }
    catch { /* The in-memory UI remains usable when storage is unavailable. */ }
  }
}

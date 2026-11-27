import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
  /** Lab-configured critical limits; distinct from the ordinary reference range. */
  criticalLow?: number;
  criticalHigh?: number;
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
    {id:'k',name:'Serum potassium (K⁺)',method:'ISE',unit:'mEq/L',range:'3.5 – 5.0',previousValue:'4.2',criticalLow:2.5,criticalHigh:6.5,note:'Demo note: verify sample integrity.'},
    {id:'na',name:'Serum sodium (Na⁺)',method:'ISE',unit:'mEq/L',range:'136 – 145',previousValue:'139'},
    {id:'ua',name:'Serum uric acid',method:'Uricase',unit:'mg/dL',range:'3.5 – 7.2',previousValue:'5.0'},
    {id:'egfr',name:'eGFR (CKD-EPI)',method:'Calculated',unit:'mL/min/1.73 m²',range:'≥ 60',previousValue:'82',isCalculated:true},
  ],
  LFT: ['Bilirubin total','Bilirubin direct','SGOT (AST)','SGPT (ALT)','Alkaline phosphatase','Total protein','Albumin','Globulin'].map((name,i)=>({id:'lft-'+i,name,method:'Configured method',unit:i<2?'mg/dL':'U/L',range:'Configured range'})),
  CBC: [],
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
const CBC_TEMPLATES: Array<Omit<MockParameter, 'value' | 'flag'>> = [
  {id:'cbc-0',name:'Haemoglobin',method:'Automated hematology analyzer (demo)',unit:'g/dL',range:'13.0 – 17.0'},
  {id:'cbc-1',name:'Total WBC count',method:'Automated hematology analyzer (demo)',unit:'cells/µL',range:'4000 – 10000'},
  {id:'cbc-2',name:'Platelet count',method:'Automated hematology analyzer (demo)',unit:'cells/µL',range:'150000 – 410000'},
  {id:'cbc-3',name:'RBC count',method:'Automated hematology analyzer (demo)',unit:'×10⁶/µL',range:'4.5 – 5.5'},
  {id:'cbc-4',name:'Haematocrit',method:'Calculated (demo)',unit:'%',range:'40 – 50'},
  {id:'cbc-5',name:'MCV',method:'Calculated (demo)',unit:'fL',range:'83 – 101'},
  {id:'cbc-6',name:'MCH',method:'Calculated (demo)',unit:'pg',range:'27 – 32'},
  {id:'cbc-7',name:'MCHC',method:'Calculated (demo)',unit:'g/dL',range:'31.5 – 36.0'},
  {id:'cbc-8',name:'Neutrophils',method:'Automated differential (demo)',unit:'%',range:'40 – 80'},
  {id:'cbc-9',name:'Lymphocytes',method:'Automated differential (demo)',unit:'%',range:'20 – 40'},
  {id:'cbc-10',name:'Monocytes',method:'Automated differential (demo)',unit:'%',range:'2 – 10'},
  {id:'cbc-11',name:'Eosinophils',method:'Automated differential (demo)',unit:'%',range:'1 – 6'},
  {id:'cbc-12',name:'Basophils',method:'Automated differential (demo)',unit:'%',range:'0 – 2'},
  {id:'cbc-13',name:'RDW',method:'Automated hematology analyzer (demo)',unit:'%',range:'11.5 – 16.0'},
  {id:'cbc-14',name:'MPV',method:'Automated hematology analyzer (demo)',unit:'fL',range:'9 – 13'},
  {id:'cbc-15',name:'PCV',method:'Calculated (demo)',unit:'%',range:'40 – 50'},
  {id:'cbc-16',name:'PCT',method:'Automated hematology analyzer (demo)',unit:'%',range:'0.17 – 0.32'},
  {id:'cbc-17',name:'PDW',method:'Automated hematology analyzer (demo)',unit:'fL',range:'9 – 16'},
  {id:'cbc-18',name:'ESR',method:'Westergren (demo)',unit:'mm/hr',range:'0 – 14'},
  {id:'cbc-19',name:'ANC',method:'Calculated (demo)',unit:'cells/µL',range:'2000 – 7000'},
  {id:'cbc-20',name:'ALC',method:'Calculated (demo)',unit:'cells/µL',range:'1000 – 3000'},
  {id:'cbc-21',name:'Reticulocyte count',method:'Automated hematology analyzer (demo)',unit:'%',range:'0.5 – 2.5'},
];
const CBC_VALUES = ['13.5','7800','210000','4.8','42','88','29','33','62','30','5','2','1','13','9','42','0.20','12','12','4836','2340','1.2'];
const cbcTemplatesFor = (gender?: string, dob?: string, collectedAt?: string, recordedAgeYears?: number): Array<Omit<MockParameter, 'value' | 'flag'>> => {
  const templates = CBC_TEMPLATES.map(parameter => ({ ...parameter }));
  const birthDate = dob ? new Date(`${dob}T00:00:00`) : null;
  const collectionDate = collectedAt ? new Date(collectedAt) : new Date();
  const ageYears = birthDate && !Number.isNaN(birthDate.getTime())
    ? collectionDate.getFullYear() - birthDate.getFullYear() - (collectionDate.getMonth() < birthDate.getMonth() || (collectionDate.getMonth() === birthDate.getMonth() && collectionDate.getDate() < birthDate.getDate()) ? 1 : 0)
    : Number.isFinite(recordedAgeYears) ? recordedAgeYears! : null;
  if (ageYears === null || ageYears < 1 || (ageYears > 12 && ageYears < 18)) {
    return templates.map(parameter => ({ ...parameter, range: 'Age-specific interval not configured' }));
  }
  if (ageYears >= 1 && ageYears <= 12) {
    const band = ageYears === 1 ? '1 year' : ageYears <= 5 ? '2–5 years' : '6–12 years';
    const pediatricRanges: Record<string, Record<number, string>> = {
      '1 year': {0:'11.1 – 14.1',1:'6000 – 16000',2:'200000 – 550000',3:'3.9 – 5.1',4:'30 – 38',5:'72 – 84',6:'25 – 29',7:'32 – 36',15:'30 – 38',19:'1000 – 7000',20:'3500 – 11000'},
      '2–5 years': {0:'11.0 – 14.0',1:'5000 – 15000',2:'200000 – 490000',3:'4.0 – 5.2',4:'34 – 40',5:'75 – 87',6:'24 – 30',7:'31 – 37',15:'34 – 40',19:'1500 – 8000',20:'6000 – 9000'},
      '6–12 years': {0:'11.5 – 15.5',1:'5000 – 13000',2:'170000 – 450000',3:'4.0 – 5.2',4:'35 – 45',5:'77 – 95',6:'25 – 33',7:'31 – 37',15:'35 – 45',19:'2000 – 8000',20:'1000 – 5000'},
    };
    return templates.map((parameter, index) => ({
      ...parameter,
      range: pediatricRanges[band][index] ?? 'Age-specific interval not configured',
    }));
  }
  if (gender?.toLowerCase() === 'female') {
    templates[0].range = '12.0 – 15.0'; templates[3].range = '3.8 – 4.8';
    templates[4].range = '36 – 46'; templates[15].range = '36 – 46';
    templates[18].range = '0 – 20';
  } else if (gender?.toLowerCase() === 'other') {
    for (const index of [0, 3, 4, 15, 18]) templates[index].range = 'Sex-specific interval not configured';
  }
  return templates;
};
const DEMO_VALUES: Record<string,string[]> = {KFT:['2.4','48','6.8','138','5.2','32'],LFT:['0.8','0.2','28','32','92','7.1','4.2','2.9'],CBC:CBC_VALUES,HBA:['6.2','131'],GLU:['96'],ESR:['12'],LIP:['182','145','48','112','29','3.8'],TSH:['2.4'],FT3:['3.1','1.2','2.4'],VTD:['28'],UCR:['85'],CRP:['3.2'],FER:['86'],B12:['420'],URI:['Pale yellow','Clear','1.020','6.0','Nil','Nil','Nil','Nil','1–2','0–1','Few','Nil']};
const DEMO_FLAGS: Record<string,ResultFlag[]> = {KFT:['high','high','critical','normal','normal','low'],HBA:['high','normal'],VTD:['low']};
export function flagFromValue(value:string,range:string,criticalLow?:number,criticalHigh?:number):ResultFlag {
  if(!value.trim()) return 'normal';
  const numeric=Number(value);
  if(!Number.isFinite(numeric)) return 'normal';
  // Critical limits take precedence over ordinary high/low reference flags.
  if((criticalLow!==undefined && numeric<=criticalLow)||(criticalHigh!==undefined && numeric>=criticalHigh)) return 'critical';
  const bounds=range.match(/[0-9.]+/g)?.map(Number)??[];
  if(!bounds.length) return 'normal';
  if(/[≥>]=?/.test(range)) return numeric<bounds[0]?'low':'normal';
  if(/[≤<]=?/.test(range)) return numeric>bounds[0]?'high':'normal';
  if(bounds.length<2) return 'normal';
  if(numeric<bounds[0]) return 'low';
  if(numeric>bounds[1]) return 'high';
  return 'normal';
}
const flagForProfile = (value:string,range:string,criticalLow?:number,criticalHigh?:number):ResultFlag =>
  range.toLowerCase().includes('not configured') ? 'unavailable' : flagFromValue(value,range,criticalLow,criticalHigh);
export const createDemoTests = (testIds:string[],catalogue:LabTest[],gender?:string,dob?:string,collectedAt?:string,ageYears?:number):MockOrderedTest[] => {
  const aliases:Record<string,string>={'URINE R/M':'URI','URINE R/M – ROUTINE & MICROSCOPY':'URI','THYROID PANEL':'TSH','LIPIDS':'LIP'};
  return testIds.map(rawId=>{
    const normalized=aliases[rawId.toUpperCase()]??rawId.toUpperCase();
    const labTest=catalogue.find(test=>test.id.toUpperCase()===normalized||test.name.toUpperCase()===rawId.toUpperCase());
    const code=labTest?.id??normalized;
    const templates=code==='CBC'?cbcTemplatesFor(gender,dob,collectedAt,ageYears):PARAMETER_TEMPLATES[code]??[{id:code.toLowerCase()+'-0',name:(labTest?.name??rawId)+' result',method:'Configured method',unit:'',range:'Configured range'}];
    const values=DEMO_VALUES[code]??[]; const flags=DEMO_FLAGS[code]??[];
    const parameters:MockParameter[]=templates.map((template,index)=>{const value=values[index]??'';const flag=flagForProfile(value,template.range) === 'unavailable'?'unavailable':flags[index]??flagForProfile(value,template.range);return {...template,value,flag};});
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

  loadForSample(sample: Sample, catalogue: LabTest[]): Observable<ResultEntryRecord> {
    const saved = this.read(sample.id);
    const configuredTests = createDemoTests(sample.tests, catalogue, sample.gender, sample.dob, sample.collectedAt);
    if (saved) {
      // Existing browser drafts may predate critical-limit configuration.
      // Rehydrate threshold metadata without overwriting the user's entered values.
      const tests = saved.tests.map(test => {
        const configured = configuredTests.find(item => item.id === test.id);
        return {
          ...test,
          parameters: test.parameters.map(parameter => {
            const defaults = configured?.parameters.find(item => item.id === parameter.id);
            return {
              ...parameter,
              method: defaults?.method ?? parameter.method,
              unit: defaults?.unit ?? parameter.unit,
              range: defaults?.range ?? parameter.range,
              flag: defaults ? flagForProfile(parameter.value, defaults.range, defaults.criticalLow, defaults.criticalHigh) : parameter.flag,
              criticalLow: parameter.criticalLow ?? defaults?.criticalLow,
              criticalHigh: parameter.criticalHigh ?? defaults?.criticalHigh,
            };
          }),
        };
      });
      return of({ ...saved, tests });
    }
    return of({
      sampleId: sample.id,
      tests: configuredTests,
      workflowStatus: 'DRAFT',
      updatedAt: new Date().toISOString(),
    });
  }

  getSavedRecord(sampleId: string): ResultEntryRecord | null {
    return this.read(sampleId);
  }

  saveDraft(record: ResultEntryRecord): Observable<ResultEntryRecord> {
    const existing = this.read(record.sampleId);
    const next = { ...existing, ...record, notifications: existing?.notifications ?? [], workflowStatus: 'DRAFT' as const, updatedAt: new Date().toISOString() };
    this.write(next);
    return of(next);
  }

  submitForValidation(record: ResultEntryRecord): Observable<ResultEntryRecord> {
    const existing = this.read(record.sampleId);
    const next = { ...existing, ...record, notifications: existing?.notifications ?? [], workflowStatus: 'SUBMITTED_FOR_VALIDATION' as const, updatedAt: new Date().toISOString() };
    this.write(next);
    return of(next);
  }

  recordNotification(record: ResultEntryRecord, notification: { parameterId: string; parameterName: string; value: string; unit: string; recipient: string; channel: string }): Observable<ResultEntryRecord> {
    const current = this.read(record.sampleId);
    const next: ResultEntryRecord = {
      ...current,
      ...record,
      notifications: [...(current?.notifications ?? []), { ...notification, recordedAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    };
    this.write(next);
    return of(next);
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

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RegisteredPatient, KnownPatientRecord } from '../../../core/services/patient-flow.service';

@Component({
  selector: 'lis-patient-card',
  standalone: true,
  imports: [DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-card.component.html',
  styleUrl: './patient-card.component.css',
})
export class PatientCardComponent {
  readonly patient = input.required<RegisteredPatient | KnownPatientRecord>();
  readonly variant = input<'standard' | 'compact' | 'collection'>('standard');
  readonly priority = input<string | null>(null);
  readonly collected = input(false);

  initials(): string {
    const p = this.patient();
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase() || '?';
  }
  age(): string {
    const raw = this.patient().dob;
    if (!raw) return '—';
    const dob = new Date(raw);
    if (Number.isNaN(dob.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return `${years}y ${months}m ${days}d`;
  }
  visitType(): string {
    return 'visitType' in this.patient() ? this.patient().visitType : 'Walk-in';
  }
  fasting(): string {
    return 'fasting' in this.patient() ? this.patient().fasting : 'Not specified';
  }
  refDoctor(): string {
    return 'refDoctor' in this.patient() ? this.patient().refDoctor : 'Self / Walk-in';
  }
  genderIcon(): string {
    switch (this.patient().gender.toLowerCase()) {
      case 'male': return 'ti-gender-male';
      case 'female': return 'ti-gender-female';
      default: return 'ti-gender-genderless';
    }
  }
  visitIcon(): string {
    const visit = this.visitType().toLowerCase();
    return visit.includes('home') ? 'ti-home' : visit.includes('appointment') ? 'ti-calendar-event' : 'ti-walk';
  }
}

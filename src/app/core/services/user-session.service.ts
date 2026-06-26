import { Injectable, signal } from '@angular/core';

export interface Operator {
  name: string;
  initials: string;
  role: string;
  labName: string;
}

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly _operator = signal<Operator>({
    name:     'Ravi Anand',
    initials: 'RA',
    role:     'Lab Operator',
    labName:  'MedPath Diagnostics',
  });

  readonly operator = this._operator.asReadonly();

  /** Called after login */
  setOperator(op: Operator): void {
    this._operator.set(op);
  }

  /** Simulated login — replace with real auth call */
  login(username: string, _password: string): boolean {
    // TODO: integrate real auth endpoint
    if (username.trim().length > 0) {
      this._operator.set({
        name:     'Ravi Anand',
        initials: 'RA',
        role:     'Lab Operator',
        labName:  'MedPath Diagnostics',
      });
      return true;
    }
    return false;
  }
}

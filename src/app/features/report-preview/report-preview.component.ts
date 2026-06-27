import {
  Component, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReportPreviewService, ReportPreviewData } from '../../core/services/report-preview.service';
import { ResultFlag } from '../../shared/models/lis.models';

type Template = ReportPreviewData['template'];
type PaperSize = ReportPreviewData['paperSize'];
type Orientation = ReportPreviewData['orientation'];

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.css',
})
export class ReportPreviewComponent {
  private readonly previewSvc = inject(ReportPreviewService);
  private readonly router      = inject(Router);

  protected readonly data = this.previewSvc.data;

  /** Which sections of the navigation panel are "done" */
  protected readonly sections = [
    { label: 'Patient information', done: true  },
    { label: 'Report summary',      done: true  },
    { label: 'Test results',        done: true  },
    { label: 'Footer & disclaimer', done: true  },
  ];

  protected readonly templates: Template[]    = ['Standard Template', 'Compact Template', 'Detailed Template'];
  protected readonly paperSizes: PaperSize[]  = ['A4', 'Letter'];
  protected readonly orientations: Orientation[] = ['portrait', 'landscape'];

  /** Viewport zoom (display only — does not affect print) */
  zoom = signal(100);

  /** Active viewport (desktop / mobile preview toggle) */
  viewport = signal<'desktop' | 'mobile'>('desktop');

  protected flagLabel(f: ResultFlag): string {
    return { normal: 'Normal', high: 'High', low: 'Low', critical: 'Critical' }[f] ?? f;
  }

  protected setTemplate(t: Template): void {
    this.previewSvc.updateSetting('template', t);
  }

  protected toggleSetting(key: keyof ReportPreviewData): void {
    const current = this.data()[key] as boolean;
    this.previewSvc.updateSetting(key as keyof ReportPreviewData, !current as any);
  }

  protected setPaperSize(s: PaperSize): void {
    this.previewSvc.updateSetting('paperSize', s);
  }

  protected setOrientation(o: Orientation): void {
    this.previewSvc.updateSetting('orientation', o);
  }

  protected zoomIn(): void  { this.zoom.update(z => Math.min(z + 10, 150)); }
  protected zoomOut(): void { this.zoom.update(z => Math.max(z - 10, 60));  }

  protected finalise(): void {
    // In a real app: trigger PDF export / API call here
    this.previewSvc.clear();
    this.router.navigate(['/dashboard/reports']);
  }

  protected cancel(): void {
    this.router.navigate(['/dashboard/results']);
  }
}
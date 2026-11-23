# MedPath two-workflow mock implementation

This branch keeps the existing Patient Workflow and Lab Workflow screens and connects them through a shared mock repository.

## Patient Workflow
1. Registration creates a patient visit.
2. Test selection is retained in the active patient session.
3. Billing creates an order and invoice, then records any amount received and remaining balance.
4. Collection receives the same visit/order identifiers from the active workflow session.

## Lab Workflow
1. Collection creates a sample linked to the order and visit. The required collection checklist is enforced.
2. Specimen groups are derived from each catalogue test's `tubeType`, not its business category.
3. Result Entry saves values against the sample and submits the record for validation.
4. The Validation queue supports approve or reject/return decisions and records reviewer/time/note.
5. Reports are generated only from validated result records. Dispatch actions are recorded in the mock repository.

## Mock repository contract
`LabWorkflowMockService` is the current persistence adapter. It stores visits, orders, invoices/payments, samples, results, validation decisions and reports under `medpath.workflow.mock.v1`. The active Patient Workflow session is restored from `medpath.active-patient-flow.v1`.

`SampleTrackingService` remains the existing UI queue adapter. Collection and validation update its visible status so the existing Sample Tracking screen reflects progress.

## State rules
- Collection checklist must be complete before a sample can be marked collected.
- Invoice amount received and balance due are separate values. A credit invoice may have zero amount received.
- Result submission requires all result values to be present.
- Only submitted results can be reviewed.
- Only validated results can generate a report.
- Report dispatch is a recorded mock action; no email, WhatsApp or external message is sent.

## API integration seam
When the backend is ready, replace the implementation behind `LabWorkflowMockService` with an API-backed repository while preserving the component-facing operations and domain identifiers. Keep Patient ID, Visit ID, Order ID, Invoice ID, Sample ID, Result ID and Report ID distinct.

## Important limitations
- Browser localStorage is temporary demo persistence, not a production/offline database.
- Demo reviewer identity is `Demo Pathologist`; real role-based authentication and authorization are not implemented here.
- Reference ranges, clinical flags, critical-value notification delivery, PDF generation/signature and actual report delivery require validated lab configuration and backend integration.
- The mock catalogue and example result values are for workflow testing only and must not be used for clinical decisions.

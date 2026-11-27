# Feature ownership

Each business feature owns its pages, feature components, domain models, and feature-facing service. Keep the structure shallow; add subfolders only when a feature has enough files to benefit.

| Feature | Owns |
|---|---|
| patient-registration | Patient identity and demographic capture |
| test-order / review-order | Orders and ordered test items |
| billing / billing-dashboard | Invoices, payments, discounts, refunds; mutations go through the BillingService feature boundary |
| sample-collection / sample-tracking | Specimens, collection, receipt, tracking |
| result-entry / result-validation | Result values, versions, review and authorization |
| reports / report-preview | Authorized report snapshots and dispatch history |
| patient-history | Read-only patient timeline assembled from owned records |
| dashboard / analytics | Read-only operational summaries and aggregates |
| settings | Lab and user preferences |

Cross-feature rules:

- A screen never mutates another feature's internal state or local storage.
- Shared UI components contain no LIS business rules.
- Shared models are limited to genuinely cross-feature primitives; domain-specific models belong to their owning feature.
- Sample Collection and Sample Tracking must converge on one sample record.
- Result Entry and Result Validation must converge on one result record and lifecycle.
- Reports and Patient History must read the same authorized report/result records.
- PatientFlowService coordinates the registration-to-billing journey; finalized orders are persisted in the shared workflow repository. BillingService owns invoice and payment mutations.
- Avoid adding generic architecture layers (facades, use-cases, state folders) until a real feature needs them.

# Result Entry UI Preview

Branch: `feature/result-entry-redesign-ui`

## Scope
This branch implements Phase 2 (UI with isolated mock data) of the approved Result Entry redesign.

- Keeps existing `/dashboard/results` and `/dashboard/results/:sampleId` routes.
- Reuses the current patient-flow and sample-tracking services for patient/sample identity.
- Uses isolated local mock test and parameter data for the visual preview.
- Does not call backend endpoints or change API contracts.
- Does not claim that draft saves, notifications, validation, review, or finalization succeeded.
- Keeps Finalize disabled pending real release-workflow integration.

## Review items
- Three-column desktop workspace with collapsible ordered-tests and workflow panels.
- Search and status filters, parameter editing, parameter-level Notes dialog, More menu, restore/clear confirmation and history preview.
- Critical-result presentation and notification-recording dialog are mock interactions only.
- Responsive breakpoints and independent scrolling.

## Known integration gaps
- The repository currently targets Angular 17.3.12 in `package.json`, not Angular 20 as in the specification.
- Existing sample tracking data does not expose the sample's complete ordered-test parameter matrix. The preview's ordered tests and results are therefore isolated mock data and must be replaced with actual order/result contracts after visual approval.
- Existing `PatientFlowService` and `SampleTrackingService` are in-memory state services; no result-entry backend API was identified in this pass.
- Clinical reference ranges, flags, critical thresholds, validation, authorization, notification audit and report release must be server-sourced in Phase 3.
- Existing global theme variables are reused; do not interpret demo values as clinical recommendations.

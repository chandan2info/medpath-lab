# Data boundary

This folder is the single integration boundary between MedPath feature screens and persistence.

## Intended flow

```
Feature page/component
        |
Feature service (screen-facing operations)
        |
Repository contract
       / \
Mock adapter   HTTP/API adapter
```

## Rules

- Feature components must not call `HttpClient` or access `localStorage` directly.
- Repository contracts describe business operations and return domain models/observables.
- Mock adapters are development/demo implementations only. Browser storage is not the production clinical record store.
- API adapters must implement the same contracts as the mock adapters.
- Select the adapter through Angular dependency-injection providers; do not branch on mock/API mode inside components.
- Only the owning feature may create or update its records. Other features consume read contracts.
- Do not keep separate authoritative copies of samples, results, invoices, or reports in individual screens.
- Persisted clinical records, result authorization, report versions, and audit history must be server-authoritative before production use.

## Migration order

1. Samples: make collection and tracking read/write the same sample repository.
2. Results: make entry and validation use the same versioned result repository.
3. Reports: generate only from authorized result snapshots; history reads those same report records.
4. Billing and orders: separate their domain records while preserving the visit/order workflow.
5. Dashboard and analytics: read operational aggregates rather than maintaining duplicate fixtures.

Until a feature has been migrated, its existing service remains in place. Do not treat this folder's presence as proof that the migration is complete.

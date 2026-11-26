# Architecture Analysis Index

This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

## Implementation Guide

### Global artifacts
- `unit_graph.yaml`: unit boundaries, triggers, exported signatures, dependencies, and shared references.
- `project-structure.md`: domains, layers, entry points, and project type.
- `tech-stack.md`: existing frameworks, dependencies, runtimes, and configuration.
- `data-model.md`: MongoDB document inventory and relationships.
- `wire_contracts.yaml`: external REST and scheduled-job contracts.
- `shared_modules.yaml`: shared models/security/audit modules and migration strategies.
- `cross_unit_state.yaml`: implicit state flows and runtime verification hints.

### Unit: auth
- external trigger: `/api/auth/**`
- read: `units/auth/behavior.yaml`, `units/auth/bindings.yaml`, `units/auth/unit_decomposition.yaml`
- relevant globals: JWT rows in `shared_modules.yaml`; auth and purchase linking flows in `cross_unit_state.yaml`; authentication row in `wire_contracts.yaml`
- completion evidence: all must-preserve OTP/login/password behaviors; JWT/runtime config; verification/build evidence

### Unit: admin
- external trigger: `/api/admin/**`
- read: `units/admin/behavior.yaml`, `units/admin/bindings.yaml`, `units/admin/unit_decomposition.yaml`
- relevant globals: admin contract, audit-log shared module
- completion evidence: role checks, status transitions, rejection reason, and audit append behavior

### Unit: analytics
- external trigger: `/api/analytics/**`
- read: `units/analytics/behavior.yaml`, `units/analytics/bindings.yaml`, `units/analytics/unit_decomposition.yaml`
- completion evidence: platform and retailer aggregation scopes preserved

### Unit: retailer
- external trigger: `/api/retailer/**`
- read: `units/retailer/behavior.yaml`, `units/retailer/bindings.yaml`, `units/retailer/unit_decomposition.yaml`
- relevant globals: retailer-model shared module
- completion evidence: user-to-retailer tenant scope and approval-status behavior preserved

### Unit: product-catalog
- external trigger: `/api/products/**`
- read: `units/product-catalog/behavior.yaml`, `units/product-catalog/bindings.yaml`, `units/product-catalog/unit_decomposition.yaml`
- relevant globals: retailer-model shared module
- completion evidence: activation/deactivation and retailer ownership preserved

### Unit: purchases
- external trigger: `/api/purchases/**`
- read: `units/purchases/behavior.yaml`, `units/purchases/bindings.yaml`, `units/purchases/unit_decomposition.yaml`
- relevant globals: purchase-model/warranty-model shared modules and purchase-to-warranty state flow
- completion evidence: stock decrement, purchase/warranty creation, and duplicate validation

### Unit: billing
- external trigger: `/api/bills/**`
- read: `units/billing/behavior.yaml`, `units/billing/bindings.yaml`, `units/billing/unit_decomposition.yaml`
- relevant globals: purchase-model shared module
- completion evidence: totals, bill/purchase writes, and invoice route behavior

### Unit: warranties
- external trigger: `/api/customer/warranties/**`
- read: `units/warranties/behavior.yaml`, `units/warranties/bindings.yaml`, `units/warranties/unit_decomposition.yaml`
- relevant globals: warranty-model shared module and purchase-to-warranty flow
- completion evidence: ownership, coverage dates, and wallet contract

### Unit: public-verification
- external trigger: `/api/public/warranties/verify/{qrToken}`
- read: `units/public-verification/behavior.yaml`, `units/public-verification/bindings.yaml`, `units/public-verification/unit_decomposition.yaml`
- relevant globals: public-verification contract and warranty-model fields
- completion evidence: opaque QR lookup and privacy masking

### Unit: purchase-linking
- external trigger: `/api/customer/purchases/**`
- read: `units/purchase-linking/behavior.yaml`, `units/purchase-linking/bindings.yaml`, `units/purchase-linking/unit_decomposition.yaml`
- relevant globals: purchase-model and alt-email-verification modules
- completion evidence: OTP expiry/attempt limits and purchase ownership linking

### Unit: claims
- external trigger: `/api/claims/**`
- read: `units/claims/behavior.yaml`, `units/claims/bindings.yaml`, `units/claims/unit_decomposition.yaml`
- relevant globals: claim-model and notification/audit shared modules; warranty-to-claim flow
- completion evidence: every state transition, history, notification, audit, evidence upload, and feedback branch

### Unit: notifications
- external trigger: `/api/notifications/**`
- read: `units/notifications/behavior.yaml`, `units/notifications/bindings.yaml`, `units/notifications/unit_decomposition.yaml`
- relevant globals: notification-model shared module
- completion evidence: per-user scoping and read-one/read-all behavior

### Unit: warranty-reminders
- external trigger: configurable scheduled cron
- read: `units/warranty-reminders/behavior.yaml`, `units/warranty-reminders/bindings.yaml`, `units/warranty-reminders/unit_decomposition.yaml`
- relevant globals: reminder cron config, warranty-model and notification-model modules
- completion evidence: scheduled trigger, cron override, reminder selection, and notification writes

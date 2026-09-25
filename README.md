# CatGardens Care

Private mobile-responsive sanctuary records application built on Vinext with D1 and R2. See docs/product-research.md for researched product opportunities and the integration boundary.

## Care flows

- Demo sanctuary and separate real records.
- Resident profiles with food, medication, handling preferences and allergies.
- One-tap feeding observations, caregiver notes, weight history, original photos and veterinary documents.
- Daily prescribed medication schedules; given/skipped logs with authenticated attribution and unique scheduled-dose keys.
- Original document review queue and reviewed CSV resident imports.
- Per-resident preference cards and full veterinary reports, printable or saved as PDF via the browser print dialog.

## Access

Hosting is owner-private. API routes enforce the platform-authenticated identity on every record and file operation. Data is scoped by owner and demo/real mode. No clinic integration is active. Do not switch to broad public sharing as a substitute for implementing explicit team membership and roles.

## Runtime

Use the Sites build and hosting workflow. Generate database changes with the existing db:generate script. Keep applied migrations immutable. Source files include no application credentials or clinical production data.

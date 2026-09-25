# CatGardens Care — product research and integration plan

Reviewed 25 September 2026. Public feature pages establish advertised functionality; they do not establish that an unmentioned function is absent.

## Market baseline

| Platform | Publicly documented baseline | Implication for CatGardens |
| --- | --- | --- |
| Shelterluv | Medical records, vaccine/treatment/procedure/exam reminders, permissions, file storage; foster photo/medical updates and mobile field work | Generic medical charts and mobile access are not distinctive. |
| Pawct | Photos/custom animal fields, medical history, attachments, feeding/cleaning tasks, locations/colonies, audit trails, staff roles | Colony tracking, notes, attachments, and audit trails are already offered. |
| Animals First | Exams, medications, vaccination tasks and alerts, roles/permissions, migration, storage, shelter/field/TNVR workflows | Do not claim medication reminders or rescue operations are new. |
| Pet Friend | Dedicated shelter management platform and animal records | Require a workflow demonstration before asserting an absence of preference cards or clinic sync. |
| Aniday | Shelter records and adoption workflows | Require a workflow demonstration for one-tap feeding exceptions and medication handling preferences. |

Sources: https://www.shelterluv.com/product/features/ ; https://www.shelterluv.com/ ; https://pawct.com/ ; https://animalsfirst.com/ ; https://petfriend.io/animal-shelter-software ; https://www.aniday.io/software/animal-shelter

## Opportunities to validate with sanctuary caregivers

The differentiation hypothesis is reducing caregiver effort and improving the handover of individual knowledge, not simply adding more fields.

1. One-tap “Ate well / Ate some / Didn’t eat,” with identity and timestamp, visible last outcome, and an append-only observation history.
2. A prominent per-cat preference card with food, medication methods that work or fail, handling preferences, and allergies; printable for an external vet.
3. Medication administration that shows those preferences at the point of recording, distinguishes given and skipped, requires a skip reason, and prevents a duplicate scheduled-dose entry.
4. Reviewed veterinary record intake: preserve the original, match patient identities, distinguish a newly uploaded document from a reconciled treatment plan.
5. Lifetime-resident care and weight trends rather than an adoption-only primary journey.
6. Future validation: poor-connectivity workflows, clear unsynced state, photo-assisted matching, review escalation, appointment handover, and medication stock/refill tracking. These are not implemented in this first version.

No blanket assertion is made that competitors lack these functions. Trial each using a concrete scenario: a cat refuses breakfast and tablets, the next caregiver takes over, and the vet needs a preference card plus the relevant history.

## Veterinary integration

Official ezyVet documentation exposes REST APIs for animal and clinical records with OAuth 2 client credentials: https://developers.ezyvet.com/

Official Provet Cloud documentation describes REST APIs, webhooks, permissions, and application/access onboarding: https://developers.provetcloud.com/restapi/

These establish technical possibilities, not approved access to this sanctuary's veterinarian. First obtain the actual PIMS name/version, clinic approval, patient identifiers, export formats, supported scopes, vendor access/cost, and attachment coverage. Do not confuse the Provet product-supplier integration in ezyVet with Provet Cloud PIMS interoperability.

The current application supports original record attachments (PDF/images/CSV) and reviewed resident CSV imports. It does not parse PDFs, automatically reconcile medications, or sync to any clinic. Clinic details are saved locally to the private application; saving them sends no request to the vet.

A future connector should start read-only: backfill patient identities and original records, store vendor IDs/source timestamps and sync checkpoints, deduplicate, queue conflicts and prescription changes for review, then use a supported webhook or incremental poll. A changed clinic prescription must not silently overwrite a caregiver's active medication plan.

## Current delivery boundary

Private, owner-scoped mobile-responsive web application. Durable database and object storage, sample and real datasets, resident records/preferences/photos, medication plans and daily administration, feeding observations, notes, weights, source document review, resident CSV import, JSON export, full printable veterinary report and a separate printable preference card. Print dialogs support saving PDF.

This is a first sanctuary version, not a fully launched multi-tenant subscription business. Team invitations and role-based staff/veterinary access, external clinic connectors, billing, offline sync, native mobile packages, and automated reminders remain follow-on work. Files remain private and original attachments are downloaded separately from the printed summary. Daily medication schedules are supported; PRN and complex taper schedules are not automated.

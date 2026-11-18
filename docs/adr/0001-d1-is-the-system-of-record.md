# D1 is the system of record; HubSpot is a projection

Submissions, Leads, scores, Reasons, Generated Drafts and their provenance live in Cloudflare D1. HubSpot only receives a projection of them (custom-object properties and the app card) for Reps to work with. We chose this so a HubSpot outage or rate limit never loses data, so reprocessing and evaluation can read full history without HubSpot API calls, and so the CRM stays swappable behind an interface.

## Consequences

- Every write to HubSpot is a sync step that can be retried on its own, and it must be idempotent.
- Anything a Rep records in HubSpot, such as a Dismissal, must flow back into D1 to be part of the record.

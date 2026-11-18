# INIT Document

## 1. Scope

Purpose: a portfolio project built to production quality.
Secondary purpose: learning. The engineer must understand, review and own every piece of this codebase. How work is sized and paced for that lives in CLAUDE.md.
Simulated Tenant: a fictional US manufacturer of HVAC equipment that sells to commercial and light-commercial buyers only. Its default language is English. A residential Submission becomes an ordinary Lead that the Rep dismisses as not a fit; v1 does not score it specially.
Tenants: one Tenant today. Every record and every piece of configuration is scoped by Tenant, so supporting several Tenants later needs no redesign.
Cost target: €0/month on free tiers for everything that runs in production. Every provider sits behind an interface so it can be swapped. Offline evaluation may spend a few euros of API credits if a free Judge is not good enough.
Budget-aware Enrichment: Enrichment credits are limited (Apollo free plan, about 600 enrichments/day), so Enrichment is cached per Company and reused across its Leads. Development and evaluation use a fake or cached Enrichment provider behind the same interface, so they never spend real credits. A Tenant with a larger budget can change this through configuration, not redesign.
Human in the loop: the system never sends anything. A Rep reviews every Generated Draft and sends it, or records a Dismissal.
**Out of scope for v1:**

- spam filtering;
- data retention and deleting a Contact's data on request (if added later, full deletion is the only exception to a Submission never being modified);
- automatic sending;
- automatic assignment to Reps;
- per-Rep tone;
- reading external websites;
- Submission Sources other than Tally;
- Pairing, Sent Emails and Unanswered (measuring edits on real Sent Emails comes later);
- any special handling of Repeat Contacts: a new Submission from a known Contact simply creates a new Lead.

## 2. Problem Statement

A Seller receives a steady stream of Submissions from Contacts at companies it doesn't know yet. For each one, a Rep has to research the Company, decide whether it is legitimate and worth pursuing, and write a first reply from scratch. This takes a long time per Submission. Good Submissions wait behind bad ones because nothing ranks them.

## Solution

Every Submission that arrives through a Submission Source (Tally first) is processed automatically and shows up in HubSpot ready to work:

- It is validated and stored, and a Lead is created for it, linked to its Contact and, when there is a corporate domain, its Company. Either may be created at processing time. A Submission from a generic email domain (gmail.com, etc.) is linked to no Company, even if the form names one.
- An LLM extracts facts from the message into a typed schema. It never produces a score. Apollo enriches the Company by domain.
- Deterministic, versioned rules turn the extracted facts and the Enrichment into Fit and Intent, place them in Bands, assign a Tier (A/B/C), set Unverified Company and Unknown Fit when they apply, and write one Reason per rule that applied. The ideal-customer profile and the rules are configured per Tenant.
- An LLM writes a Generated Draft in the Seller's tone and in the Contact's language, with a call to action that fits the Tier.

The Rep opens a shared "Leads" view sorted by Priority, takes a Lead by becoming its owner, and sees an app card with the Tier, scores, and more metadata of the Lead. The Rep copies the Generated Draft into HubSpot's composer, or edits it and sends it from their own inbox, or records a Dismissal from the app card.

Reprocessing a Submission updates its existing Lead: Enrichment, scores, Tier and Reasons are recomputed and a new Generated Draft replaces the current one, keeping the previous ones in history. A Lead that already has a Dismissal or has been answered keeps its Generated Draft.

Extraction and Generated Draft quality are measured with offline evaluation harnesses.

## 3. Stack

- **Cloudflare, in TypeScript:** Workers, Queues, Workflows and D1. Learning this architecture is a goal of the project.
- **System of record:** D1 holds the Submission, the Lead, its scores, Reasons, Generated Drafts and their provenance. HubSpot is the Rep's working surface and receives a projection of that data. See docs/adr/0001-d1-is-the-system-of-record.md.
- **HubSpot:** developer test account (Enterprise trials, renewed every 90 days). The Lead is HubSpot's native Leads object, associated with the Contact and the Company. The Rep's UI is an app card (React/TypeScript) on the Lead record. HubSpot's automatic creation of Companies from email domains is turned off.
- **Companies are one set:** a Company in D1 and in HubSpot is the same record, linked by id. A Company a Rep creates by hand in HubSpot must also end up in D1. The system's existing company records, used for Trust, are these Companies. When processing a Submission, the domain is looked up in D1 first; if it is missing, HubSpot is searched by domain and a match is imported into D1 with its HubSpot id instead of creating a duplicate. Contacts work the same way, by email. Syncing through HubSpot webhooks comes later.
- **Language models:** chosen per role through configuration, behind one interface. Groq (free tier) for production extraction and drafting. The Judge and the generator of synthetic Evaluation Cases are different models from the production one. A Claude Pro plan has no API access, so it cannot be the automated Judge.
- **Enrichment:** Apollo, by domain, cached per Company. A found Enrichment is valid for 90 days; a not-found result is also cached, for 30 days. Both periods are configured per Tenant. Reprocessing reuses a valid cache unless forced.
- **Intake:** Tally form webhook, signature always verified, sent through an adapter into a canonical schema: name, email, company name (optional), message, Tally `submissionId`, submission time, and the raw payload untouched. Duplicate deliveries are discarded by `submissionId`.
- **Pipeline:** the intake Worker verifies, deduplicates, stores the Submission in D1, enqueues it and answers 200 (Tally retries after 10 s without a 2XX). A Queue consumer starts one Workflow per Lead: extraction, Enrichment, scoring, Generated Draft, HubSpot projection, each step with its own retries. The Queue absorbs bursts against the LLM rate limits.
- **Failures:** if a Lead cannot be fully processed after retries, it still appears in HubSpot, with no Generated Draft, Tier C and the Processing Failed flag, and it can be reprocessed. No Submission stays invisible.
- **Lead stages:** every new Lead enters the first stage of the native Leads pipeline. Reps take Leads from the Leads index view, not from the sales workspace, which only shows Leads that already have an owner. A Dismissal moves the Lead to the native disqualified stage and stores its reason in a property.
- **Reprocessing:** triggered in v1 through an authenticated admin endpoint of the Worker. The app card has no reprocess button.
- **App card calls:** the Worker accepts calls from the app card only with a valid HubSpot request signature.
- **Tenant configuration:** a versioned file per Tenant in the repo, bundled at build time, holding the ideal-customer profile, scoring rules, cache periods, default language, maximum length and Dismissal reasons. Every Lead records the configuration version it was scored with. A D1 table editable from a UI waits until there is more than one Tenant.
- **Environments:** local (`wrangler dev`, local D1, fake Apollo, real or recorded LLM) and one deployed environment (Cloudflare account, HubSpot test account, real Apollo with its cache). No staging while there is one Tenant and only test data.
- **Dismissal:** recorded from the app card through a Worker endpoint that writes it to D1 and then projects it to HubSpot. Closed list of reasons: follow-up of an existing lead, not a fit, not a real inquiry, already a customer, other (free text required).
- **Priority in HubSpot:** a single computed sort property (Tier, then Submission time, oldest first) on the Leads view. Sorting a Leads view by a custom property is not confirmed and is checked with a spike in the first HubSpot ticket.
- **Prompts, tone guide and rubric:** versioned files in the repo with the version in a header. The Worker bundles them at build time; the Python harnesses read them from disk.
- **Python:** only for the offline evaluation harnesses.

## 4. Generated Draft

- **Language:** the Generated Draft is written in the language of the Submission's message, as detected during extraction. When detection is unreliable, it uses the Tenant's default language.
- **Length:** at most 150 words to start with, configured per Tenant and tuned over time.
- **Inputs:**
  - the extracted fields;
  - the Enrichment;
  - the Tier, with a different instruction per Tier (A: direct, e.g. propose a call this week; C: exploratory). Whether and how the call to action changes per Tier is decided later, once the Dev Set and its Reference Emails exist;
  - the tone guide.
- **What it never contains:** scores, the Tier, or the Unverified Company and Unknown Fit flags.
- **Provenance:** every Generated Draft records the model, prompt version, tone-guide version, Tier and language used to generate it.

## 5. Scoring

- **Bands:** Fit and Intent are each 0–100. High is ≥70, medium 40–69, low <40.
- **Matrix:** high + high = A; high + medium, in either order, = B; everything else = C.
- **Trust:** whether the Company was found in Enrichment or in the system's existing company records. It is yes or no, not a score. It never changes the Tier; a no marks the Lead with Unverified Company.
- **Unknown Fit:** without Enrichment, Fit is unknown, which is not the same as low. For the matrix it counts as medium: high Intent gives B, medium or low Intent gives C. A is reserved for a known Fit, even though contractors often write from generic domains; revisit if real data shows good Leads being held back. The Lead is marked with Unknown Fit.
- **Fit rules:** one rule per Apollo field (industry, employee count, US location, and revenue as a secondary signal), each adding its points and writing its Reason, configured per Tenant. Initial values for the HVAC Tenant, to be tuned later:

  | Rule (Apollo field) | Matches when… | Points |
  |---|---|---|
  | Industry | mechanical/HVAC contractors, construction and general contractors, HVAC and building-materials wholesale, facilities services, commercial real estate | 40 |
  | Employee count | 10–1,000 | 25 |
  | Location | headquarters or offices in the US | 25 |
  | Revenue | ≥ $2M/year (secondary signal) | 10 |

- **Extraction schema and Intent rules:** deliberately open. They are decided later.

## 6. Evaluation

- **What is evaluated:** extraction and Generated Draft writing, each with its own Dev Set and Hold-out Set.
- **Where the cases come from:**
  - hand-written and synthetic Evaluation Cases. Synthetic cases are generated with a different model from production, and cover:
    - every Tier;
    - English and Spanish;
    - generic email domains;
    - vague messages;
    - very long messages;
    - companies Apollo doesn't know;
  - for extraction, the expected result is the schema filled in by hand;
  - for Generated Drafts, the expected result is a Reference Email written by the project owner acting as a Rep;

- **How a Generated Draft is scored:**
  - **Deterministic hard checks, any failure disqualifies:**
    - correct language;
    - no mention of scores, the Tier, Unverified Company or Unknown Fit;
    - no facts that are absent from the Submission or the Enrichment;
    - maximum length;
    - the call to action expected for that Tier (deferred with the per-Tier decision).
  - **Judge:** a stronger model, different from the generator, scores against a versioned, hand-calibrated rubric covering tone match, personalization and naturalness compared with the Reference Email.
  - **Secondary metric:** edit distance to the Reference Email, the same metric later used on real Sent Emails.
- **Splits:** about 70/30, stratified by Tier, language and generic vs corporate domain.
  - Initial size for Generated Drafts: about 60 dev + 25 hold-out.
  - Initial size for extraction: about 100 dev + 40 hold-out.
- **Recording:** every run records the prompt, model, rubric and set versions.

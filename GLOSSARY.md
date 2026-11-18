# Inbound Lead Qualification

A workflow that receives submissions from new companies, turns each into a lead, qualifies and enriches it, and prepares a first message for a rep to review.

## Actors

**Tenant**:
The organization that receives submissions and whose reps work the resulting leads. There is one today, but the model supports several.

**Rep**:
A person at the Tenant who reviews a qualified lead and decides whether to act on it.
_Avoid_: Agent, salesperson, SDR, user

## Intake

**Submission**:
The raw message a person sends through a submission source at a given moment, stored exactly as received and never modified. It is recorded before any processing, so a failure later never loses it, and it can be reprocessed. If the same person writes twice, that is two submissions.
_Avoid_: Lead, form, entry, payload

**Lead**:
The work item the system creates from a submission. It links the contact and, when the submission has a corporate domain, the company (either may be created from that same submission) and carries everything derived from it: enrichment, scores, tier, reasons and generated draft. It is what reps review and work, in the interface and in code alike. Today each submission produces exactly one lead.
_Avoid_: Opportunity, ticket, request

**Contact**:
The person who sends a submission. A contact can have many submissions, and therefore many leads.
_Avoid_: Lead, prospect, user

**Company**:
A business that contacts belong to. A submission can create one or link to an existing one, but companies can also be created by other means. It is never the Tenant.
_Avoid_: Prospect company, account, customer, organization

**Submission Source**:
The channel a submission arrives through (web form, email, etc.).
_Avoid_: Source (on its own), origin, channel

## Qualification

**Enrichment**:
Data about the company obtained from an external provider using its domain. It describes the company, so it is obtained once and reused by every lead of that company. Without a corporate domain, the lead stays unenriched.
_Avoid_: Research, scraping

**Fit**:
How well the company matches the Tenant's ideal customer. Without enrichment, fit is unknown, which is not the same as low: the lead is not penalized, it counts as medium when computing the tier, and it is marked with Unknown Fit.
_Avoid_: Match, ICP score

**Intent**:
How strongly a lead's submission indicates the contact wants to buy soon.
_Avoid_: Interest, urgency

**Trust**:
Whether the company was found in enrichment or in the system's existing company records. It is yes or no, not a score. It never changes the tier; a no marks the lead with Unverified Company.
_Avoid_: Legitimacy, trust score

**Band**:
The high, medium or low classification of a fit or intent score, according to fixed thresholds. The tier is computed from bands, not from raw scores. An unknown fit has no band.
_Avoid_: Range, bucket, category

**Tier**:
The final rank of a lead: A, B or C. It comes from combining the fit and intent bands. When fit is unknown, it counts as medium, so such a lead can reach B but never A. Trust never changes it.
_Avoid_: Grade, level, rating

**Priority**:
The order in which reps work leads: by tier first, then oldest first within each tier.
_Avoid_: Ranking, combined score

**Unverified Company**:
A flag telling the rep the company was not found in enrichment or in the system's existing company records, so its legitimacy has not been confirmed. It is set when trust is no and does not change the tier. How the rep acts on it is up to them.
_Avoid_: Needs verification, suspicious, spam

**Unknown Fit**:
A flag telling the rep that no company data was found, so fit counted as medium when computing the tier. It requires no action.
_Avoid_: Low fit, missing fit

**Processing Failed**:
A flag telling the rep that the system could not finish qualifying a lead, so it has no generated draft and its tier defaults to C. The lead can be reprocessed.
_Avoid_: Error, broken lead

**Reason**:
A human-readable explanation of one scoring rule applied to a lead, so the rep understands its tier.
_Avoid_: Explanation, log, rationale

**Repeat Contact**:
A contact who has sent submissions before, and therefore has previous leads. It is not part of intent. It is not a duplicate submission, which is the same message delivered twice and is discarded on arrival.
_Avoid_: Duplicate, repeated lead

## Review

**Generated Draft**:
The first message the system writes with a language model for a lead, replying to its submission. The rep reviews and edits it, then sends it or dismisses the lead. The system never sends it on its own. Reprocessing the submission writes a new generated draft that replaces the current one; earlier ones are kept as history.
_Avoid_: Draft (on its own), template, auto-reply, suggestion, email

**Sent Email**:
The message the rep sends to the contact for a lead, starting from the generated draft. It is compared with the generated draft to measure edits.
_Avoid_: Reply, final email

**Pairing**:
The link between a generated draft and its sent email: the first outbound email to the contact after the generated draft was created.
_Avoid_: Match, linking

**Dismissal**:
A rep's explicit decision that a lead needs no reply of its own, with a dismissal reason from a closed list. One reason is that the lead is a follow-up of an existing lead, to be handled in that conversation instead.
_Avoid_: Rejection, archive

**Unanswered**:
The state of a lead that, after its deadline, has neither a sent email nor a dismissal.
_Avoid_: Abandoned, expired

## Evaluation

**Evaluation Case**:
A test submission with its expected outcome: the correct extracted schema or a reference email.
_Avoid_: Example, test case, sample

**Reference Email**:
The email a rep would ideally send for an evaluation case. It is the benchmark a generated draft is judged against.
_Avoid_: Gold, correct answer

**Dev Set**:
The evaluation cases a prompt is freely iterated against.
_Avoid_: Development set, training set

**Hold-out Set**:
The frozen evaluation cases used only to approve a new prompt version, never to tune it.
_Avoid_: Test set, validation set

**Judge**:
The model that scores a generated draft against a rubric. It is a different model from the one that writes the generated draft.
_Avoid_: Evaluator, grader

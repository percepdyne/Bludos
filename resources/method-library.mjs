// Bludos Method Library — hand-curated, detailed templates translated from
// proven procedures in other industries (automotive, aerospace, medical,
// software, lean manufacturing, military) into the product-design process.
// Consumed by scripts/build-templates.mjs and merged into src/templates.json.
//
// Body conventions: italic intro = how to use; tables and checklists are the
// working surfaces. The build script wraps every body with a doc-control
// header ({{DOC}}, {{DATE}} tokens) and a revision-history footer.

export default [
  {
    id: 'm-research',
    title: 'Methods — Research & Discovery',
    source: 'Adapted from IDEO HCD, GV Design Sprint, Nielsen Norman, JTBD (Moesta/Klement)',
    defaultFolderIndex: 1,
    templates: [
      {
        title: 'User Interview Guide & Debrief',
        body: `*Run one file per interview round. Fill the guide before the first session; debrief within 30 minutes of each session while memory is fresh.*

## Objective
- [ ] Research question this round must answer:
- [ ] Decision that will be made with the answer:

## Participant Screener
| Criterion | Must have | Nice to have | Disqualifier |
| --- | --- | --- | --- |
|  |  |  |  |

## Session Plan (60 min)
| Segment | Time | Prompts |
| --- | --- | --- |
| Warm-up & consent | 5 | Recording consent, role, context |
| Recent-past story | 20 | "Walk me through the last time you…" |
| Deep dive | 25 | Follow the pain, ask "why" not "would you" |
| Wrap | 10 | "What should I have asked?" |

## Question Bank
- [ ] Tell me about the last time you … (specific incident, not habits)
- [ ] What were you using before? What pushed you to change?
- [ ] What almost stopped you? (anxieties, habits)
- [ ] Who else was involved in that decision?

## Debrief (per session — copy per participant)
| Observation | Verbatim quote | Interpretation | Confidence |
| --- | --- | --- | --- |
|  |  |  |  |

## Top 3 Insights This Round
1.
2.
3.
- [ ] Insights logged to Research Synthesis page
- [ ] Assumption log updated (confirmed / busted items)`,
      },
      {
        title: 'Usability Test Plan & Script',
        body: `*One file per test round. Metrics follow the classic usability trio: effectiveness, efficiency, satisfaction (SUS).*

## Test Setup
- [ ] Prototype / build under test (link or archive ref):
- [ ] Fidelity: paper / CAD render / works-like / looks-like / production-intent
- [ ] Environment: lab / field / remote
- [ ] Participants planned: n = 5 per segment (Nielsen)

## Tasks
| # | Task scenario (user's words, no UI terms) | Success criterion | Max time |
| --- | --- | --- | --- |
| 1 |  |  |  |
| 2 |  |  |  |

## Session Script
- [ ] Consent + recording permission
- [ ] "Think aloud — there are no wrong answers, we are testing the design, not you."
- [ ] Run tasks without helping; note where you were tempted to intervene
- [ ] Post-task: "What was going through your mind when…?"

## Metrics per Participant
| P# | Task | Completed? | Time | Errors | Quotes |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## SUS — System Usability Scale (all 10 standard items, score 1–5)
| # | Item | P1 | P2 | P3 | P4 | P5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | I think I would like to use this product frequently |  |  |  |  |  |
| 2 | I found the product unnecessarily complex |  |  |  |  |  |
| 3 | I thought the product was easy to use |  |  |  |  |  |
| 4 | I think I would need support of a technical person to use it |  |  |  |  |  |
| 5 | I found the various functions well integrated |  |  |  |  |  |
| 6 | I thought there was too much inconsistency |  |  |  |  |  |
| 7 | I imagine most people would learn this very quickly |  |  |  |  |  |
| 8 | I found the product very cumbersome to use |  |  |  |  |  |
| 9 | I felt very confident using the product |  |  |  |  |  |
| 10 | I needed to learn a lot before I could get going |  |  |  |  |  |

*Scoring: odd items contribute (score − 1), even items contribute (5 − score); sum × 2.5 = 0–100. Average SUS is 68.*

## Findings & Severity (Nielsen 0–4)
| Finding | Severity | Evidence | Recommendation |
| --- | --- | --- | --- |
|  |  |  |  |
- [ ] Severity ≥3 findings entered into risk register / backlog`,
      },
      {
        title: 'Competitive Teardown Report',
        body: `*One file per competitor unit. Photograph every step before separating parts; log costs as estimates with confidence levels.*

## Unit Under Teardown
| Field | Value |
| --- | --- |
| Product / SKU |  |
| Retail price / street price |  |
| Purchase date & source |  |
| Serial / build date code |  |

## Disassembly Log
| Step | Part exposed | Fastening method | Tool needed | Time | Photo ref |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |

## Estimated BOM Cost
| Subsystem | Key components | Est. cost | Confidence (H/M/L) |
| --- | --- | --- | --- |
| Enclosure |  |  |  |
| PCBA |  |  |  |
| Battery / power |  |  |  |
| Packaging |  |  |  |
| **Total** |  |  |  |

## Notable Design Solutions (steal-worthy)
- [ ]

## Weaknesses & Failure Points Observed
- [ ]

## IP & Regulatory Flags
- [ ] Visible patent markings noted (numbers listed below)
- [ ] Certification marks photographed (FCC ID, CE, etc.)
- [ ] Anything we must NOT copy flagged to IP counsel`,
      },
      {
        title: 'JTBD & Forces of Progress Canvas',
        body: `*Jobs-to-be-Done framing: customers "hire" products to make progress. Complete after interview rounds, not before.*

## Main Job Statement
> When I **[situation]**, I want to **[motivation]**, so I can **[expected outcome]**.

## Job Layers
- [ ] Functional job:
- [ ] Emotional job (how they want to feel):
- [ ] Social job (how they want to be seen):

## Forces of Progress
| Force | Working for the switch | Working against |
| --- | --- | --- |
| Push of the current situation |  | — |
| Pull of the new solution |  | — |
| Anxiety of the new | — |  |
| Habit of the present | — |  |

## Hiring Criteria (what the product is judged on)
| Criterion | Importance (1–5) | Current satisfaction (1–5) | Opportunity = Imp + (Imp − Sat) |
| --- | --- | --- | --- |
|  |  |  |  |

## Implications
- [ ] Top opportunity scores translated into PRD requirements
- [ ] Anxieties addressed in onboarding / OOBE design`,
      },
      {
        title: 'Field Study Log (Contextual Inquiry)',
        body: `*Observe users in their real environment. Use AEIOU to structure raw notes; capture breakdowns — they are design gold.*

## Study Context
- [ ] Location & date:
- [ ] User(s) observed, role:
- [ ] Duration:
- [ ] Consent for photos / recording obtained

## AEIOU Observations
| Lens | Notes |
| --- | --- |
| **A**ctivities (goal-directed sets of actions) |  |
| **E**nvironment (space, lighting, noise, temperature) |  |
| **I**nteractions (between people, people–objects) |  |
| **O**bjects (tools, workarounds, sticky notes, tape!) |  |
| **U**sers (who, skills, values, biases) |  |

## Breakdowns & Workarounds Observed
| What broke down | User's workaround | Frequency | Design implication |
| --- | --- | --- | --- |
|  |  |  |  |

## Environment Constraints for Our Design
- [ ] Gloves / PPE worn? Touch targets and grips affected:
- [ ] Ambient noise level → audio feedback viability:
- [ ] Lighting conditions → display / LED requirements:
- [ ] Connectivity available on site:

## Photos & Artifacts
- [ ] Archived with tags (list archive refs):`,
      },
      {
        title: 'Survey Design Worksheet',
        body: `*Design the analysis before the survey. Every question must map to a decision; delete any that don't.*

## Research Questions → Survey Items
| Research question | Survey item(s) | Scale type | Decision it informs |
| --- | --- | --- | --- |
|  |  |  |  |

## Bias Checklist (review every item)
- [ ] No leading wording ("How much do you love…")
- [ ] No double-barreled questions (two asks in one)
- [ ] Balanced scales with a genuine midpoint
- [ ] Randomized option order where order could bias
- [ ] Screener excludes professional survey-takers

## Sampling Plan
- [ ] Target population & frame:
- [ ] Required n for ±5% at 95% confidence: (≈385 for large populations)
- [ ] Segments requiring quota:

## Pilot
- [ ] Piloted with 5–10 respondents; confusing items rewritten
- [ ] Median completion time: ______ (target < 8 min)

## Analysis Plan
- [ ] Cross-tabs planned:
- [ ] Statistical tests planned (chi-square, t-test):
- [ ] Raw data export archived on close`,
      },
    ],
  },
  {
    id: 'm-strategy',
    title: 'Methods — Strategy & Decisions',
    source: 'Adapted from Amazon Working Backwards, DACI (Atlassian), ADR (Nygard), Toyota A3, Kano, Klein premortem',
    defaultFolderIndex: 0,
    templates: [
      {
        title: 'PR/FAQ — Working Backwards',
        body: `*Amazon's method: write the launch press release before building anything. If the PR isn't exciting, the product won't be. Keep the PR to one page.*

## Press Release (draft as if launching today)
**Headline:** (customer benefit in one line)

**Subheading:** (who it's for and why they should care)

**Problem paragraph:** (the pain, in the customer's words)

**Solution paragraph:** (how the product solves it — no feature lists)

**Customer quote:** (invented but plausible)

**Company quote:**

**Call to action:** (how they get it, price)

## Internal FAQ (hard questions we must answer)
- [ ] What is the total cost to build and unit economics at 1k / 10k / 100k?
- [ ] Why now? What changed in technology or market?
- [ ] What is the single riskiest assumption, and how do we test it cheapest?
- [ ] What would make us kill this project?

## External FAQ (what customers will ask)
- [ ] How is this different from [main competitor]?
- [ ] What happens to my data / does it work offline?
- [ ] What's the warranty / lifetime?

## Success Metrics
| Metric | Target at 6 months | Measurement method |
| --- | --- | --- |
|  |  |  |`,
      },
      {
        title: 'Decision Memo (DACI)',
        body: `*One decision per memo. The Driver writes it; the Approver decides by the date below. Reversible decisions should be fast — note the reversibility class.*

## Decision Required
> (One sentence, phrased as a question)

**Decide by:** {{DATE}} · **Reversibility:** one-way door / two-way door

## DACI Roles
| Role | Person |
| --- | --- |
| **D**river (runs the process) |  |
| **A**pprover (one person decides) |  |
| **C**ontributors (consulted for input) |  |
| **I**nformed (told the outcome) |  |

## Context (5 sentences max)


## Options Considered
| Option | Cost / effort | Key risk | Reversibility | Recommendation |
| --- | --- | --- | --- | --- |
| A |  |  |  |  |
| B |  |  |  |  |
| Do nothing |  |  |  |  |

## Recommendation & Rationale


## Decision
- [ ] Decided: ______ on ______ by ______
- [ ] Revisit trigger (what new information reopens this):
- [ ] Informed list notified`,
      },
      {
        title: 'Design Decision Record (DDR)',
        body: `*Borrowed from software ADRs: a short, immutable record per significant design decision. Never edit a decided record — supersede it with a new one and link back.*

**Status:** proposed / accepted / superseded by [[link]]

## Context
(What forces are at play — requirements, constraints, politics. Written so a new team member understands in 2 minutes.)

## Decision
(One paragraph, active voice: "We will…")

## Consequences
**Positive:**
- [ ]

**Negative / accepted debt:**
- [ ]

## Alternatives Rejected
| Alternative | Why rejected |
| --- | --- |
|  |  |

## Links
- Related requirements:
- Related test evidence:
- Supersedes / superseded by:`,
      },
      {
        title: 'A3 Problem-Solving Sheet',
        body: `*Toyota's one-page method. The discipline is fitting the whole story on one "A3": if it doesn't fit, you don't understand the problem yet. Go and see (genchi genbutsu) before writing.*

## 1. Background
(Why this matters to the business — 2 sentences)

## 2. Current Condition
(Facts and data from direct observation, not opinions)
| Metric | Current value | Data source |
| --- | --- | --- |
|  |  |  |

## 3. Target Condition
| Metric | Target | By when |
| --- | --- | --- |
|  |  |  |

## 4. Root-Cause Analysis (5-Why)
| Why # | Question | Answer (verified how?) |
| --- | --- | --- |
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |

## 5. Countermeasures
| Countermeasure | Owner | Due | Expected effect |
| --- | --- | --- | --- |
|  |  |  |  |

## 6. Follow-up / Check
- [ ] Check date set: ______
- [ ] Result vs target measured:
- [ ] Standardized (updated SOP / template / design rule) or next A3 opened`,
      },
      {
        title: 'Kano Prioritization Worksheet',
        body: `*Classify features by how they create satisfaction. Survey users with paired functional/dysfunctional questions, then place each feature in a category.*

## Feature Classification
| Feature | "If present, how do you feel?" | "If absent, how do you feel?" | Kano category |
| --- | --- | --- | --- |
|  |  |  |  |

**Answer scale:** I like it / I expect it / Neutral / I can tolerate it / I dislike it

**Category rules:**
- **Must-be** — absence causes dislike, presence is expected (ship or die)
- **Performance** — more is linearly better (compete here)
- **Attractive / Delighter** — unexpected joy (differentiate here)
- **Indifferent** — nobody cares (cut it)
- **Reverse** — presence annoys (cut it fast)

## Portfolio Balance Check
- [ ] All Must-be features committed for v1
- [ ] At least one genuine Delighter survives cost-down
- [ ] Indifferent features removed from BOM/scope with savings noted:

## Decisions
| Feature | Keep / cut / defer | Rationale |
| --- | --- | --- |
|  |  |  |`,
      },
      {
        title: 'Project Premortem',
        body: `*Gary Klein's method: imagine the project has already failed, then work backwards. Run it at kickoff and again before design freeze — people voice risks in a premortem that they'd never raise in a status meeting.*

## Setup
> It is {{DATE}} + 12 months. The product shipped and it failed badly. Write the story of what went wrong.

- [ ] Every team member writes failure reasons silently for 5 minutes first (no discussion)

## Failure Reasons (collected, deduplicated)
| # | Failure reason | Likelihood (1–5) | Impact (1–5) | Score | Preventable? |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## Top Risks → Mitigations
| Risk | Mitigation owner | Mitigation action | Trigger / early-warning signal |
| --- | --- | --- | --- |
|  |  |  |  |

## Actions
- [ ] Top 5 risks copied into the project risk register
- [ ] Early-warning signals added to weekly review agenda
- [ ] Any "unpreventable" showstoppers escalated to sponsor now`,
      },
    ],
  },
  {
    id: 'm-quality',
    title: 'Methods — Quality, Risk & Reliability',
    source: 'Adapted from AIAG-VDA FMEA, Ford 8D, Six Sigma DMAIC, automotive DVP&R, Ishikawa',
    defaultFolderIndex: 3,
    templates: [
      {
        title: 'DFMEA Worksheet',
        body: `*Design Failure Mode & Effects Analysis. Work function-by-function, not part-by-part. Rate Severity, Occurrence, Detection 1–10; act on Severity ≥8 regardless of RPN.*

## Scope
- [ ] System / subsystem / component analyzed:
- [ ] Team (cross-functional — design, test, manufacturing):
- [ ] Baseline design revision:

## Analysis
| Item / function | Failure mode | Effect of failure | SEV | Cause / mechanism | OCC | Current prevention control | Current detection control | DET | RPN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |

**Action thresholds:** SEV ≥ 8 → mandatory action · RPN ≥ 100 → action required · RPN ≥ 40 → review

## Recommended Actions
| Action | Owner | Due | Revised SEV | Revised OCC | Revised DET | Revised RPN |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## Sign-off
- [ ] All SEV ≥ 8 items have completed actions or documented risk acceptance by engineering lead
- [ ] FMEA revision archived before design freeze`,
      },
      {
        title: '8D Corrective Action Report',
        body: `*Ford's Eight Disciplines — the industry standard for responding to a serious quality escape. D3 containment within 24 h; never skip D4 root cause to jump to a fix.*

## D0 — Trigger
- [ ] Problem detected on (date/build/serial range):

## D1 — Team
| Role | Name |
| --- | --- |
| Champion |  |
| Team lead |  |
| Members |  |

## D2 — Problem Description (5W2H)
| Question | Answer |
| --- | --- |
| What is wrong with what? |  |
| Where detected? |  |
| When first seen? |  |
| Who found it? |  |
| How many / how big (quantify)? |  |
| How detected? |  |

## D3 — Interim Containment (within 24 h)
- [ ] Suspect stock quarantined (locations & quantities):
- [ ] Customer / field exposure assessed:
- [ ] Containment effectiveness verified (0 escapes since):

## D4 — Root Cause (verified, not guessed)
- [ ] Root cause of OCCURRENCE:
- [ ] Root cause of NON-DETECTION (why did our controls miss it?):
- [ ] Evidence: root cause can be turned on/off experimentally

## D5 — Chosen Permanent Corrective Actions
| Action | Addresses (occurrence/detection) | Owner | Due |
| --- | --- | --- | --- |
|  |  |  |  |

## D6 — Implementation & Validation
- [ ] Implemented on (date/build):
- [ ] Validation data (n units, 0 recurrence):

## D7 — Prevent Recurrence
- [ ] DFMEA / PFMEA updated
- [ ] Design rules / checklists / templates updated
- [ ] Similar products audited for same weakness

## D8 — Team Recognition & Closure
- [ ] Closed by champion on: ______`,
      },
      {
        title: 'DVP&R — Verification Plan & Report',
        body: `*Design Verification Plan & Report — one living matrix that says how every requirement gets proven. Plan columns filled at design; Report columns filled as results land.*

## Test Matrix
| # | Requirement (RTM ref) | Test method / standard | Acceptance criteria | Sample size | Phase (EVT/DVT/PVT) | Owner | Result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |  | ⬜ |

**Status legend:** ⬜ not started · 🔵 in progress · ✅ pass · ❌ fail → CAR raised · ⚠ pass w/ deviation

## Coverage Check
- [ ] Every PRD requirement appears at least once in the matrix
- [ ] Every safety-critical requirement has TWO independent verification methods
- [ ] Sample sizes justified (attribute data ≥ 30, variable data ≥ 10, or rationale noted)

## Failures & Corrective Actions
| Test # | Failure description | CAR / 8D link | Retest result |
| --- | --- | --- | --- |
|  |  |  |  |

## Completion
- [ ] All rows ✅ or ⚠ with signed deviation
- [ ] Report archived as gate evidence`,
      },
      {
        title: 'Root Cause — 5-Why + Fishbone',
        body: `*Use fishbone (Ishikawa) to open the search space, then 5-Why to drill the most likely branch. A root cause you can't verify experimentally is a hypothesis, not a cause.*

## Problem Statement (specific, measurable, no causes embedded)
>

## Fishbone Branches (6M) — brainstorm candidate causes
| Branch | Candidate causes |
| --- | --- |
| Man / people |  |
| Machine / equipment |  |
| Material |  |
| Method / process |  |
| Measurement |  |
| Milieu / environment |  |

## 5-Why Drill (most likely branch)
| Why | Answer | Verified by (data / test / observation) |
| --- | --- | --- |
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |

## Verified Root Cause
- [ ] Can we switch the problem ON by introducing the cause?
- [ ] Can we switch it OFF by removing the cause?

## Countermeasure
| Action | Owner | Due | Effectiveness check date |
| --- | --- | --- | --- |
|  |  |  |  |`,
      },
      {
        title: 'Risk Register',
        body: `*One live register per project. Review at every gate and every other weekly. A risk without an owner and a trigger is a worry, not a managed risk.*

## Scoring Rubric
**Probability:** 1 rare · 2 unlikely · 3 possible · 4 likely · 5 near-certain
**Impact:** 1 negligible · 2 minor · 3 significant · 4 major · 5 program-killing
**Score = P × I** → ≥15 red (act now) · 8–12 amber (mitigation planned) · ≤6 green (monitor)

## Register
| ID | Risk (event → consequence) | Category (tech/market/supply/reg) | P | I | Score | Owner | Mitigation | Trigger / early warning | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 |  |  |  |  |  |  |  |  |  |

## Review Log
| Date | Risks added | Risks closed | Escalations |
| --- | --- | --- | --- |
|  |  |  |  |

## Standing Checks
- [ ] Every red risk reviewed with sponsor this month
- [ ] Premortem findings merged in
- [ ] Retired risks kept (struck through), never deleted`,
      },
      {
        title: 'Tolerance Stack-Up Worksheet',
        body: `*Prove the critical gap works at manufacturing extremes before cutting tools. Do worst-case for safety-critical fits; RSS for cosmetic fits.*

## Critical Requirement
- [ ] Gap / fit being analyzed:
- [ ] Functional requirement (min/max gap):
- [ ] Drawing refs:

## Stack Contributors
| # | Dimension description | Nominal | Tolerance ± | Direction (+/−) | Distribution assumed |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |

## Results
| Method | Min gap | Max gap | Requirement met? |
| --- | --- | --- | --- |
| Worst case |  |  |  |
| RSS (statistical) |  |  |  |

## Decision
- [ ] PASS — margins documented
- [ ] FAIL → options considered: tighten tolerance (cost?), re-datum, redesign joint
- [ ] Cpk assumption for RSS stated (default 1.33) and flagged to supplier quality`,
      },
    ],
  },
  {
    id: 'm-reviews',
    title: 'Methods — Reviews, Gates & Retros',
    source: 'Adapted from NASA SE Handbook reviews, US Army AAR, agile retrospectives, structured critique',
    defaultFolderIndex: 4,
    templates: [
      {
        title: 'Design Review Package (PDR/CDR)',
        body: `*NASA-style review discipline: a review is an evidence audit, not a slideshow. Entry criteria gate the meeting; every discrepancy gets logged and dispositioned.*

## Review Identity
| Field | Value |
| --- | --- |
| Review type | PDR / CDR / delta |
| Design baseline under review |  |
| Chair / independent reviewer |  |
| Date |  |

## Entry Criteria (all must be true before scheduling)
- [ ] Requirements baselined; RTM current
- [ ] Analysis reports (FEA/thermal/tolerance) released, not draft
- [ ] Open risk register attached
- [ ] Prior review actions closed or dispositioned
- [ ] Package distributed ≥ 3 working days before review

## Agenda
| Item | Presenter | Time | Evidence document |
| --- | --- | --- | --- |
|  |  |  |  |

## Review Item Discrepancies (RID log)
| RID # | Raised by | Description | Severity (blocker/major/minor) | Owner | Due | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## Exit Criteria & Outcome
- [ ] Zero open blocker RIDs
- [ ] Board decision: **proceed / proceed-with-actions / re-review**
- [ ] Sign-offs recorded (chair, engineering, quality)`,
      },
      {
        title: 'After-Action Review (AAR)',
        body: `*US Army format: fast, blameless, focused on the delta between plan and reality. Run within 48 h of the event (build, test session, launch) while details are fresh. No slides.*

## Event Reviewed
- [ ] Event & date:
- [ ] Participants present:

## The Four Questions
### 1. What was supposed to happen?
(The plan, the intent, the expected numbers)

### 2. What actually happened?
(Facts and timeline first — no interpretation yet)

### 3. Why were there differences?
| Difference | Cause (system, not person) |
| --- | --- |
|  |  |

### 4. What will we do about it?
| Sustain (worked — keep doing) | Improve (change next time) |
| --- | --- |
|  |  |

## Actions
| Action | Owner | Due |
| --- | --- | --- |
|  |  |  |

- [ ] Lessons pushed to the relevant template / SOP / design rule (not just this page)`,
      },
      {
        title: 'Structured Design Critique',
        body: `*Critique ≠ approval meeting. The presenter states what feedback they want; reviewers use "notice / wonder / suggest" so opinions stay attached to observations.*

## Session Setup
- [ ] Work under critique (renders / CAD / prototype refs):
- [ ] Design stage: exploring / converging / refining
- [ ] Feedback wanted on: ______ · Feedback NOT wanted on: ______

## Ground Rules
- [ ] Critique the work, not the designer
- [ ] Reactions anchored to project goals & design principles, not taste
- [ ] Presenter listens; defends nothing until the end

## Feedback Log
| Reviewer | I notice… (observation) | I wonder… (question) | I suggest… (optional) |
| --- | --- | --- | --- |
|  |  |  |  |

## Themes (clustered after the session)
1.
2.

## Presenter's Decisions
| Theme | Adopt / explore / decline | Rationale |
| --- | --- | --- |
|  |  |  |`,
      },
      {
        title: 'Build / Sprint Retrospective',
        body: `*Run at the end of every build cycle (proto round, EVT loop, sprint). Data first, feelings second, max three experiments out.*

## Cycle Data
| Metric | Planned | Actual |
| --- | --- | --- |
| Scope items completed |  |  |
| Defects / NCRs found |  |  |
| Cycle duration |  |  |

## The Board
| ✅ Went well | ❌ Didn't go well | ❓ Puzzles us |
| --- | --- | --- |
|  |  |  |

## Root of the Biggest Friction (one 5-why, 5 minutes)
>

## Experiments for Next Cycle (max 3, each testable)
| Experiment | Owner | How we'll know it worked |
| --- | --- | --- |
|  |  |  |

- [ ] Last cycle's experiments reviewed: kept / killed
- [ ] One improvement promoted into standard practice (template/SOP updated)`,
      },
      {
        title: 'Gate Review Minutes & Scorecard',
        body: `*The formal record of a phase-gate decision. Attach the phase's Gate Checklist page as evidence; grade every criterion R/Y/G before discussing the decision.*

## Gate
| Field | Value |
| --- | --- |
| Phase gate | Phase __ → Phase __ |
| Date & attendees |  |
| Decision authority |  |

## Scorecard
| Gate criterion | Evidence (doc refs) | Status (🟢/🟡/🔴) | Notes |
| --- | --- | --- | --- |
|  |  |  |  |

## Open Risks Accepted Through the Gate
| Risk ID | Why acceptable | Review date |
| --- | --- | --- |
|  |  |  |

## Decision
- [ ] **GO** — proceed to next phase
- [ ] **GO WITH CONDITIONS** — conditions listed below with owners & dates
- [ ] **HOLD** — recycle criteria listed
- [ ] **KILL** — archive per program archive procedure

| Condition | Owner | Due |
| --- | --- | --- |
|  |  |  |

## Sign-offs
| Role | Name | Date |
| --- | --- | --- |
| Program sponsor |  |  |
| Engineering |  |  |
| Quality |  |  |`,
      },
    ],
  },
  {
    id: 'm-regulated',
    title: 'Methods — Regulated-Industry Practice',
    source: 'Adapted from FDA 21 CFR 820.30 design controls, AIAG APQP/PPAP, configuration management (ECO)',
    defaultFolderIndex: 5,
    templates: [
      {
        title: 'Design History File (DHF) Index',
        body: `*Medical-device discipline applied anywhere: one index that proves the design followed a controlled process. Every row points to a real archived document.*

## Product & Scope
- [ ] Product / variant covered:
- [ ] Period covered:

## 1. Design & Development Plans
| Doc | Rev | Location / archive ref |
| --- | --- | --- |
|  |  |  |

## 2. Design Inputs (requirements)
| Doc | Rev | Location |
| --- | --- | --- |
|  |  |  |

## 3. Design Outputs (specs, drawings, BOM)
| Doc | Rev | Location |
| --- | --- | --- |
|  |  |  |

## 4. Design Reviews
| Review | Date | Minutes ref |
| --- | --- | --- |
|  |  |  |

## 5. Verification Records (outputs meet inputs)
| Test / report | Result | Location |
| --- | --- | --- |
|  |  |  |

## 6. Validation Records (product meets user needs)
| Study | Result | Location |
| --- | --- | --- |
|  |  |  |

## 7. Design Transfer (to manufacturing)
- [ ] Released drawing package ref:
- [ ] Control plan / SOPs refs:

## 8. Design Changes
- [ ] ECO log ref:

## Completeness Audit
- [ ] Every section has ≥1 entry or a written N/A justification
- [ ] Index reviewed at each phase gate`,
      },
      {
        title: 'Inputs ↔ Outputs Traceability Matrix',
        body: `*The spine of a defensible design process: every requirement traces forward to a spec and a verification; every spec traces back to a requirement. Orphans in either direction are findings.*

## Matrix
| Req ID | Design input (requirement) | Source (user need / standard / risk) | Design output (spec / drawing ref) | Verification method | Verification result ref | Status |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## Orphan Checks
- [ ] Forward: every input has ≥1 output and ≥1 verification (no unverified requirements)
- [ ] Backward: every output traces to an input (no gold-plating / undocumented features)
- [ ] All safety-related rows independently reviewed

## Change Discipline
- [ ] Matrix updated with every ECO (list ECOs merged):
- [ ] Snapshot archived at each gate`,
      },
      {
        title: 'APQP Phase Checklist',
        body: `*Automotive Advanced Product Quality Planning, translated to product design. Five overlapping phases; each deliverable below should exist as a page or archived doc.*

## Phase 1 — Plan & Define
- [ ] Voice of customer collected & synthesized
- [ ] Business case & preliminary targets (cost, quality, timing)
- [ ] Preliminary BOM & process flow
- [ ] Product assurance plan

## Phase 2 — Product Design & Development
- [ ] DFMEA complete, actions closed
- [ ] Design for Mfg/Assembly reviews done
- [ ] Design verification plan (DVP&R) released
- [ ] Prototype build & prototype control plan
- [ ] Drawings & specs released; special characteristics marked

## Phase 3 — Process Design & Development
- [ ] Process flow diagram & floor plan
- [ ] PFMEA complete
- [ ] Pre-launch control plan
- [ ] Work instructions & packaging specs

## Phase 4 — Product & Process Validation
- [ ] Significant production run completed
- [ ] MSA (gauge R&R) done on key measurements
- [ ] Initial process capability (Cpk ≥ 1.67 pre-launch) demonstrated
- [ ] PPAP submitted & approved
- [ ] Production validation testing passed

## Phase 5 — Feedback & Corrective Action
- [ ] Early-production containment exit criteria met
- [ ] Field data loop running (warranty, complaints)
- [ ] Lessons learned fed back into templates & design rules`,
      },
      {
        title: 'PPAP-Style Production Approval Checklist',
        body: `*Production Part Approval Process, adapted: the evidence bundle that proves production parts match the approved design before ramp. Check off each element or mark N/A with rationale.*

## Elements
| # | Element | Status (✅/N/A) | Ref |
| --- | --- | --- | --- |
| 1 | Design records (released drawings) |  |  |
| 2 | Engineering change documents (ECOs) |  |  |
| 3 | Customer/engineering approval evidence |  |  |
| 4 | DFMEA |  |  |
| 5 | Process flow diagram |  |  |
| 6 | PFMEA |  |  |
| 7 | Control plan |  |  |
| 8 | MSA studies (gauge R&R) |  |  |
| 9 | Dimensional results (full layout, all cavities) |  |  |
| 10 | Material / performance test results & certs |  |  |
| 11 | Initial process studies (Cpk) |  |  |
| 12 | Qualified lab documentation |  |  |
| 13 | Appearance approval report (color/grain vs golden sample) |  |  |
| 14 | Sample production parts (location noted) |  |  |
| 15 | Master sample retained |  |  |
| 16 | Checking aids / fixtures documented |  |  |
| 17 | Compliance records (RoHS/REACH etc.) |  |  |
| 18 | Part Submission Warrant signed |  |  |

## Disposition
- [ ] **Approved** — ramp authorized
- [ ] **Interim approval** — expires ______, open items listed with owners
- [ ] **Rejected** — resubmission plan attached`,
      },
      {
        title: 'Engineering Change Order (ECO)',
        body: `*After design freeze, nothing changes without one of these. The impact assessment is the point — a cheap change with a missed regulatory impact is an expensive change.*

## Change Identity
| Field | Value |
| --- | --- |
| ECO number | {{DOC}} |
| Initiator & date |  |
| Priority | emergency / standard |

## Description of Change
**From:**
**To:**
**Reason code:** safety / quality / cost-down / supply / regulatory / feature

## Affected Items
| Item / part no. | Rev from → to | Disposition of existing stock (use-up / rework / scrap) |
| --- | --- | --- |
|  |  |  |

## Impact Assessment (all must be answered)
- [ ] Cost impact (piece price, tooling, obsolescence): ______
- [ ] Schedule impact: ______
- [ ] Regulatory / certification impact (re-test needed? FCC/CE/UL): ______
- [ ] Verification impact (which DVP&R rows re-run): ______
- [ ] Documentation impact (drawings, SOPs, manuals, templates): ______
- [ ] Field / service impact (spares, compatibility, recalls): ______

## Effectivity
- [ ] Effective from serial / date code / build:

## Approvals
| Role | Name | Date |
| --- | --- | --- |
| Engineering |  |  |
| Quality |  |  |
| Operations |  |  |`,
      },
      {
        title: 'V&V Protocol + Report',
        body: `*One document, two lives: written and approved as a protocol BEFORE testing; completed with results as the report AFTER. Pre-approval prevents "shifting the goalposts" once data arrives.*

## Protocol (approve before testing)
| Field | Value |
| --- | --- |
| Objective (which requirements verified) |  |
| Units under test (config, serials, build) |  |
| Standard / method reference |  |

### Equipment
| Instrument | ID | Calibration due |
| --- | --- | --- |
|  |  |  |

### Procedure
| Step | Action | Expected result |
| --- | --- | --- |
| 1 |  |  |

### Acceptance Criteria (quantitative, agreed BEFORE testing)
- [ ]

**Protocol approved by:** ______ date ______

## Report (complete after testing)
### Results
| Step | Actual result | Pass/Fail |
| --- | --- | --- |
|  |  |  |

### Deviations from Protocol
| Deviation | Justification | Impact on validity |
| --- | --- | --- |
|  |  |  |

### Conclusion
- [ ] All acceptance criteria met → requirements ______ verified
- [ ] Failures → CAR/8D refs:

**Report approved by:** ______ date ______`,
      },
    ],
  },
  {
    id: 'm-cmf',
    title: 'Methods — CMF & Creative Direction',
    source: 'Adapted from studio CMF practice, semantic differential (Osgood), structured moodboarding, OOBE design',
    defaultFolderIndex: 2,
    templates: [
      {
        title: 'Moodboard Brief & Review',
        body: `*A moodboard without a brief is decoration. Write the intent first, build boards against it, then review with keep/kill discipline. Link every source to the Bludos archive.*

## Intent
- [ ] What should someone FEEL in the first 5 seconds with this product?
- [ ] Three adjectives we're chasing: ______ / ______ / ______
- [ ] Three adjectives we're avoiding: ______ / ______ / ______

## Semantic Anchors (mark the target on each axis)
| Axis | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Soft ↔ Technical |  |  |  |  |  |
| Calm ↔ Aggressive |  |  |  |  |  |
| Warm ↔ Precise |  |  |  |  |  |
| Playful ↔ Serious |  |  |  |  |  |

## Source Collection
- [ ] 20+ references gathered in archive, tagged with this project + "moodboard"
- [ ] Sources span ≥3 industries outside our own (fashion, architecture, automotive…)
- [ ] Each reference annotated with WHY it's here (one line each)

## Board Review
| Board | Gut reaction (5 words) | On-brief? | Keep / kill |
| --- | --- | --- | --- |
| A |  |  |  |
| B |  |  |  |

## Direction Decision
- [ ] Chosen direction & rationale:
- [ ] Killed directions archived (not deleted) with kill reason`,
      },
      {
        title: 'CMF Direction Sheet',
        body: `*The single source of truth for Color, Material, Finish per visible part. Specs here must be measurable — "premium grey" is not a spec, "RAL 7043, VDI 27, 15±3 GU @60°" is.*

## Colorway
- [ ] Colorway name & intent:
- [ ] Target market / SKU:

## Per-Part Specification
| Part | Color (Pantone/RAL/CIELab) | Material & grade | Finish process | Texture ref (VDI/Mold-Tech) | Gloss (GU @60°) | Supplier |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## Evaluation Conditions
- [ ] Judged under: D65 daylight / 4000 K shop light / warm home light (all three)
- [ ] Adjacent-part color match limit: ΔE ≤ ______ (same material) / ≤ ______ (cross-material)

## Durability Requirements
- [ ] Scratch: pencil hardness ≥ ______ / steel wool test spec
- [ ] Chemical: sunscreen, sweat, IPA wipe — no visible change after ______ h
- [ ] UV: ΔE ≤ ______ after ______ h per ASTM G154
- [ ] Wear: ______ rub cycles on high-touch zones

## Approvals
- [ ] Golden samples signed & physically archived (location):
- [ ] Boundary samples (lightest/darkest acceptable) retained`,
      },
      {
        title: 'Form Language Exploration Log',
        body: `*The genealogy of the product's shape. Log every direction — the rejected ones are the evidence that the chosen one is right, and next year's variant will mine this page.*

## Design DNA Targets (from brand / moodboard direction)
- [ ] Signature element (the thing you'd recognize at 5 m):
- [ ] Radius family: primary R ______ / secondary R ______
- [ ] Chamfer vs fillet policy:
- [ ] Proportion rules (ratios, datum lines):

## Iteration Log
| Iter | Date | Sketch / CAD ref (archive) | Keywords | Verdict & why |
| --- | --- | --- | --- | --- |
| 001 |  |  |  |  |

## Do / Don't Rules (grows as you go)
| ✅ Do | ❌ Don't |
| --- | --- |
|  |  |

## Consistency Check Before Freeze
- [ ] All visible radii belong to the radius family
- [ ] Parting lines fall on intentional feature lines
- [ ] Signature element survives at production draft angles
- [ ] Family resemblance verified against product roadmap (MGPP)`,
      },
      {
        title: 'Semantic Evaluation Sheet',
        body: `*Osgood semantic differential: measure whether the design actually communicates what you intended. Run with ≥8 participants outside the design team; compare against the moodboard targets.*

## Stimulus
- [ ] What was shown: render / physical model / competitor lineup
- [ ] Viewing time before scoring: 30 s, no discussion

## Score Sheet (1–7 per participant)
| Axis | Target | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cheap ↔ Premium |  |  |  |  |  |  |  |  |  |  |
| Fragile ↔ Robust |  |  |  |  |  |  |  |  |  |  |
| Cold ↔ Friendly |  |  |  |  |  |  |  |  |  |  |
| Dated ↔ Advanced |  |  |  |  |  |  |  |  |  |  |
| Complicated ↔ Effortless |  |  |  |  |  |  |  |  |  |  |

## Gap Analysis
| Axis | Target | Measured mean | Gap | Action needed? |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Verbatims
- "It looks like…" quotes:

## Decisions
- [ ] Axes with gap ≥ 1.5 get a design action (list below)
- [ ] Re-test scheduled after changes`,
      },
      {
        title: 'Packaging & OOBE Brief',
        body: `*Out-of-box experience is the first minute of ownership. Storyboard the reveal sequence like a film; every second either builds or spends trust.*

## Unboxing Storyboard
| Step | What the user sees / touches | Intended emotion | Time | Notes |
| --- | --- | --- | --- | --- |
| 1 | Outer carton |  |  |  |
| 2 | First reveal |  |  |  |
| 3 | Product lift-out |  |  |  |
| 4 | Accessories discovery |  |  |  |
| 5 | First power-on |  |  |  |

## First-Success Definition
- [ ] User reaches ______ (first success moment) within ______ minutes, no manual

## Structural Constraints
- [ ] Product + packaging drop spec: ______ (ISTA class)
- [ ] Master carton / pallet efficiency target:
- [ ] Retail requirements (shelf, hang, club-store):

## Sustainability Targets
- [ ] Plastic-free / mono-material where possible; recycled content ≥ ______%
- [ ] Ink & finish choices compatible with recycling stream

## Regulatory & Marks Checklist
- [ ] Recycling marks, WEEE, battery marks placed
- [ ] Multilingual insert languages listed:
- [ ] Barcode placement & quiet zones verified

## Review
- [ ] OOBE prototype tested with 3 first-time users, storyboard timings measured`,
      },
    ],
  },
];

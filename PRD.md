# Product Requirements Document (PRD)
## OpenScout.ai — The Missing Layer Between GitHub and Google Jules

**Document Status:** Draft v1.0
**Prepared for:** Hackathon Engineering Team
**Source Documents:** Market Requirements Document (MRD), Product Planning Context Notes
**Scope:** Hackathon MVP

---

## 0. How to Read This Document

This PRD translates the MRD and confirmed product-planning decisions into engineering-ready requirements. Every feature is scoped to the hackathon MVP: **maximum polish and demo quality over feature breadth.** Where the source documents did not specify something, it is explicitly marked **TBD** rather than assumed. Engineering should treat TBDs as items requiring a decision before or during build, not as blockers to starting work on the surrounding feature.

---

## 1. Product Overview

### 1.1 What OpenScout.ai Is
OpenScout.ai is an AI-powered onboarding platform that sits between GitHub (where code lives) and Google Jules (where code gets written). It answers three questions for a developer, in order:

1. **Which repository should I contribute to?**
2. **What should I contribute?**
3. **How do I get started?**

It is explicitly **not** a coding assistant and does not compete with GitHub Copilot or Google Jules. It replaces the manual research phase that currently happens before a developer opens an editor.

### 1.2 Positioning
| Layer | Role |
|---|---|
| GitHub | Hosts repositories |
| **OpenScout.ai** | **Finds the right repository and prepares the developer** |
| Google Jules | Implements the solution |

### 1.3 Tagline
"Reduce open-source onboarding from hours to minutes."

### 1.4 Hackathon Framing
This PRD is written for a hackathon MVP. Every requirement below is filtered through one test: *does this strengthen the core product vision, or does it expand scope?* Features that don't clearly serve onboarding time reduction, confidence building, discoverability, AI explainability, personalization, or cognitive-load reduction are excluded (see §4, Out of Scope).

---

## 2. Goals

### 2.1 Business Goals
- Reduce onboarding friction for open-source contribution.
- Encourage open-source contribution among beginners.
- Increase developer confidence before their first PR.
- Demonstrate practical, trustworthy AI-assisted software engineering (not hype-driven AI).

### 2.2 User Goals
Users should be able to:
- Discover relevant repositories without manual searching.
- Understand *why* a repository matches them.
- Understand a repository's purpose and structure without reading its full documentation.
- Receive a clear, actionable contribution plan.
- Move into Google Jules and begin implementation quickly, with full context already loaded.

### 2.3 Success Metrics

**Primary KPI**
- User reaches Google Jules with a completed Contribution Blueprint. This is the north-star conversion event for the entire product and should be instrumented as a funnel-completion event (see §11, Analytics).

**Secondary KPIs**
- Repository selected (recommendation → open rate).
- Blueprint generated successfully (open → blueprint completion rate).
- Recommendation acceptance rate (recommended repos that get opened vs. ignored).
- Repeat usage (sessions per user over time).
- Saved repositories reopened.

---

## 3. Target Audience & Personas

### 3.1 Primary Audience
- College students
- Fresh graduates
- Beginner open-source contributors
- Intermediate developers
- Developers making their first-ever open-source contribution

### 3.2 Secondary Audience
- Experienced developers seeking personalized repository recommendations

### 3.3 Design Implication
The recommendation engine, Blueprint tone, and UI copy must **optimize primarily for beginners** — meaning explanations should never assume prior open-source experience — while still surfacing enough signal (difficulty, repo health, activity) that experienced developers find it useful rather than condescending. This tension should be resolved via explicit difficulty/experience-level tagging shown throughout the UI (see §6.3, §6.5), not by dumbing down content for everyone.

### 3.4 Representative Personas (for engineering context, not exhaustive)
| Persona | Profile | Primary Need |
|---|---|---|
| "First-Timer" Aisha | College student, 2 personal repos, no OSS contributions | Confidence, hand-holding, very clear "why this fits me" |
| "Bootcamp Grad" Marco | Fresh grad, knows React/Node, wants portfolio-building OSS work | Fast path to a real, resume-worthy contribution |
| "Switching Stacks" Priya | Intermediate dev, backend-heavy, exploring frontend OSS | Framework-familiarity matching, learning objectives |
| "Power User" Devon | Experienced dev | Speed, minimal hand-holding, wants raw signal (health/activity/issue quality) fast |

---

## 4. Scope

### 4.1 In Scope (MVP)
1. GitHub OAuth login (using Clerk)
2. Developer profile analysis (skill/competency inference)
3. Personalized repository recommendations with explanations
4. Repository eligibility filtering (quality gate)
5. Repository detail page with AI-generated summary and confidence score
6. On-open repository analysis (cached, lazy-triggered)
7. Contribution opportunity discovery, prioritized per the MRD's 8-tier strategy
8. Contribution Blueprint generation
9. Handoff to Google Jules (embedded if feasible; link/prompt handoff as fallback)
10. Personalization-forward dashboard/homepage
11. Manual search (secondary to recommendations)
12. Saved history (recent repos, reopenable Blueprints, saved-for-later repos)
13. Cross-cutting AI transparency layer (confidence scores, explanations, uncertainty messaging) applied throughout

### 4.2 Out of Scope (MVP)
Explicitly excluded, per MRD §22 and planning context:
- AI writing production code
- Automatic pull request creation
- Automatic commits
- Automatic merges
- AI replacing Google Jules
- Any guarantee that AI-generated suggestions are correct — developers remain responsible for review, testing, and submission

### 4.3 Preferred vs. Fallback Experience
- **Preferred:** Google Jules embedded directly in the OpenScout.ai flow.
- **Hackathon fallback:** Smooth handoff via the generated Contribution Blueprint (deep link or copy-ready prompt package) if embedding is not feasible within the hackathon timeline. See §6.8 for both implementation paths.

---

## 5. End-to-End User Journey

```
GitHub Login
    ↓
Developer Profile Analysis
    ↓
Personalized Repository Recommendations
    ↓
Repository Selection
    ↓
Repository Understanding (on-open analysis)
    ↓
Contribution Blueprint Generation
    ↓
Google Jules Handoff
    ↓
Developer Reviews AI Output & Continues Implementation
```

This flow is the primary experience and the backbone of the MVP demo. Every screen in §6 maps to one node in this journey. No feature should be added that does not serve a step in this journey.

---

## 6. Features — Detailed Requirements

Each feature below includes functional requirements, user stories, acceptance criteria, edge cases, API expectations, data requirements, screen specification, states, and implementation notes.

---

### 6.1 Feature: GitHub OAuth Login

**Purpose:** Authenticate the user and obtain read access to the GitHub data needed for profile analysis.

**User Story**
> As a developer, I want to sign in with my GitHub account so that OpenScout.ai can analyze my profile without me manually entering my skills.

**Functional Requirements**
- FR-1.1: System supports GitHub OAuth 2.0 login integrated via Clerk as the sole authentication method for MVP.
- FR-1.2: On first login, request minimum necessary scopes: read access to public repos, profile, and (TBD: whether `read:org` or private repo scopes are needed — MRD does not specify private repo analysis, so default to public-only).
- FR-1.3: On successful auth, Clerk handles session creation/update. The backend creates or updates a `User` record (syncing user data from Clerk/GitHub) and triggers Developer Profile Analysis (§6.2) asynchronously.
- FR-1.4: Session persistence is handled by Clerk (using secure JWT tokens/cookies).
- FR-1.5: Logout must trigger Clerk sign-out, clearing session state client- and server-side.

**Acceptance Criteria**
- Given a new user, when they complete GitHub OAuth, then a `User` record is created and profile analysis is queued within 2 seconds.
- Given a returning user, when they log in, then they land on the personalized dashboard (§6.9) with previously computed profile data if available, and a background refresh is triggered if stale (see FR-2.6).
- Given OAuth failure or user cancellation, then the user is returned to the login screen with a clear, non-technical error message.

**Edge Cases**
- User denies requested OAuth scopes → show explanation of why scopes are needed and allow retry; do not silently degrade.
- GitHub OAuth service outage → show clear "GitHub is unavailable right now" state, not a generic error.
- Rate limit hit during token exchange → queue/retry with backoff; inform user if delay exceeds a few seconds.

**API Expectations**
- `POST /api/auth/github/callback` — exchanges OAuth code for access token, creates/updates user, returns session token.
- `POST /api/auth/logout` — invalidates session.
- `GET /api/auth/me` — returns current authenticated user summary.

**Database Requirements**
- `users` table: `id`, `github_id`, `github_username`, `avatar_url`, `access_token` (encrypted at rest), `created_at`, `last_login_at`, `profile_analysis_status`.

**Screens**
- **Login screen:** Product value prop (one-liner + tagline), single "Continue with GitHub" CTA. No secondary auth options for MVP.
- **Loading state:** Post-auth redirect spinner with copy indicating profile analysis is starting (transitions into §6.2's loading state).

**Error Handling**
- All auth errors surface a single, human-readable message; raw OAuth/provider errors are logged server-side only, never shown to the user.

**Analytics Events**
- `auth_login_started`, `auth_login_succeeded`, `auth_login_failed` (with reason category), `auth_logout`.

**Security Considerations**
- Store GitHub access tokens encrypted at rest.
- Never expose access tokens to the client.
- Use state parameter / PKCE to prevent CSRF on OAuth flow.
- Scope requests to the minimum required (principle of least privilege) — re-affirms FR-1.2.

**Implementation Notes**
- **Authentication Provider:** Clerk is the designated authentication provider. GitHub OAuth credentials and session tokens will be managed through Clerk.

---

### 6.2 Feature: Developer Profile Analysis

**Purpose:** Infer the developer's skills, stack familiarity, and approximate experience level from their public GitHub activity, to drive personalized recommendations.

**User Story**
> As a developer, I want OpenScout.ai to understand my skills automatically so that I don't have to manually describe my experience.

**Functional Requirements**
- FR-2.1: System must infer, per MRD §10:
  - Primary programming languages
  - Framework familiarity
  - Repository topics
  - Commit activity
  - Preferred technology stack
  - Approximate experience level
  - Contribution history
  - Project domains
- FR-2.2: Experience level must be **estimated via competency signals** (e.g., repo complexity, commit consistency, contribution history, code review activity where visible) — **not** a simple repo count. This is an explicit MRD requirement (§10).
- FR-2.3: Analysis runs asynchronously after login; user is not blocked waiting for it to complete.
- FR-2.4: Analysis output must include a confidence indicator per inferred attribute, consistent with the platform-wide AI Principles (§9).
- FR-2.5: Analysis results are persisted and displayed on the dashboard (§6.9) as the "detected skills" summary.
- FR-2.6: Analysis should be refreshed on a defined cadence or trigger (TBD: exact refresh policy — e.g., on each login if last analysis is older than N days). Recommendation: refresh if analysis is >7 days old, configurable.

**Acceptance Criteria**
- Given a user with public repositories, when profile analysis completes, then the dashboard shows a non-empty list of detected languages/frameworks/domains with confidence indicators.
- Given a user with an empty or near-empty GitHub profile, then the system falls back gracefully (see Edge Cases) rather than producing a blank or broken dashboard.
- Given analysis is still in progress, the dashboard shows a clear loading/skeleton state, not an empty or broken one.

**Edge Cases**
- **Empty GitHub profile** (explicit MRD edge case, §21): show a friendly empty state explaining that recommendations will be general until more signal is available, and offer manual search as an immediate alternative.
- Private-only repositories (no public data): treat similarly to empty profile.
- Extremely large number of repos: cap analysis to a representative sample (TBD: exact sampling strategy — e.g., most recently active N repos) to control cost/latency.
- GitHub API rate limiting during analysis: queue and retry; communicate delay to user if analysis is taking unusually long.

**API Expectations**
- `POST /api/profile/analyze` — triggers (re)analysis for the current user (internal/system-triggered post-login; not necessarily user-facing).
- `GET /api/profile/me` — returns current profile analysis, including per-attribute confidence scores and `analysis_status` (`pending` | `in_progress` | `complete` | `failed`).

**Database Requirements**
- `developer_profiles` table: `user_id`, `languages` (JSON, with weight/confidence), `frameworks` (JSON), `topics` (JSON), `experience_level` (enum: beginner/intermediate/experienced), `experience_confidence`, `contribution_history_summary`, `project_domains` (JSON), `last_analyzed_at`, `analysis_status`.

**Screens**
- No dedicated screen; surfaces within the Dashboard (§6.9) as a "Your Profile" / "What we detected" module.

**Loading States**
- Dashboard shows skeleton cards for the skills module while `analysis_status = pending|in_progress`.

**Error Handling**
- On `analysis_status = failed`: show a retry action and a message that recommendations may be limited until analysis succeeds.

**Analytics Events**
- `profile_analysis_started`, `profile_analysis_completed` (with duration, attribute count), `profile_analysis_failed` (with reason).

**Security Considerations**
- Only public GitHub data is analyzed for MVP (no private repo contents) unless a future scope decision changes this — flagged as **TBD** whether private repo access is ever requested.

**Implementation Notes**
- TBD: exact model/heuristics for experience-level scoring (e.g., LLM-based holistic assessment vs. weighted heuristic score vs. hybrid). Given AI Principles (§9) requiring explainability, whichever approach is chosen must be able to produce a human-readable justification, not just a number.

---

### 6.3 Feature: Repository Recommendation Engine

**Purpose:** Generate personalized, explained repository recommendations — the core discovery mechanism of the product.

**User Story**
> As a developer, I want to see repositories that genuinely match my skills and interests, with a clear explanation of why, so I trust the recommendation instead of ignoring it.

**Functional Requirements**
- FR-3.1: Recommendations must consider (per MRD §11 and planning context), at minimum:
  - Programming language similarity
  - Framework similarity
  - Repository domain
  - Repository health
  - Recent/repository activity
  - Contributor/maintainer activity and responsiveness
  - Beginner friendliness
  - Repository size
  - Documentation quality
  - Issue quality
  - Open contribution opportunities
  - Estimated difficulty
  - User's experience level
- FR-3.2: Every recommendation **must** include a human-readable explanation of why it was selected and why the user is a good fit. This is non-negotiable per MRD §11 and §16.
- FR-3.3: Recommendations must only be drawn from repositories passing Eligibility filtering (§6.4).
- FR-3.4: The engine must optimize primarily for beginner usefulness while remaining useful to experienced users (§3.3) — implemented via explicit difficulty labeling and match-quality signals rather than separate recommendation logic paths (TBD: confirm single vs. dual recommendation logic — MRD implies one engine with experience-aware weighting, not two separate engines).
- FR-3.5: Recommendations must show a match percentage and confidence level (MRD §16).
- FR-3.6: Recommendation list must exclude repositories the user has already dismissed/saved-and-completed (TBD: exact dismissal/feedback mechanism — not specified in MRD; recommend a simple "not interested" affordance feeding back into future ranking, marked TBD for scope confirmation).

**Acceptance Criteria**
- Given a completed developer profile, when the user views the dashboard, then they see a ranked list of recommended repositories, each with a visible explanation, match %, and confidence level.
- Given no repositories meet eligibility + match thresholds, then the system shows a clear "no strong matches yet" state and surfaces manual search prominently (see Edge Cases and §6.10).
- Given a repository's data changes such that it would no longer be eligible, it is excluded from future recommendation runs (does not retroactively hide already-viewed pages).

**Edge Cases**
- **No matching repositories** (explicit MRD edge case §21): show empty state with guidance rather than blank list; offer manual search.
- Recommendation engine cannot confidently score a candidate: exclude rather than force-rank with low confidence (consistent with AI Principles, §9) — or, if included, must be clearly flagged as low-confidence rather than hidden.
- Ties in match score: TBD — defer to secondary sort (e.g., repo health or recency); exact tie-break order left to engineering.

**API Expectations**
- `GET /api/recommendations` — returns ranked list for current user: repo metadata, match %, confidence, top reasons.
- `POST /api/recommendations/feedback` — (TBD scope) records dismiss/save/not-interested signal.

**Database Requirements**
- `recommendations` table: `id`, `user_id`, `repository_id`, `match_score`, `confidence_score`, `reasons` (JSON array of explanation strings/factors), `generated_at`, `status` (active/dismissed/saved).
- `repositories` table (shared with §6.4/6.5): `id`, `github_repo_id`, `full_name`, `description`, `primary_language`, `topics` (JSON), `stars`, `forks`, `open_issues_count`, `last_commit_at`, `license`, `is_fork`, `is_archived`, `health_score`, `beginner_friendly_score`, `doc_quality_score`, `size_kb`, `cached_at`.

**Screens**
- **Dashboard / Recommendations feed:** Card-based list; each card shows repo name, one-line AI summary, match %, top 2–3 reasons, difficulty badge, language/framework tags.
- **Recommendation detail expansion** (inline or modal): full explanation, all matched factors.

**Loading States**
- Skeleton cards while recommendations compute; if profile analysis is still pending, show a "personalizing your recommendations…" state rather than generic loading.

**Error Handling**
- If recommendation generation fails, fall back to a general/trending eligible-repos list with a note that personalization is temporarily unavailable, rather than showing nothing.

**Analytics Events**
- `recommendations_viewed`, `recommendation_card_clicked` (repo id, position, match score), `recommendation_dismissed` (if implemented), `recommendations_empty_state_shown`.

**Security Considerations**
- No user-specific data leaked between users' recommendation caches (standard tenant isolation).

**Implementation Notes**
- Given hackathon time constraints, recommendation scoring can start as a weighted heuristic combining the listed factors, with an LLM layer generating the human-readable explanation from the computed factors (keeps it grounded and explainable per §9, avoids hallucinated reasoning). TBD: whether ranking itself is ever LLM-driven vs. purely heuristic + LLM-explained.

---

### 6.4 Feature: Repository Eligibility Filtering

**Purpose:** Quality gate ensuring only healthy, contribution-ready repositories are ever surfaced.

**User Story**
> As a developer, I don't want to be recommended a dead or low-quality repository, because that wastes my time and erodes trust in the product.

**Functional Requirements**
- FR-4.1: A repository must satisfy all applicable thresholds to be eligible (MRD §12 + planning context):
  - Public repository
  - Active development
  - Not archived
  - Not a fork
  - Valid open-source license
  - README available
  - Healthy contribution history
  - Sufficient community activity
  - Meaningful contribution opportunities available
- FR-4.2: Ineligible repositories must never appear in recommendations or (by default) in search result ranking prominence (TBD: whether manual search should still surface ineligible repos with a warning label, vs. excluding entirely — recommend excluding entirely for MVP simplicity, consistent with "quality over quantity" directive).
- FR-4.3: Exact numeric thresholds (e.g., minimum stars, minimum commit recency window, minimum open issue count) are **TBD** — MRD specifies the criteria categories but not thresholds. Engineering should define initial defaults and treat them as tunable configuration, not hardcoded.

**Acceptance Criteria**
- Given a repository that is archived, a fork, or has no license, when eligibility filtering runs, then it is excluded from recommendations.
- Given a previously eligible repository becomes archived, then it is excluded from future recommendation generation runs.

**Edge Cases**
- **Repository archived after analysis** (explicit MRD edge case §21): if a user has an open Blueprint or is mid-flow on a repo that becomes archived/ineligible, show a clear notice rather than silently breaking the flow; do not retroactively delete their saved Blueprint.
- **Missing README** (explicit MRD edge case §21): treat as ineligible for recommendation, but if a user manually searches and opens such a repo anyway, clearly flag the limitation rather than blocking access outright (manual search is user-directed, not AI-recommended).
- **Unsupported repositories** (explicit MRD edge case §21, e.g., unsupported languages or non-code repos): flag as unsupported with explanation rather than attempting a low-quality analysis.
- **Repository too large for analysis** (explicit MRD edge case §21): cap analysis scope and inform the user that summary may be partial, rather than failing silently.

**API Expectations**
- Eligibility filtering is implemented as a pipeline stage, not necessarily a standalone public endpoint. Internal function: `isRepositoryEligible(repo) → { eligible: boolean, reasons: string[] }`.

**Database Requirements**
- Extends `repositories` table (§6.3) with `eligibility_status` (enum) and `eligibility_reasons` (JSON) for transparency/debugging.

**Screens**
- No standalone screen; enforced upstream of Recommendations (§6.3) and reflected as a flag in manual Search results (§6.10) if a searched repo is ineligible.

**Error Handling**
- If eligibility check itself fails (e.g., GitHub API error mid-check), default to excluding the repo rather than including an unverified one (fail closed, not open).

**Analytics Events**
- `repository_filtered_ineligible` (repo id, reasons) — useful for tuning thresholds post-hackathon.

**Security Considerations**
- N/A beyond standard data validation.

**Implementation Notes**
- Recommend implementing this as a pure, testable filter function early, since nearly every other feature depends on its output.

---

### 6.5 Feature: Repository Overview / Detail Page & On-Open Analysis

**Purpose:** Help the developer understand an unfamiliar repository quickly, without reading full documentation, once they've opened it from recommendations or search.

**User Story**
> As a developer, I want an AI-generated summary of a repository's purpose, structure, and health so that I can decide if I want to contribute without spending an hour reading docs.

**Functional Requirements**
- FR-5.1: Repository detail page must show (MRD §13):
  - Repository purpose
  - AI-generated project summary
  - Tech stack
  - Primary languages
  - Repository activity
  - Community information
  - Contribution friendliness
  - Open issues
  - Estimated onboarding difficulty
  - AI confidence score
- FR-5.2: **Analysis begins only after the user opens the repository** — no upfront analysis for every recommended repo (explicit MRD §17 / planning context requirement, primarily for cost control).
- FR-5.3: Analysis results are cached (§6.5.1) and reused on subsequent opens unless invalidated.
- FR-5.4: If analysis is in progress, the page must show a clear, distinct loading state (not a blank page) — this is the moment where the product's "AI is working" moment should feel intentional and premium, not laggy.

**6.5.1 Caching Behavior**
- FR-5.5: Repository analysis is cached per repository (not per user, since the underlying repo summary is not user-specific — only the *recommendation reasoning* is user-specific).
- FR-5.6: Cache is refreshed when repository changes invalidate previous analysis (MRD §17) — e.g., new commits past a threshold, README changes, issue set changes materially. **Exact invalidation triggers/thresholds are TBD.**
- FR-5.7: Cached analysis displays a "last analyzed" timestamp for transparency.

**Acceptance Criteria**
- Given a user opens a repository for the first time, when no cached analysis exists, then analysis is triggered and a loading state is shown until complete.
- Given a user opens a repository with valid cached analysis, then the page renders immediately from cache with a visible "last analyzed" timestamp.
- Given cached analysis has been invalidated by repo changes, then re-analysis is triggered on next open.

**Edge Cases**
- Repository becomes archived/ineligible after caching but before a later open: show a clear notice (see §6.4 edge cases) but still allow viewing cached analysis (read-only context is still useful even if it's no longer recommendable).
- Analysis takes unusually long (large repo, API slowness): show progressive/partial results if possible, or a clear "still analyzing, this can take a moment for larger repositories" message rather than an indefinite spinner.
- AI cannot confidently summarize the repository: show partial results with confidence flagged low, per AI Principles (§9) — never fabricate a confident-sounding summary.

**API Expectations**
- `GET /api/repositories/:id` — returns repository metadata + cached analysis if present, or triggers analysis and returns `status: analyzing`.
- `POST /api/repositories/:id/analyze` — force/trigger (re)analysis.
- `GET /api/repositories/:id/analysis-status` — for polling during analysis (or use websocket/SSE — implementation detail, TBD).

**Database Requirements**
- `repository_analyses` table: `repository_id`, `summary_text`, `tech_stack` (JSON), `activity_summary`, `community_summary`, `contribution_friendliness_score`, `onboarding_difficulty` (enum), `confidence_score`, `analyzed_at`, `cache_invalidated_at` (nullable).

**Screens**
- **Repository Detail Page:** Header (name, stars, license, activity badges) → AI Summary module (with confidence badge) → Tech Stack tags → Community/health signals → Open Issues preview (feeds into §6.6) → "Generate Contribution Blueprint" primary CTA.

**Loading States**
- Full-page skeleton for first-time analysis; inline "refreshing analysis…" indicator for cache-invalidated re-analysis (page still shows stale data with a refresh indicator rather than blanking out).

**Error Handling**
- Analysis failure: show what could be retrieved (basic GitHub metadata) plus a clear "AI summary unavailable right now" message with retry — never block access to the repo's basic info due to AI failure.

**Analytics Events**
- `repository_opened`, `repository_analysis_triggered`, `repository_analysis_completed` (duration), `repository_analysis_failed`, `repository_analysis_served_from_cache`.

**Security Considerations**
- Analysis pipeline must not execute any code from the analyzed repository — static/metadata analysis only.

**Implementation Notes**
- This is the most AI-cost-sensitive feature (per explicit MRD/context directive to avoid expensive analysis on every recommendation). Caching correctness here directly affects hackathon demo cost and reliability — prioritize this being solid.

---

### 6.6 Feature: Contribution Opportunity Discovery & Prioritization

**Purpose:** Surface real, actionable contribution opportunities within a repository, prioritized to prefer existing legitimate issues over invented ones.

**User Story**
> As a developer, I want to know what I could actually work on in this repository, starting with real issues rather than made-up busywork.

**Functional Requirements**
- FR-6.1: Opportunities must be surfaced in this exact priority order (MRD §15, reaffirmed in planning context):
  1. Existing "Good First Issue"-labeled issues
  2. Existing "Help Wanted"-labeled issues
  3. Suitable open issues matching user skill
  4. Documentation improvements
  5. Test coverage improvements
  6. Accessibility improvements
  7. Refactoring opportunities
  8. AI-generated improvement ideas — **only when confidence is high**
- FR-6.2: The system must never invent a contribution idea (tier 8) if legitimate issues (tiers 1–3) already exist and are suitable for the user's level. This ordering is explicitly intentional per MRD and must not be reordered or "optimized" by ranking logic.
- FR-6.3: Each surfaced opportunity must show its tier/category so the user understands whether it's a real GitHub issue vs. an AI-suggested idea.
- FR-6.4: Opportunity selection should factor in the user's estimated experience level (from §6.2) to avoid surfacing something too advanced/too trivial as the "recommended" pick — while still listing other available options.

**Acceptance Criteria**
- Given a repository has open "good first issue"-labeled issues, when opportunities are generated, then those issues are shown before any AI-generated idea, regardless of how "good" an AI idea might seem.
- Given a repository has zero suitable existing issues, then the system proceeds down the tier list (docs → tests → accessibility → refactor → AI-generated) and clearly labels which tier the shown opportunity belongs to.
- Given an AI-generated idea is shown (tier 8), then it must be accompanied by its confidence score, and low-confidence AI ideas must not be shown at all (excluded, not just flagged).

**Edge Cases**
- Repository has no open issues and no clear low-hanging documentation/test gaps: system should be honest that this repository currently has limited beginner-accessible entry points, rather than forcing a tier-8 idea. TBD: whether this should also demote the repo in future recommendations for beginners specifically.
- Issue exists but is stale/already claimed (e.g., has a linked PR or "in progress" comment): TBD — MRD does not specify handling of issue claim-state; recommend flagging with a note but not hard-excluding, since claim status can be ambiguous or informal on GitHub.

**API Expectations**
- `GET /api/repositories/:id/opportunities` — returns tiered list of opportunities with tier label, source (GitHub issue link vs. AI-generated), and confidence (for tier 8 only).

**Database Requirements**
- `contribution_opportunities` table: `id`, `repository_id`, `tier` (1–8), `source_type` (github_issue | ai_generated), `github_issue_url` (nullable), `title`, `description`, `confidence_score` (nullable, required if tier=8), `estimated_difficulty`, `created_at`.

**Screens**
- Embedded within Repository Detail Page (§6.5) as an "Opportunities" section, and feeds directly into Blueprint generation (§6.7) as the selection step ("Choose what to work on").

**Loading States**
- Opportunities load as part of the on-open repository analysis (§6.5); no separate loading state needed unless implemented as an async sub-step, in which case a section-level skeleton is sufficient.

**Error Handling**
- If GitHub issue data fails to load, show whatever tiers were successfully retrieved and flag that issue-based tiers may be incomplete, rather than failing the whole opportunities section.

**Analytics Events**
- `opportunities_viewed`, `opportunity_selected` (tier, source_type), `ai_generated_opportunity_shown` (confidence).

**Security Considerations**
- N/A beyond standard read-only GitHub API usage.

**Implementation Notes**
- This feature is a strict ordering/filtering pipeline over GitHub Issues API data, with an LLM fallback only at the bottom tier. Keep tiers 1–3 as deterministic GitHub API queries (label-based, skill-keyword matching) to keep them fast, cheap, and trustworthy; reserve LLM calls for tier 8 and for generating human-readable descriptions of tiers 1–7 if desired.

---

### 6.7 Feature: Contribution Blueprint Generation

**Purpose:** The product's signature feature — a structured onboarding document that fully prepares the developer before they touch code, and produces the final handoff artifact for Google Jules.

**User Story**
> As a developer, I want a single, structured plan that explains what I'm building, why, and how — plus a ready-to-use prompt for Google Jules — so I can move from "I found a repo" to "I'm implementing" with confidence.

**Functional Requirements**
- FR-7.1: The Blueprint is **not simply a prompt** — it is a structured document. It must include, at minimum (MRD §14 + planning context):
  - Repository understanding (recap of the AI summary)
  - Why this repository was recommended / why it matches the user
  - Recommended contribution opportunity (selected from §6.6)
  - Confidence level
  - Estimated difficulty
  - Estimated effort
  - Learning objectives
  - Constraints
  - Suggested reading order
  - High-level implementation strategy/guidance
  - Final AI-generated prompt prepared for Google Jules
- FR-7.2: Blueprint generation is triggered from the Repository Detail Page after the user selects a contribution opportunity (or accepts the top-recommended one).
- FR-7.3: The final Jules prompt must be grounded in the actual repository analysis and selected opportunity — not generic boilerplate. It should read as if a knowledgeable teammate prepared context notes for whoever picks this up.
- FR-7.4: The Blueprint must be persisted and reopenable from Saved History (§6.11).
- FR-7.5: The Blueprint must be editable/regenerable at least at a basic level (TBD: exact editing capability — e.g., can the user swap the selected opportunity and regenerate, vs. fully free-text edit the output). Recommend: allow swapping the selected opportunity and regenerating; full free-text editing of AI output is a nice-to-have, not MVP-critical.

**Acceptance Criteria**
- Given a user selects a contribution opportunity, when they trigger Blueprint generation, then all required sections (FR-7.1) are populated before the Blueprint is presented as "ready."
- Given the Blueprint is generated, then a "Send to Google Jules" / "Continue to Jules" action is available and uses the generated prompt (see §6.8).
- Given generation is in progress, the user sees a clear, premium-feeling loading state (this is a key demo moment) rather than a generic spinner.
- Given the AI cannot generate a section with high confidence, that section is shown with a visible lower-confidence indicator rather than omitted silently or filled with generic filler text.

**Edge Cases**
- User backs out mid-generation: partial Blueprint should not be saved as "complete" — either discard or save as a draft state (TBD: exact draft-handling behavior; recommend saving as `draft` status so it's recoverable but clearly marked incomplete).
- Selected opportunity becomes stale/closed on GitHub between selection and generation: flag this to the user before finalizing rather than generating a Blueprint for a now-invalid opportunity.
- **AI unable to confidently generate recommendations** (explicit MRD edge case §21, applies here too): if overall confidence is too low to produce a trustworthy Blueprint, communicate this directly and suggest an alternative opportunity or repository rather than producing a low-quality Blueprint silently.

**API Expectations**
- `POST /api/blueprints` — body: `repository_id`, `opportunity_id` (or custom selection); returns generated Blueprint (may be async — return `status: generating` + poll, or streamed).
- `GET /api/blueprints/:id` — retrieve a specific Blueprint.
- `GET /api/blueprints?user_id=me` — list user's Blueprints (for Saved History, §6.11).
- `PATCH /api/blueprints/:id` — regenerate/update (e.g., swap opportunity).

**Database Requirements**
- `blueprints` table: `id`, `user_id`, `repository_id`, `opportunity_id`, `repository_understanding`, `match_explanation`, `confidence_level`, `estimated_difficulty`, `estimated_effort`, `learning_objectives` (JSON array), `constraints` (JSON array), `suggested_reading_order` (JSON array), `implementation_strategy`, `final_jules_prompt`, `status` (draft | complete), `created_at`, `updated_at`.

**Screens**
- **Blueprint Generation loading screen:** Distinct, premium loading sequence — this is a signature moment; consider showing progressive section-by-section reveal as each part completes rather than one flat spinner (demo-quality requirement per §1.4).
- **Blueprint Detail Page:** All sections laid out clearly and scannably (not a wall of text — use collapsible sections or a clear visual hierarchy), with confidence/difficulty/effort shown as badges up top, and the final Jules prompt in a distinct, copyable/launchable block.

**Loading States**
- See above — this loading state deserves more design attention than a standard spinner given it's the product's signature feature and primary demo moment.

**Error Handling**
- Generation failure: allow retry without losing the selected opportunity context; never lose the user's place in the flow.

**Analytics Events**
- `blueprint_generation_started`, `blueprint_generation_completed` (duration, section confidence scores), `blueprint_generation_failed`, `blueprint_viewed`, `blueprint_reopened_from_history`.

**Security Considerations**
- Blueprint content (including any repo-derived context) must not leak data from repositories the user doesn't have legitimate (public) access to — not a concern for public repos, but relevant if private repo scope is ever added (see §6.2 TBD).

**Implementation Notes**
- This is the feature most worth over-investing polish into for the hackathon demo, per the stated priority of "demo quality" (§1.4). The progressive-reveal loading state and the clarity of the final layout are likely to matter more to judges than raw feature count elsewhere in the product.

---

### 6.8 Feature: Google Jules Handoff

**Purpose:** Seamlessly transition the developer from planning (OpenScout.ai) to implementation (Google Jules), preserving all context generated in the Blueprint.

**User Story**
> As a developer, I want to move into Google Jules with all my context already loaded, so I don't have to re-explain what I'm doing.

**Functional Requirements**
- FR-8.1: **Preferred implementation:** Google Jules embedded directly within the OpenScout.ai experience, pre-loaded with the Blueprint's final prompt.
- FR-8.2: **Fallback implementation (hackathon-realistic default):** A smooth handoff flow — e.g., a "Continue to Google Jules" action that opens/deep-links to Jules with the generated prompt pre-filled or easily copyable, plus the full Blueprint remaining accessible for reference.
- FR-8.3: Regardless of implementation path, OpenScout.ai's responsibility ends at handing off complete, well-structured context. It must **never** attempt to write code, create commits, open PRs, or perform any implementation action itself (hard boundary, MRD §22).
- FR-8.4: After handoff, the Blueprint remains saved and accessible (developer may return to reference it mid-implementation).

**Acceptance Criteria**
- Given a completed Blueprint, when the user selects "Continue to Google Jules," then the final prompt is transferred (embedded session or copy/deep-link) without requiring the user to manually re-type or reconstruct context.
- Given the embedded path is not feasible, then the fallback clearly and smoothly presents the prompt for manual handoff — this must not feel like a broken or half-finished feature; it should be designed as a deliberate, polished handoff screen.

**Edge Cases**
- Google Jules is unavailable/unreachable (embedded path): fall back gracefully to the copy/deep-link path rather than erroring out.
- User has multiple Blueprints open across sessions: each handoff must carry the correct, corresponding prompt — no cross-contamination between Blueprints.

**API Expectations**
- TBD — dependent on actual Google Jules integration surface (embed SDK vs. URL scheme vs. none available for hackathon). Engineering should confirm what integration points Jules actually exposes before committing to the embedded path; the PRD intentionally does not assume specifics here since the MRD does not detail Jules' API.
- Minimum viable: `GET /api/blueprints/:id/jules-handoff` — returns the formatted final prompt payload ready for whichever handoff mechanism is used.

**Database Requirements**
- No new tables required; reuses `blueprints.final_jules_prompt`. Optionally log handoff events: `handoff_events` table (`blueprint_id`, `method` [embedded|link|copy], `initiated_at`).

**Screens**
- **Handoff screen/modal:** Blueprint summary recap (compact) + prominent "Continue to Google Jules" action + the prompt itself visible/copyable as a fallback safety net regardless of primary method.

**Loading States**
- If embedding Jules, show a load state while the embedded session initializes.

**Error Handling**
- If handoff mechanism fails, always leave the user with a manual copy-paste fallback — this path must never be a dead end.

**Analytics Events**
- `jules_handoff_initiated` (method), `jules_handoff_succeeded`, `jules_handoff_failed`, `jules_prompt_copied` (fallback path usage).

**Security Considerations**
- If embedding a third-party tool, ensure no OpenScout.ai session credentials or GitHub tokens are exposed to the embedded context beyond what's explicitly needed.

**Implementation Notes**
- Given hackathon time constraints and the MRD's own framing ("hackathon fallback: smooth handoff"), engineering should default to designing and building the fallback path as the primary target, and treat embedding as a stretch goal if time permits — this matches the MRD's own risk framing.

---

### 6.9 Feature: Personalized Dashboard / Homepage

**Purpose:** The entry point after login — must immediately communicate personalization and make the AI's reasoning visible.

**User Story**
> As a developer, I want to immediately see that OpenScout.ai understands me — my skills, and why it's recommending what it's recommending — so I trust the product from the first screen.

**Functional Requirements**
- FR-9.1: Homepage must be **recommendation-first** (MRD §18/§19) — personalized recommendations are the primary content, manual search is secondary and available but not the default focus.
- FR-9.2: Dashboard must clearly communicate (MRD §16 + planning context):
  - What skills were detected
  - Why repositories were recommended
  - Why the user matches those repositories
- FR-9.3: AI reasoning must be visible throughout, not hidden behind a "why?" click-through only — at minimum a summary reason should be visible at a glance on each recommendation card (ties to §6.3 FR-3.2).
- FR-9.4: Interface must avoid overwhelming the user with unnecessary information (MRD UX Philosophy) — favor clarity and guided flow over data density.

**Acceptance Criteria**
- Given a returning, analyzed user, when they land on the dashboard, then they see (in order of visual priority): a brief "here's what we know about you" module, then ranked recommendations, each with visible reasoning.
- Given the dashboard is viewed on first load post-signup, it should not feel empty or generic even if recommendations are still computing (see loading states below).

**Edge Cases**
- New user, profile analysis incomplete: show a "getting to know you" state that's honest about being in-progress, not a broken or empty dashboard (ties to §6.2 edge cases).
- Returning user with stale analysis: dashboard should still render existing data immediately while a refresh happens in the background (no blocking re-analysis wait on every login).

**API Expectations**
- `GET /api/dashboard` — aggregate endpoint returning profile summary + top recommendations + saved-history preview in one call (reduces round trips for a fast-feeling load, consistent with UX Philosophy "fast").

**Database Requirements**
- No new tables; aggregates `developer_profiles`, `recommendations`, and `blueprints`/saved history.

**Screens**
- **Dashboard:** "Your Profile" summary module (top) → "Recommended for You" feed (primary content) → secondary access to Search and Saved History (nav-level, not competing for primary visual space).

**Loading States**
- Profile module and recommendation feed load independently with their own skeletons so one being slow doesn't block the other from rendering.

**Error Handling**
- If the aggregate dashboard call partially fails (e.g., recommendations fail but profile succeeds), render what succeeded rather than failing the whole page.

**Analytics Events**
- `dashboard_viewed`, `dashboard_load_time` (perf metric).

**Security Considerations**
- Standard per-user data isolation.

**Implementation Notes**
- This screen carries the most weight for "premium, modern, fast, minimal" UX Philosophy goals — worth dedicated design polish time given it's the first thing judges/users see after login.

---

### 6.10 Feature: Manual Search

**Purpose:** Secondary discovery path for users who want to look up a specific repository rather than rely on recommendations.

**User Story**
> As a developer, I want to search for a specific repository directly, in case I already have one in mind.

**Functional Requirements**
- FR-10.1: Manual search is available but must not replace or visually compete with personalized recommendations as the primary experience (MRD §18).
- FR-10.2: Search should query GitHub repositories (TBD: search entirely via GitHub's search API in real time, vs. searching only within OpenScout's already-analyzed/eligible repo set — recommend real-time GitHub search for flexibility, with eligibility status shown per result rather than restricting search scope).
- FR-10.3: Search results should indicate eligibility status (§6.4) so users understand why a result might not be "recommendable" quality, without necessarily blocking access to it.

**Acceptance Criteria**
- Given a user enters a search query, when results return, then each result shows basic metadata and an eligibility indicator.
- Given a searched repository is opened, then it follows the same Repository Detail Page flow (§6.5) as a recommended one, including on-open analysis.

**Edge Cases**
- No search results: clear empty state with a suggestion to refine the query.
- GitHub search API rate-limited: show a clear temporary-unavailability message.

**API Expectations**
- `GET /api/search?q=...` — proxies/wraps GitHub repository search, annotated with eligibility flags.

**Database Requirements**
- No dedicated table; search results reuse the `repositories` cache/eligibility logic (§6.3/§6.4) where already-analyzed, and hit GitHub live otherwise.

**Screens**
- **Search bar** (persistent but secondary in visual hierarchy, e.g., top nav rather than homepage hero) → **Search results list** (same card pattern as recommendations, minus the personalized match %/reasoning, since these aren't AI-recommended).

**Loading States**
- Standard debounced search-as-you-type loading indicator.

**Error Handling**
- Failed search: retry affordance, clear message.

**Analytics Events**
- `search_performed` (query length, result count — avoid logging raw query text if privacy-sensitive; TBD on exact query logging policy), `search_result_clicked`.

**Security Considerations**
- Sanitize/validate search input before passing to any downstream API.

**Implementation Notes**
- Keep this feature deliberately lightweight — it exists to not block power users who know what they want, not to become a second recommendation engine.

---

### 6.11 Feature: Saved History

**Purpose:** Let users revisit previous work — critical for a tool meant to be used across multiple sessions, not just once.

**User Story**
> As a developer, I want to come back later and see the repositories I explored and the Blueprints I generated, so I don't lose my progress.

**Functional Requirements**
- FR-11.1: Users can view recently opened repositories (MRD §19).
- FR-11.2: Users can reopen previously generated Contribution Blueprints (MRD §19).
- FR-11.3: Users can save repositories for later exploration, independent of having generated a Blueprint yet (MRD §19).

**Acceptance Criteria**
- Given a user has previously opened repositories, when they visit their history, then those repositories are listed in most-recent-first order with quick access back to their detail pages.
- Given a user has generated Blueprints, when they visit history, then each Blueprint is reopenable in the same complete state it was generated in (or its latest regenerated state).
- Given a user explicitly saves a repository (without generating a Blueprint), then it appears in a distinct "Saved" list separate from "Recently Viewed."

**Edge Cases**
- A saved/history repository becomes archived or ineligible later: still viewable from history (historical reference is still valid) but clearly flagged as no longer active/eligible, consistent with §6.4/§6.5 edge case handling.
- Very large history over time: TBD — pagination/limit strategy not specified in MRD; recommend standard paginated list, most-recent-first.

**API Expectations**
- `GET /api/history/repositories` — recently viewed repos.
- `GET /api/history/blueprints` — generated Blueprints.
- `POST /api/repositories/:id/save` / `DELETE /api/repositories/:id/save` — save/unsave for later.

**Database Requirements**
- `repository_views` table: `user_id`, `repository_id`, `viewed_at` (for recency ordering; dedupe on repeat views by updating timestamp rather than inserting duplicates).
- `saved_repositories` table: `user_id`, `repository_id`, `saved_at`.
- Blueprints already persisted per §6.7 (`blueprints` table), queried by `user_id`.

**Screens**
- **History/Saved page:** Tabbed or sectioned view — "Recently Viewed," "Saved," "Blueprints" — each as a simple, scannable list reusing existing card components from Dashboard/Search for visual consistency.

**Loading States**
- Standard list skeletons per section.

**Error Handling**
- Failed to load one section (e.g., Blueprints) shouldn't block the other sections from rendering.

**Analytics Events**
- `history_viewed`, `repository_saved`, `repository_unsaved`, `blueprint_reopened` (also logged in §6.7).

**Security Considerations**
- Standard per-user data isolation; ensure saved/history endpoints are scoped to the authenticated user only.

**Implementation Notes**
- This feature is straightforward CRUD/list functionality — good candidate to build with the leftover time after the core discovery→Blueprint→handoff flow (§5) is demo-solid, rather than front-loading effort here.

---

## 7. Cross-Cutting: AI Principles & Transparency Layer

This is not a standalone screen but a set of requirements applied across §6.2, §6.3, §6.5, §6.6, and §6.7 wherever AI-generated content appears.

**Principles (MRD §20, restated as requirements):**
- AR-1: Every AI-generated result must be **explainable** — a human-readable rationale must accompany the output, not just a score.
- AR-2: Every AI-generated result must be **actionable** — outputs should tell the user what to do next, not just describe a state.
- AR-3: Every AI-generated result must be **confidence-scored**, and that score must be visibly surfaced in the UI, not just logged internally.
- AR-4: Every AI-generated result must be **grounded in actual repository data** — no fabricated statistics, issue counts, or claims about a repo that aren't backed by retrieved data.
- AR-5: The platform must be **transparent about uncertainty** — when confidence is low, the UI must say so explicitly (e.g., "we're less confident about this match") rather than presenting uncertain output with false confidence.
- AR-6: The platform must **never hallucinate contribution opportunities** — this is enforced structurally via the tiered opportunity system (§6.6), not just via prompting.

**Implementation Notes**
- Recommend a consistent confidence-badge UI component (e.g., High / Medium / Low, or a percentage) reused everywhere AI output appears, so the transparency principle is visually consistent rather than ad hoc per feature.
- Recommend that any LLM-generated explanation text be produced *from* structured, already-computed factors (match scores, health metrics, retrieved issue data) rather than asking the LLM to reason freely about the repository — this keeps outputs grounded (AR-4) and reduces hallucination risk (AR-6) essentially by construction.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard initial render should feel fast per UX Philosophy ("fast") — target TBD (no numeric SLA specified in MRD; recommend engineering set an internal target, e.g., sub-2s for cached/skeleton-first render). |
| Cost control | Expensive AI analysis must only run on-demand (on repository open), never speculatively for every recommendation candidate (explicit MRD §17 requirement). |
| Caching | Repository analysis must be cached and only invalidated on meaningful repo changes (§6.5.1). |
| Reliability | GitHub API rate limiting must be handled gracefully across all features that call it (login, profile analysis, recommendations, opportunities, search) — queue/backoff, never a raw error to the user. |
| Availability | TBD — no specific uptime target given in MRD; standard hackathon-demo reliability expectations apply. |
| Accessibility | Not explicitly specified in MRD beyond "accessibility improvements" as a contribution tier; general web accessibility best practices (semantic HTML, keyboard navigation, contrast) should still apply to OpenScout.ai's own UI as good practice, though not an explicit MRD requirement. |
| Data retention | TBD — no retention/deletion policy specified for user data, analysis caches, or Blueprints. |

---

## 9. Data Model Summary

| Table | Purpose |
|---|---|
| `users` | Authenticated developer accounts (§6.1) |
| `developer_profiles` | Inferred skills/experience (§6.2) |
| `repositories` | Cached GitHub repo metadata + computed scores (§6.3, §6.4) |
| `repository_analyses` | Cached AI-generated repo summaries (§6.5) |
| `recommendations` | Per-user ranked, explained recommendations (§6.3) |
| `contribution_opportunities` | Tiered opportunities per repository (§6.6) |
| `blueprints` | Generated Contribution Blueprints (§6.7) |
| `repository_views` | Recency-ordered view history (§6.11) |
| `saved_repositories` | User-saved-for-later repos (§6.11) |
| `handoff_events` | Optional Jules handoff logging (§6.8) |

Exact schema types, indexes, and migrations are left to engineering; the above defines required entities and relationships only.

---

## 10. API Surface Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/github/callback` | POST | OAuth login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Current user |
| `/api/profile/analyze` | POST | Trigger profile analysis |
| `/api/profile/me` | GET | Get profile analysis |
| `/api/recommendations` | GET | Get personalized recommendations |
| `/api/recommendations/feedback` | POST | (TBD scope) dismiss/save signal |
| `/api/repositories/:id` | GET | Repo detail + cached/triggered analysis |
| `/api/repositories/:id/analyze` | POST | Force re-analysis |
| `/api/repositories/:id/analysis-status` | GET | Poll analysis status |
| `/api/repositories/:id/opportunities` | GET | Tiered contribution opportunities |
| `/api/repositories/:id/save` | POST/DELETE | Save/unsave repo |
| `/api/blueprints` | POST | Generate Blueprint |
| `/api/blueprints/:id` | GET/PATCH | Retrieve/update Blueprint |
| `/api/blueprints?user_id=me` | GET | List user's Blueprints |
| `/api/blueprints/:id/jules-handoff` | GET | Formatted handoff payload |
| `/api/dashboard` | GET | Aggregate dashboard data |
| `/api/search` | GET | Manual repo search |
| `/api/history/repositories` | GET | Recently viewed |
| `/api/history/blueprints` | GET | Blueprint history |

---

## 11. Analytics Events Summary

| Event | Fired When |
|---|---|
| `auth_login_started/succeeded/failed`, `auth_logout` | Login lifecycle |
| `profile_analysis_started/completed/failed` | Profile analysis lifecycle |
| `recommendations_viewed`, `recommendation_card_clicked`, `recommendation_dismissed`, `recommendations_empty_state_shown` | Recommendation engagement |
| `repository_filtered_ineligible` | Eligibility filtering (internal/debug) |
| `repository_opened`, `repository_analysis_triggered/completed/failed/served_from_cache` | Repo detail engagement |
| `opportunities_viewed`, `opportunity_selected`, `ai_generated_opportunity_shown` | Opportunity engagement |
| `blueprint_generation_started/completed/failed`, `blueprint_viewed`, `blueprint_reopened_from_history` | Blueprint lifecycle — **primary KPI funnel** |
| `jules_handoff_initiated/succeeded/failed`, `jules_prompt_copied` | Handoff — **primary KPI completion event** |
| `dashboard_viewed`, `dashboard_load_time` | Dashboard engagement |
| `search_performed`, `search_result_clicked` | Manual search |
| `history_viewed`, `repository_saved/unsaved`, `blueprint_reopened` | Saved history |

The **primary KPI** (user reaches Google Jules with a completed Blueprint) is measurable as the funnel: `dashboard_viewed → recommendation_card_clicked → repository_analysis_completed → opportunity_selected → blueprint_generation_completed → jules_handoff_succeeded`.

---

## 12. Consolidated Edge Case Reference

All edge cases below are explicitly named in MRD §21 and are mapped to their owning feature above; consolidated here for QA reference:

| Edge Case | Owning Feature |
|---|---|
| Empty GitHub profile | §6.2 |
| No matching repositories | §6.3 |
| Repository archived after analysis | §6.4, §6.5 |
| Missing README | §6.4 |
| Unsupported repositories | §6.4 |
| Repository too large for analysis | §6.4, §6.5 |
| AI unable to confidently generate recommendations | §6.3, §6.7 |
| Rate limits (GitHub API) | §6.1, §6.2, §6.3, §6.6, §6.10 |
| Cached analysis becoming outdated | §6.5.1 |

All must surface **clear explanations to the user, never generic errors** (explicit MRD requirement, §21).

---

## 13. Open Questions / TBD Register

Consolidated list of every TBD raised in this document, for team triage before/during build:

1. Exact OAuth scopes needed — public-only vs. any private repo access (§6.1).
2. Resolved: Session mechanism is handled by Clerk (JWT-based).
3. Profile re-analysis refresh cadence/trigger (§6.2).
4. Repo sampling strategy for users with very large numbers of repos (§6.2).
5. Experience-level scoring methodology (heuristic vs. LLM vs. hybrid) (§6.2).
6. Recommendation dismissal/feedback mechanism scope (§6.3).
7. Tie-breaking logic for equal match scores (§6.3).
8. Numeric eligibility thresholds (stars, activity window, etc.) (§6.4).
9. Whether ineligible repos appear (flagged) in manual search vs. excluded entirely (§6.4, §6.10).
10. Repository-analysis cache invalidation triggers/thresholds (§6.5).
11. Handling of stale/claimed GitHub issues in opportunity discovery (§6.6).
12. Blueprint editing capability scope (swap-only vs. free-text edit) (§6.7).
13. Draft-state handling for abandoned Blueprint generation (§6.7).
14. Google Jules integration surface (embed feasibility, API/SDK availability) (§6.8).
15. Search scope: live GitHub search vs. analyzed-repo-set only (§6.10).
16. Search query logging/privacy policy (§6.10).
17. History pagination/retention limits (§6.11).
18. Performance SLA targets (§8).
19. Uptime/availability target (§8).
20. Data retention/deletion policy (§8).

---

## 14. Product Principles Checklist (Feature Gate)

Per the MRD and planning context, every feature must satisfy at least one of these principles. This table confirms each shipped feature's justification — useful for scope-cut decisions if hackathon time runs short.

| Feature | Principle(s) Served |
|---|---|
| GitHub Login | Fast onboarding |
| Developer Profile Analysis | Personalization, Explainability |
| Recommendation Engine | Personalization, Discoverability, Transparency |
| Eligibility Filtering | Practical value (quality over quantity) |
| Repository Detail/Analysis | Reduce cognitive load, Fast onboarding, Explainability |
| Opportunity Discovery | Practical value, AI with human oversight |
| Contribution Blueprint | All principles — signature feature |
| Google Jules Handoff | Fast onboarding, Practical value |
| Dashboard | Personalization, Transparency, Simplicity |
| Manual Search | Simplicity (secondary path, low cognitive overhead) |
| Saved History | Practical value, Reduce onboarding time on return visits |

If a scope cut becomes necessary under hackathon time pressure, this table should guide prioritization: **§6.1 → §6.2 → §6.3 → §6.4 → §6.5 → §6.6 → §6.7 → §6.8 form the non-negotiable critical path** (§5, the primary user journey). §6.9–6.11 (Dashboard polish beyond basics, Search, History) are the first candidates to simplify if time is short — they support the experience but are not on the core discovery→Blueprint→handoff path.

---

*End of PRD.*

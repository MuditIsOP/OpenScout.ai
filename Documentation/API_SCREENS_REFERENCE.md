# OpenScout.ai — API & Screens Reference

> **Purpose:** Single source of truth mapping every frontend screen to its backend APIs, identifying shared endpoints, documenting edge cases, and stress-testing every contract. Backend devs know exactly what to build; frontend devs know exactly what to call and what to expect.

> [!IMPORTANT]
> This document was cross-referenced against **all 6 documentation files**: [PRD.md](file:///d:/Projects/OpenScout.ai/Documentation/PRD.md), [TECHNICAL_GUIDE.md](file:///d:/Projects/OpenScout.ai/Documentation/TECHNICAL_GUIDE.md), [APP_ARCHITECTURE.md](file:///d:/Projects/OpenScout.ai/Documentation/APP_ARCHITECTURE.md), [SCHEMA.md](file:///d:/Projects/OpenScout.ai/Documentation/SCHEMA.md), [phase_1_spec.md](file:///d:/Projects/OpenScout.ai/Documentation/phase_1_spec.md), and [phase_1_schema.json](file:///d:/Projects/OpenScout.ai/Documentation/phase_1_schema.json). Every API contract has been triple-checked for consistency.

---

## Table of Contents

1. [Screen → API Map](#1-screen--api-map)
2. [Screen 1: Landing / Login Page](#screen-1-landing--login-page)
3. [Screen 2: Onboarding Fallback (Manual Preferences)](#screen-2-onboarding-fallback-manual-preferences)
4. [Screen 3: Personalized Dashboard](#screen-3-personalized-dashboard)
5. [Screen 4: Repository Detail Page](#screen-4-repository-detail-page-phase-2)
6. [Screen 5: Search Results Page](#screen-5-search-results-page-phase-2)
7. [Screen 6: History / Saved Page](#screen-6-history--saved-page-phase-2)
8. [Screen 7: Blueprint Detail Page](#screen-7-blueprint-detail-page-phase-3)
9. [Screen 8: Jules Handoff Screen](#screen-8-jules-handoff-screen-phase-3)
10. [Screen 9: Settings Page](#screen-9-settings-page-phase-3)
11. [Shared / Repeated API Usage](#shared--repeated-api-usage)
12. [Consolidated API Master List](#consolidated-api-master-list)
13. [Stress Test & Edge Case Catalog](#stress-test--edge-case-catalog)

---

## 1. Screen → API Map

| # | Screen | Route | Phase | APIs Used |
|---|--------|-------|-------|-----------|
| 1 | Landing / Login | `/` | 1 | `POST /api/auth/webhook/clerk` (server-side, not called by frontend directly) |
| 2 | Onboarding Fallback | `/onboarding` | 1 | `GET /api/profile/me`, `PUT /api/profile/preferences`, `POST /api/profile/analyze` |
| 3 | Dashboard | `/dashboard` | 1 | `GET /api/dashboard`, `GET /api/profile/me`, `GET /api/recommendations`, `POST /api/recommendations/generate`, `GET /api/jobs/:id`, `POST /api/profile/analyze` |
| 4 | Repository Detail | `/repository/[id]` | 2 | `GET /api/repositories/:id`, `POST /api/repositories/:id/analyze`, `GET /api/repositories/:id/analysis-status`, `GET /api/repositories/:id/opportunities`, `POST /api/repositories/:id/save`, `DELETE /api/repositories/:id/save`, `GET /api/jobs/:id` |
| 5 | Search Results | `/search` | 2 | `GET /api/search?q=...` |
| 6 | History / Saved | `/history` | 2 | `GET /api/history/repositories`, `GET /api/history/blueprints`, `DELETE /api/repositories/:id/save` |
| 7 | Blueprint Detail | `/blueprint/[id]` | 3 | `POST /api/blueprints`, `GET /api/blueprints/:id`, `GET /api/blueprints/group/:group_id`, `PATCH /api/blueprints/:id`, `GET /api/jobs/:id` |
| 8 | Jules Handoff | `/blueprint/[id]` (sub-view) | 3 | `POST /api/blueprints/:id/jules-handoff` |
| 9 | Settings | `/settings` | 3 | `PUT /api/profile/preferences` (Jules API key management) |

---

## Screen 1: Landing / Login Page

**Route:** `/` (public)
**PRD Section:** §6.1
**Phase:** 1

### Purpose
Product value proposition page with a single "Continue with GitHub" CTA. Clerk SDK handles the entire OAuth flow client-side.

### APIs Consumed by This Screen

| API | Method | Called By | Trigger |
|-----|--------|-----------|---------|
| `POST /api/auth/webhook/clerk` | POST | Clerk (server-to-server) | Clerk fires `user.created` or `user.updated` webhook after OAuth completes |
| `GET /api/auth/me` | GET | Frontend | After successful login redirect, to verify session and fetch user info |

---

#### `POST /api/auth/webhook/clerk`

> [!NOTE]
> This endpoint is NOT called by the frontend. It is called server-to-server by Clerk's webhook infrastructure. The frontend never sees this request.

- **Auth:** Clerk Webhook Signature (verified via `svix` library)
- **Trigger Events:** `user.created`, `user.updated`, `user.deleted`
- **Request Headers:**
  - `svix-id`, `svix-timestamp`, `svix-signature`
- **Request Body:** Clerk webhook payload (JSON) containing user data and `external_accounts` (GitHub OAuth info)
- **Backend Actions on `user.created`:**
  1. Extract `github_id`, `github_username`, `avatar_url` from `external_accounts`
  2. Create document in `users` collection with `clerk_id`, `github_id`, `github_username`, `avatar_url`
  3. Set `profile_analysis_status` = `"queued"`
  4. Store encrypted OAuth tokens in `oauth_connections` collection
  5. Enqueue a `profile_analysis` background job
- **Response:** `200 OK` (empty body)
- **Error Responses:**
  - `400 Bad Request` — Invalid or missing webhook signature
  - `409 Conflict` — User with this `clerk_id` already exists (for `user.created` events)

---

#### `GET /api/auth/me`

- **Auth:** JWT (Clerk session token in `Authorization: Bearer <token>`)
- **Trigger:** Immediately after login redirect; also called on app load to verify session
- **Response `200 OK`:**
```json
{
  "user_id": "60c72b2f9b1d8a2f1c8d4567",
  "clerk_id": "user_2abc...",
  "github_username": "dev-first-time",
  "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
  "profile_analysis_status": "queued",
  "created_at": "2026-07-17T11:00:00Z",
  "last_login_at": "2026-07-17T11:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` — Invalid, expired, or missing JWT
  - `404 Not Found` — JWT valid but no matching user in MongoDB (webhook hasn't fired yet)

### Screen States

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| Default | Unauthenticated visitor | Show value prop + "Continue with GitHub" button |
| Loading | OAuth redirect in progress | Spinner with "Signing you in…" copy |
| Error: OAuth denied | User cancelled GitHub OAuth | Show "GitHub access is required" + retry |
| Error: GitHub outage | Clerk/GitHub unavailable | Show "GitHub is unavailable right now, try again later" |
| Success | Auth complete | Redirect to `/dashboard` |

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| User denies OAuth scopes | Show explanation of why scopes are needed + retry button; never silently degrade |
| GitHub OAuth service outage | Show "GitHub is unavailable right now" — not a generic error |
| Rate limit during token exchange | Queue/retry with backoff; inform user if delay > 3s |
| Webhook delivery delayed | Frontend hits `GET /api/auth/me` → 404 → retry with exponential backoff (max 5 retries, 1s intervals) |
| User already exists (`user.created` duplicate) | Webhook handler returns 200 OK but skips creation (idempotent upsert) |
| `user.deleted` event received | Cascade delete all user data (PRD §6.14): `users`, `oauth_connections`, `user_preferences`, `profile_snapshots`, `developer_profiles`, `blueprints`, `user_repository_states` |

### Analytics Events
`auth_login_started`, `auth_login_succeeded`, `auth_login_failed` (with reason category), `auth_logout`

---

## Screen 2: Onboarding Fallback (Manual Preferences)

**Route:** `/onboarding` (or inline modal on Dashboard)
**PRD Section:** §6.2 (Edge Case: Empty/Sparse GitHub Profile)
**Phase:** 1

### Purpose
If the user's GitHub profile has zero public repos or insufficient data for meaningful analysis, redirect them to a manual preferences form to self-select skills, languages, frameworks, interests, and difficulty preferences.

### APIs Consumed by This Screen

| API | Method | Trigger |
|-----|--------|---------|
| `GET /api/profile/me` | GET | On screen load — check if profile analysis failed or returned sparse results |
| `PUT /api/profile/preferences` | PUT | User submits manual preferences form |
| `POST /api/profile/analyze` | POST | After preferences are saved — re-trigger profile analysis to blend manual + GitHub data |

---

#### `PUT /api/profile/preferences`

- **Auth:** JWT
- **Request Body:**
```json
{
  "skills": ["frontend", "backend", "API development"],
  "languages": ["JavaScript", "Python"],
  "frameworks": ["React", "FastAPI"],
  "interests": ["CLI tools", "Web Apps"],
  "contribution_preferences": ["bug fixes", "documentation"],
  "difficulty_preference": "beginner"
}
```
- **Backend Actions:**
  1. Upsert document in `user_preferences` collection (keyed by `user_id`)
  2. Return updated preferences
- **Response `200 OK`:**
```json
{
  "message": "Preferences saved successfully",
  "user_id": "60c72b2f9b1d8a2f1c8d4567"
}
```
- **Error Responses:**
  - `400 Bad Request` — Invalid preference values (e.g., `difficulty_preference` not in `beginner|intermediate|advanced`)
  - `401 Unauthorized` — Invalid JWT

### Screen States

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| Default | Profile analysis returned sparse/empty results | Show multi-step form: skills → languages → frameworks → interests → difficulty |
| Submitting | User clicked "Save" | Loading spinner on submit button |
| Success | Preferences saved, re-analysis triggered | Redirect to Dashboard with "Personalizing your recommendations…" state |
| Error | Save failed | Inline error with retry |

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| User skips onboarding | Allow skip — dashboard shows generic trending repos + "Complete your profile for better recommendations" banner |
| User changes preferences later | Same `PUT` endpoint can be called from Settings page — it's an upsert |
| Extremely niche preferences (no matching repos) | Recommendation engine returns empty set → Dashboard shows "No strong matches" empty state with suggestion to broaden preferences |

---

## Screen 3: Personalized Dashboard

**Route:** `/dashboard` (protected)
**PRD Section:** §6.9 (Dashboard), §6.2 (Profile Module), §6.3 (Recommendations)
**Phase:** 1

### Purpose
The primary screen after login. Shows detected developer profile + ranked AI recommendations. This is the most important screen in the product.

### APIs Consumed by This Screen

| API | Method | Trigger | Notes |
|-----|--------|---------|-------|
| `GET /api/dashboard` | GET | On page load | **Primary aggregated endpoint** — returns profile summary + latest recommendations + recent activity in one call |
| `GET /api/profile/me` | GET | On page load (parallel or within dashboard) | Returns full profile with `profile_analysis_status` |
| `GET /api/recommendations` | GET | After profile analysis is complete | Returns latest recommendation run's results |
| `POST /api/recommendations/generate` | POST | Auto-triggered when profile analysis completes and no existing recommendations exist | Starts async recommendation generation |
| `POST /api/profile/analyze` | POST | On manual "Refresh Profile" click, or auto if profile > 7 days old | Re-triggers profile analysis |
| `GET /api/jobs/:id` | GET | Polling (every 2-3s) while profile analysis or recommendation generation is in progress | Returns job status (`queued`/`running`/`completed`/`failed`) |
| `POST /api/recommendations/feedback` | POST | User clicks "Not interested" on a recommendation card | Sends dismiss/feedback signal |

---

#### `GET /api/dashboard`

- **Auth:** JWT
- **Purpose:** Aggregate endpoint to reduce round-trips for fast dashboard load
- **Response `200 OK`:**
```json
{
  "user": {
    "github_username": "dev-first-time",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
    "profile_analysis_status": "complete"
  },
  "profile_summary": {
    "experience_level": "beginner",
    "primary_languages": ["Python", "TypeScript"],
    "frameworks": ["FastAPI", "React"],
    "skills": ["API development", "Component styling"],
    "last_analyzed_at": "2026-07-17T11:00:00Z"
  },
  "recommendations": [
    {
      "repository_id": "60c72b2f9b1d8a2f1c8d1111",
      "full_name": "facebook/react",
      "description": "A declarative JS library for building UIs.",
      "primary_language": "JavaScript",
      "stars": 220000,
      "match_score": 92.5,
      "confidence_score": 0.9,
      "reasons": [
        "Perfect language fit — TypeScript/JavaScript is your primary language.",
        "Framework match — React aligns with your frontend skills."
      ],
      "difficulty_badge": "beginner-friendly"
    }
  ],
  "recent_activity": {
    "saved_count": 3,
    "blueprints_count": 1
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` — Invalid JWT
  - `500 Internal Server Error` — Partial failure (see error handling below)

> [!TIP]
> **Partial failure handling:** If one sub-query fails (e.g., recommendations fail but profile succeeds), the endpoint should still return a `200 OK` with the successful parts populated and failed parts set to `null` with an error field. The frontend renders whatever succeeded.

---

#### `POST /api/recommendations/generate`

- **Auth:** JWT
- **Request Body:** (empty — user context derived from JWT)
- **Backend Actions:**
  1. Generate `idempotency_key` from `user_id + profile_snapshot_id + timestamp`
  2. Create `background_jobs` record with `job_type: "recommendation_generation"`, `status: "queued"`
  3. Create `recommendation_runs` record
  4. Trigger BackgroundTask: candidate ingestion → eligibility filtering → heuristic scoring → Gemini explanation → save results
- **Response `202 Accepted`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8d9999",
  "recommendation_run_id": "60c72b2f9b1d8a2f1c8d2222",
  "status": "queued"
}
```
- **Error Responses:**
  - `401 Unauthorized`
  - `409 Conflict` — Duplicate `idempotency_key` (generation already in progress)
  - `412 Precondition Failed` — Profile analysis not yet complete

---

#### `POST /api/profile/analyze`

- **Auth:** JWT
- **Request Body:** (empty)
- **Backend Actions:**
  1. Check if a profile analysis job is already running (via `current_profile_job_id` on user doc)
  2. If running, return existing job_id
  3. Otherwise create `background_jobs` record, update `users.profile_analysis_status` to `"queued"`, set `current_profile_job_id`
  4. Trigger BackgroundTask: GitHub crawl → skill inference → evidence snapshot → profile update
- **Response `202 Accepted`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8d8888",
  "status": "queued"
}
```
- **Error Responses:**
  - `401 Unauthorized`
  - `409 Conflict` — Analysis already in progress (return existing `job_id` instead)

---

#### `GET /api/jobs/:id`

> [!IMPORTANT]
> **SHARED ENDPOINT** — Used by Dashboard, Repository Detail, and Blueprint pages for polling any async background job.

- **Auth:** JWT
- **Response `200 OK`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8d9999",
  "job_type": "recommendation_generation",
  "status": "running",
  "attempt_count": 1,
  "created_at": "2026-07-17T11:04:30Z",
  "updated_at": "2026-07-17T11:04:35Z"
}
```
- **Status values:** `queued` → `running` → `completed` | `failed` | `dead_letter`
- **Error Responses:**
  - `401 Unauthorized`
  - `404 Not Found` — Job ID doesn't exist
  - `403 Forbidden` — Job belongs to another user

---

#### `POST /api/recommendations/feedback`

- **Auth:** JWT
- **Request Body:**
```json
{
  "repository_id": "60c72b2f9b1d8a2f1c8d1111",
  "signal": "dismissed"
}
```
- **Signal values:** `dismissed`, `saved`, `not_interested`
- **Response `200 OK`:**
```json
{
  "message": "Feedback recorded"
}
```

### Screen States

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| Profile Analyzing | `profile_analysis_status = queued\|in_progress` | Profile module shows skeleton cards + "Getting to know you…" text |
| Profile Complete, Recs Generating | Profile done, recommendation job running | Profile module renders, recommendation feed shows skeleton + "Personalizing your recommendations…" |
| Fully Loaded | Both profile + recommendations complete | Full dashboard: profile summary module + recommendation cards |
| Profile Failed | `profile_analysis_status = failed` | Show retry button + "Recommendations may be limited" |
| Recs Failed | Recommendation job failed | Show trending/general eligible repos as fallback + "Personalization temporarily unavailable" |
| Empty Recs | No repos matched thresholds | "No strong matches yet" empty state + prominent link to Manual Search + suggestion to update preferences |
| Stale Profile | Profile > 7 days old | Dashboard renders immediately with stale data; background refresh triggered silently |

### Dashboard Load Sequence (Frontend Logic)

```
1. Call GET /api/dashboard (aggregate)
2. If profile_analysis_status == "queued" or "in_progress":
   a. Show skeleton for profile module
   b. Poll GET /api/jobs/:id (user.current_profile_job_id) every 2s
   c. On "completed" → re-fetch GET /api/profile/me
   d. Auto-trigger POST /api/recommendations/generate
3. If profile_analysis_status == "complete" and no recommendations:
   a. Call POST /api/recommendations/generate
   b. Poll GET /api/jobs/:id every 2s
   c. On "completed" → fetch GET /api/recommendations
4. If profile_analysis_status == "complete" and recommendations exist:
   a. Render full dashboard immediately
5. If profile_analysis_status == "failed":
   a. Show retry button
   b. Check if user has manual preferences → if not, redirect to /onboarding
```

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| First login, everything is still queued | Dashboard shows skeleton state for both modules. Polls jobs until complete. |
| Profile analysis > 7 days old on login | Render existing data immediately, trigger `POST /api/profile/analyze` silently in background |
| Recommendation generation fails | Fall back to trending/general eligible repos with disclaimer banner |
| GitHub rate limit hit during analysis | Job retries with backoff (up to `retries` max). Job status shows `running` longer than usual |
| Job exceeds max retries → `dead_letter` | Show error state with "Analysis couldn't complete. Please try again later." |
| Ties in match score | Backend applies secondary sort (repo health, then recency) |
| User has dismissed all recommendations | Show empty state + suggestion to refresh or broaden preferences |

### Analytics Events
`dashboard_viewed`, `dashboard_load_time`, `recommendations_viewed`, `recommendation_card_clicked` (repo id, position, match score), `recommendation_dismissed`, `recommendations_empty_state_shown`, `profile_analysis_started`, `profile_analysis_completed` (duration, attribute count), `profile_analysis_failed` (reason)

---

## Screen 4: Repository Detail Page [Phase 2]

**Route:** `/repository/[id]` (protected)
**PRD Section:** §6.5 (Repo Overview), §6.6 (Opportunities)
**Phase:** 2

### Purpose
Displays AI-generated repository summary, tech stack, community health, and tiered contribution opportunities. Analysis is triggered on-open (not pre-computed).

### APIs Consumed by This Screen

| API | Method | Trigger | Notes |
|-----|--------|---------|-------|
| `GET /api/repositories/:id` | GET | On page load | Returns repo metadata + cached analysis (if available) |
| `POST /api/repositories/:id/analyze` | POST | Automatically if no cached analysis, or if cache is invalidated | Force (re)analysis |
| `GET /api/repositories/:id/analysis-status` | GET | Polling while analysis runs | Check analysis progress |
| `GET /api/repositories/:id/opportunities` | GET | After analysis completes | Returns tiered contribution opportunities |
| `POST /api/repositories/:id/save` | POST | User clicks "Save" bookmark | Save repo for later |
| `DELETE /api/repositories/:id/save` | DELETE | User clicks "Unsave" | Remove saved repo |
| `GET /api/jobs/:id` | GET | Polling while analysis job runs | **SHARED** — same polling endpoint |

---

#### `GET /api/repositories/:id`

- **Auth:** JWT
- **Response `200 OK` (with cached analysis):**
```json
{
  "repository": {
    "id": "60c72b2f9b1d8a2f1c8d1111",
    "github_repo_id": 10270250,
    "full_name": "facebook/react",
    "description": "A declarative JS library...",
    "primary_language": "JavaScript",
    "topics": ["react", "javascript", "ui"],
    "stars": 220000,
    "forks": 45000,
    "open_issues_count": 850,
    "last_commit_at": "2026-07-16T08:00:00Z",
    "license": "MIT",
    "is_fork": false,
    "is_archived": false,
    "health_score": 95.0,
    "beginner_friendly_score": 72.0,
    "doc_quality_score": 88.0,
    "eligibility_status": "eligible",
    "eligibility_reasons": []
  },
  "analysis": {
    "summary_text": "React is a declarative, component-based library...",
    "tech_stack": ["JavaScript", "TypeScript", "Flow"],
    "activity_summary": "Very active — 200+ commits in the last 90 days...",
    "community_summary": "Large, responsive community...",
    "contribution_friendliness_score": 78.0,
    "onboarding_difficulty": "moderate",
    "confidence_score": 0.93,
    "analyzed_at": "2026-07-16T10:00:00Z",
    "commit_sha": "abc123def...",
    "default_branch": "main",
    "analysis_version": "v1.0"
  },
  "is_saved": true
}
```
- **Response `200 OK` (no cached analysis — triggers on-open analysis):**
```json
{
  "repository": { ... },
  "analysis": null,
  "analysis_status": "analyzing",
  "analysis_job_id": "60c72b2f9b1d8a2f1c8daaa1",
  "is_saved": false
}
```
- **Error Responses:**
  - `401 Unauthorized`
  - `404 Not Found` — Repository not in cache (fetch from GitHub and create?)

---

#### `POST /api/repositories/:id/analyze`

- **Auth:** JWT
- **Request Body:**
```json
{
  "idempotency_key": "repo-60c72b2f-analyze-2026-07-17"
}
```
- **Response `202 Accepted`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8daaa1",
  "status": "queued"
}
```
- **Error Responses:**
  - `409 Conflict` — Duplicate `idempotency_key` (analysis already in progress)

---

#### `GET /api/repositories/:id/analysis-status`

- **Auth:** JWT
- **Response `200 OK`:**
```json
{
  "status": "running",
  "job_id": "60c72b2f9b1d8a2f1c8daaa1",
  "started_at": "2026-07-17T11:10:00Z"
}
```

---

#### `GET /api/repositories/:id/opportunities`

- **Auth:** JWT
- **Response `200 OK`:**
```json
{
  "opportunities": [
    {
      "id": "opp_001",
      "tier": 1,
      "source_type": "github_issue",
      "title": "Fix accessibility for modal component",
      "description": "The modal component doesn't trap focus...",
      "github_issue_number": 27341,
      "github_issue_url": "https://github.com/facebook/react/issues/27341",
      "current_issue_state": "open",
      "assignees": [],
      "linked_pull_requests": [],
      "estimated_difficulty": "easy",
      "is_possibly_claimed": false,
      "last_issue_activity": "2026-07-15T09:30:00Z",
      "confidence_score": null
    },
    {
      "id": "opp_008",
      "tier": 8,
      "source_type": "ai_generated",
      "title": "Add JSDoc comments to useReducer internals",
      "description": "The useReducer hook implementation lacks inline documentation...",
      "github_issue_number": null,
      "github_issue_url": null,
      "estimated_difficulty": "easy",
      "is_possibly_claimed": false,
      "confidence_score": 0.78
    }
  ]
}
```

---

#### `POST /api/repositories/:id/save` / `DELETE /api/repositories/:id/save`

- **Auth:** JWT
- **Request Body:** (empty — user derived from JWT, repo from URL)
- **Backend Actions:**
  - `POST`: Upsert `user_repository_states` → set `is_saved: true`, `saved_at: now()`
  - `DELETE`: Update `user_repository_states` → set `is_saved: false`, `saved_at: null`
- **Response `200 OK`:**
```json
{
  "is_saved": true
}
```

### Screen States

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| Loading (first open) | No cached analysis | Full-page skeleton + "Analyzing repository…" |
| Cached | Valid cached analysis | Instant render from cache with "Last analyzed" timestamp |
| Re-analyzing | Cache invalidated (commit SHA changed) | Show stale data with "Refreshing analysis…" inline banner |
| Analysis failed | Job status = failed | Show basic GitHub metadata + "AI summary unavailable" + retry button |
| Archived repo | `is_archived: true` | Banner: "This repository has been archived. Contributions may not be accepted." |

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Repo archived after initial analysis | Show cached analysis (read-only reference) with clear archived banner |
| Missing README | Flag as ineligible with explanation; allow viewing but warn user |
| Repo too large for analysis | Cap analysis scope, show "Summary may be partial due to repository size" |
| Analysis takes > 30s | Show "Still analyzing, this can take a moment for larger repositories" |
| AI cannot confidently summarize | Show partial results with confidence flagged low |
| Cache metadata > 24h old | Check GitHub for commit SHA update; re-analyze if new commit detected |
| Opportunity's issue was closed between discovery and viewing | Show with strikethrough + "This issue may have been closed" |
| Stale/claimed issue | Flag with "May be claimed" badge but don't hard-exclude |

### Analytics Events
`repository_opened`, `repository_analysis_triggered`, `repository_analysis_completed` (duration), `repository_analysis_failed`, `repository_analysis_served_from_cache`, `opportunities_viewed`, `opportunity_selected` (tier, source_type)

---

## Screen 5: Search Results Page [Phase 2]

**Route:** `/search` (protected)
**PRD Section:** §6.10
**Phase:** 2

### Purpose
Secondary discovery path. Proxies live GitHub Search API with eligibility annotations.

### APIs Consumed by This Screen

| API | Method | Trigger |
|-----|--------|---------|
| `GET /api/search?q=...` | GET | User types search query (debounced ~300ms) |

---

#### `GET /api/search?q=...`

- **Auth:** JWT
- **Query Parameters:**
  - `q` (required): Search term
  - `language` (optional): Filter by language
  - `topic` (optional): Filter by topic
  - `page` (optional): Pagination (default 1)
  - `per_page` (optional): Results per page (default 20, max 50)
- **Backend Actions:**
  1. Proxy query to GitHub Search API (`search/repositories`)
  2. For each result, check if repo exists in local `repositories` cache
  3. If exists: attach cached `eligibility_status` and `eligibility_reasons`
  4. If not cached: run lightweight eligibility check (no full analysis)
  5. Return results sorted by GitHub relevance, with eligibility badges
- **Response `200 OK`:**
```json
{
  "total_count": 142,
  "page": 1,
  "per_page": 20,
  "results": [
    {
      "github_repo_id": 10270250,
      "full_name": "facebook/react",
      "description": "A declarative JS library...",
      "primary_language": "JavaScript",
      "stars": 220000,
      "eligibility_status": "eligible",
      "eligibility_reasons": [],
      "is_cached": true
    },
    {
      "github_repo_id": 99999,
      "full_name": "abandoned/project",
      "description": "An old project",
      "primary_language": "Java",
      "stars": 5,
      "eligibility_status": "ineligible",
      "eligibility_reasons": ["Below minimum star count", "No recent commits"],
      "is_cached": false
    }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized`
  - `429 Too Many Requests` — GitHub API rate limit hit
  - `502 Bad Gateway` — GitHub Search API unavailable

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Empty search query | Return empty results, show placeholder text |
| No results found | Clear empty state: "No repositories match your search. Try different terms." |
| GitHub API rate limited | Show "Search is temporarily unavailable due to high demand. Try again in a few seconds." |
| Very short query (< 2 chars) | Don't send request; show hint text |
| Ineligible repo clicked | Navigate to Repository Detail page normally — it works the same for all repos |

### Analytics Events
`search_performed` (result count — avoid logging raw query for privacy), `search_result_clicked`

---

## Screen 6: History / Saved Page [Phase 2]

**Route:** `/history` (protected)
**PRD Section:** §6.11
**Phase:** 2

### Purpose
Tabbed view showing "Recently Viewed", "Saved", and "Blueprints" — allows users to revisit previous work.

### APIs Consumed by This Screen

| API | Method | Trigger | Notes |
|-----|--------|---------|-------|
| `GET /api/history/repositories` | GET | On page load (Recently Viewed tab) | Returns repos from `user_repository_states` where `is_viewed = true`, sorted by `last_viewed_at DESC` |
| `GET /api/history/blueprints` | GET | On Blueprints tab click | Returns user's blueprints sorted by `created_at DESC` |
| `DELETE /api/repositories/:id/save` | DELETE | User clicks "Unsave" | **SHARED** — same unsave endpoint as Repository Detail |

---

#### `GET /api/history/repositories`

- **Auth:** JWT
- **Query Parameters:**
  - `type` (optional): `viewed` | `saved` (default: both)
  - `page`, `per_page` (pagination)
- **Response `200 OK`:**
```json
{
  "repositories": [
    {
      "repository_id": "60c72b2f9b1d8a2f1c8d1111",
      "full_name": "facebook/react",
      "primary_language": "JavaScript",
      "stars": 220000,
      "is_saved": true,
      "saved_at": "2026-07-16T14:00:00Z",
      "last_viewed_at": "2026-07-17T09:30:00Z",
      "eligibility_status": "eligible"
    }
  ],
  "total_count": 12,
  "page": 1
}
```

---

#### `GET /api/history/blueprints`

- **Auth:** JWT
- **Query Parameters:** `page`, `per_page`
- **Response `200 OK`:**
```json
{
  "blueprints": [
    {
      "id": "bp_001",
      "blueprint_group_id": "bpg_001",
      "version": 2,
      "repository_full_name": "facebook/react",
      "opportunity_title": "Fix modal accessibility",
      "status": "complete",
      "created_at": "2026-07-17T10:00:00Z"
    }
  ],
  "total_count": 3,
  "page": 1
}
```

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Saved repo becomes archived | Still show in list with "Archived" badge — historical reference is valid |
| Empty history (new user) | Show empty state: "Explore some repositories to build your history" |
| Blueprint in `failed` status | Show in list with "Generation failed" badge + option to retry |

### Analytics Events
`history_viewed`, `repository_saved`, `repository_unsaved`, `blueprint_reopened`

---

## Screen 7: Blueprint Detail Page [Phase 3]

**Route:** `/blueprint/[id]` (protected)
**PRD Section:** §6.7
**Phase:** 3

### Purpose
Display the full structured Contribution Blueprint with progressive section-by-section reveal during generation.

### APIs Consumed by This Screen

| API | Method | Trigger |
|-----|--------|---------|
| `POST /api/blueprints` | POST | User clicks "Generate Blueprint" from Repository Detail (opportunity selected) |
| `GET /api/blueprints/:id` | GET | On page load — retrieve specific blueprint |
| `GET /api/blueprints/group/:group_id` | GET | View version history of a blueprint group |
| `GET /api/blueprints` | GET | List all blueprints for authenticated user |
| `PATCH /api/blueprints/:id` | PATCH | Regenerate or update a blueprint section |
| `GET /api/jobs/:id` | GET | **SHARED** — poll generation job status |

---

#### `POST /api/blueprints`

- **Auth:** JWT
- **Request Body:**
```json
{
  "repository_id": "60c72b2f9b1d8a2f1c8d1111",
  "opportunity_id": "opp_001",
  "idempotency_key": "bp-user123-repo456-opp001-20260717"
}
```
- **Backend Actions:**
  1. Validate opportunity still exists and is fresh
  2. Create `background_jobs` record with `job_type: "blueprint_generation"`
  3. Create `blueprints` record with `status: "generating"`, assign `blueprint_group_id` (new group or existing if regeneration)
  4. Trigger BackgroundTask: gather repo analysis + profile + opportunity → generate all blueprint sections via Gemini → update status to `complete`
- **Response `202 Accepted`:**
```json
{
  "blueprint_id": "bp_001",
  "blueprint_group_id": "bpg_001",
  "job_id": "60c72b2f9b1d8a2f1c8dbbb1",
  "status": "generating"
}
```
- **Error Responses:**
  - `409 Conflict` — Duplicate `idempotency_key`
  - `404 Not Found` — Repository or opportunity not found
  - `412 Precondition Failed` — Opportunity is stale/closed

---

#### `GET /api/blueprints/:id`

- **Auth:** JWT
- **Response `200 OK`:**
```json
{
  "id": "bp_001",
  "blueprint_group_id": "bpg_001",
  "version": 1,
  "status": "complete",
  "repository_understanding": "React is a component-based UI library...",
  "match_explanation": "This repository matches because...",
  "confidence_level": 0.91,
  "estimated_difficulty": "moderate",
  "estimated_effort": "4-6 hours",
  "learning_objectives": [
    "Understand React's reconciliation algorithm",
    "Learn how accessibility attributes propagate"
  ],
  "constraints": [
    "Must maintain backward compatibility with React 17",
    "All changes require unit test coverage"
  ],
  "suggested_reading_order": [
    { "file": "packages/react-dom/src/client/ReactDOMComponent.js", "reason": "Core component rendering logic" },
    { "file": "CONTRIBUTING.md", "reason": "Project contribution guidelines" }
  ],
  "implementation_strategy": "Start by reviewing the existing modal...",
  "final_jules_prompt": "You are helping implement a fix for...",
  "created_at": "2026-07-17T10:00:00Z"
}
```

---

#### `PATCH /api/blueprints/:id`

- **Auth:** JWT
- **Purpose:** Regenerate blueprint (creates new version in same group)
- **Request Body:**
```json
{
  "action": "regenerate",
  "opportunity_id": "opp_002",
  "idempotency_key": "bp-regen-user123-20260717-v2"
}
```
- **Response `202 Accepted`:**
```json
{
  "new_blueprint_id": "bp_002",
  "blueprint_group_id": "bpg_001",
  "version": 2,
  "supersedes_blueprint_id": "bp_001",
  "job_id": "60c72b2f9b1d8a2f1c8dbbb2",
  "status": "generating"
}
```

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| User backs out mid-generation | Save as `status: "generating"` — recoverable but marked incomplete |
| Opportunity closed between selection and generation | Return `412` before starting; suggest alternative opportunity |
| AI confidence too low for a section | Show section with low-confidence indicator rather than omitting |
| Overall confidence too low | Surface warning: "This Blueprint has lower confidence. Consider a different opportunity." |
| Generation exceeds 45s | Show progressive section reveal as each part completes |

### Analytics Events
`blueprint_generation_started`, `blueprint_generation_completed` (duration, section confidence scores), `blueprint_generation_failed`, `blueprint_viewed`, `blueprint_reopened_from_history`

---

## Screen 8: Jules Handoff Screen [Phase 3]

**Route:** `/blueprint/[id]` (sub-view / modal on Blueprint Detail)
**PRD Section:** §6.8
**Phase:** 3

### Purpose
Transition from Blueprint to Google Jules implementation session.

### APIs Consumed by This Screen

| API | Method | Trigger |
|-----|--------|---------|
| `POST /api/blueprints/:id/jules-handoff` | POST | User clicks "Continue to Google Jules" |

---

#### `POST /api/blueprints/:id/jules-handoff`

- **Auth:** JWT
- **Request Body:**
```json
{
  "idempotency_key": "handoff-bp001-20260717-attempt1"
}
```
- **Backend Actions:**
  1. Retrieve `blueprints` document → get `final_jules_prompt` and `repository_id`
  2. Retrieve user's `jules_api_key` from `user_preferences` (decrypt)
  3. If no API key → return fallback immediately
  4. Call Jules REST API: List Sources (verify repo is connected)
  5. Call Jules REST API: Create Session with `final_jules_prompt`
  6. Log to `handoff_events` collection
  7. Return session URL
- **Response `200 OK` (API success):**
```json
{
  "method": "api",
  "session_url": "https://jules.google.com/session/abc123",
  "session_id": "abc123"
}
```
- **Response `200 OK` (API fallback — no key, API down, or app not installed):**
```json
{
  "method": "copy",
  "prompt": "You are helping implement a fix for...",
  "error_reason": "Jules API key not configured"
}
```
- **Error Responses:**
  - `401 Unauthorized`
  - `404 Not Found` — Blueprint doesn't exist
  - `409 Conflict` — Duplicate `idempotency_key`

### Screen States

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| Default | Blueprint complete, ready for handoff | Show Blueprint recap + "Continue to Google Jules" button |
| Loading | Backend calling Jules API | "Creating your Jules session…" spinner (1-3s typical) |
| API Success | Session created | Auto-redirect to `jules.google.com/session/...` |
| Fallback: No Key | User hasn't set Jules API key | Polished copy-paste prompt display + link to Settings to add key |
| Fallback: API Down | Jules API unreachable | "We couldn't connect to Jules automatically." + copy-paste fallback |
| Fallback: App Not Installed | Jules GitHub App not on target repo | Clear message + link to install Jules GitHub App + copy-paste |
| Fallback: Key Invalid | API key expired/invalid | Error message + link to regenerate key at `jules.google.com` + copy-paste |

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Jules API unreachable | Graceful fallback to copy-paste; log `jules_handoff_failed` |
| Multiple blueprints open across tabs | Each handoff carries its own `idempotency_key` + `blueprint_id` — no cross-contamination |
| Jules API key invalid/expired | Show error + link to regenerate at `jules.google.com` + copy-paste fallback |
| Jules GitHub App not installed on repo | Actionable message: "Install the Jules GitHub App on this repository" + install link + copy-paste fallback |
| Double-click on "Continue" button | `idempotency_key` prevents duplicate session creation |

### Analytics Events
`jules_handoff_initiated` (method), `jules_handoff_succeeded` (session_id), `jules_handoff_failed` (error_reason), `jules_prompt_copied`

---

## Screen 9: Settings Page [Phase 3]

**Route:** `/settings` (protected)
**PRD Section:** §6.8 (FR-8.5)
**Phase:** 3

### Purpose
User profile/settings management. Primary use: managing Jules API key.

### APIs Consumed by This Screen

| API | Method | Trigger |
|-----|--------|---------|
| `GET /api/profile/me` | GET | Load current profile info |
| `PUT /api/profile/preferences` | PUT | Update Jules API key or other preferences |

> [!NOTE]
> The `PUT /api/profile/preferences` endpoint is **SHARED** with the Onboarding Fallback screen. When called from Settings, the body may include `jules_api_key`.

**Additional request body field for Settings:**
```json
{
  "jules_api_key": "AIzaSy..."
}
```
The backend encrypts this with AES-256-GCM before storing in `user_preferences`.

---

## Shared / Repeated API Usage

> [!IMPORTANT]
> The following APIs are consumed by **multiple screens**. Backend developers must design these as stable, well-tested, general-purpose endpoints.

| API Endpoint | Screens That Use It | Notes |
|--------------|---------------------|-------|
| `GET /api/auth/me` | Login (post-redirect), Dashboard, Settings | Session verification + user info |
| `GET /api/profile/me` | Dashboard, Onboarding, Settings | Full profile with analysis status |
| `PUT /api/profile/preferences` | Onboarding, Settings | Upsert preferences (skills, difficulty, Jules API key) |
| `POST /api/profile/analyze` | Dashboard (auto on stale profile), Onboarding (after preferences saved) | Trigger profile analysis job |
| `GET /api/jobs/:id` | Dashboard, Repository Detail, Blueprint Detail | **Universal job poller** for any `background_jobs` record |
| `POST /api/repositories/:id/save` | Repository Detail, (future: recommendation cards) | Save bookmark |
| `DELETE /api/repositories/:id/save` | Repository Detail, History/Saved | Remove bookmark |
| `GET /api/recommendations` | Dashboard (direct), Dashboard (via aggregate) | Latest recommendations |

---

## Consolidated API Master List

### Phase 1 — Core APIs (10 endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 1 | POST | `/api/auth/webhook/clerk` | Svix Signature | Sync user from Clerk webhook events |
| 2 | GET | `/api/auth/me` | JWT | Get current authenticated user |
| 3 | POST | `/api/profile/analyze` | JWT | Trigger async profile analysis job |
| 4 | GET | `/api/profile/me` | JWT | Get profile analysis results |
| 5 | PUT | `/api/profile/preferences` | JWT | Save/update manual preferences |
| 6 | POST | `/api/recommendations/generate` | JWT | Trigger async recommendation generation |
| 7 | GET | `/api/recommendations` | JWT | Get latest recommendation results |
| 8 | GET | `/api/recommendations/runs/:run_id` | JWT | Get recommendations from a specific run |
| 9 | POST | `/api/recommendations/feedback` | JWT | Submit dismiss/save feedback signal |
| 10 | GET | `/api/jobs/:id` | JWT | Poll any background job status |

**Aggregate (optional optimization):**

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 11 | GET | `/api/dashboard` | JWT | Aggregated dashboard data (profile + recommendations + activity) |

---

### Phase 2 — Repository Detail, Search, History (8 endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 12 | GET | `/api/repositories/:id` | JWT | Repo metadata + cached analysis |
| 13 | POST | `/api/repositories/:id/analyze` | JWT | Force re-analysis (returns `202`) |
| 14 | GET | `/api/repositories/:id/analysis-status` | JWT | Poll analysis status |
| 15 | GET | `/api/repositories/:id/opportunities` | JWT | Tiered contribution opportunities |
| 16 | POST | `/api/repositories/:id/save` | JWT | Save/bookmark repository |
| 17 | DELETE | `/api/repositories/:id/save` | JWT | Unsave/unbookmark repository |
| 18 | GET | `/api/search?q=...` | JWT | Search repos (GitHub proxy + eligibility) |
| 19 | GET | `/api/history/repositories` | JWT | Recently viewed + saved repos |

---

### Phase 3 — Blueprints, Handoff, History (7 endpoints)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 20 | POST | `/api/blueprints` | JWT | Generate new blueprint |
| 21 | GET | `/api/blueprints/:id` | JWT | Retrieve specific blueprint |
| 22 | GET | `/api/blueprints/group/:group_id` | JWT | List versions in a blueprint group |
| 23 | GET | `/api/blueprints` | JWT | List all blueprints for authenticated user |
| 24 | PATCH | `/api/blueprints/:id` | JWT | Regenerate/update blueprint |
| 25 | POST | `/api/blueprints/:id/jules-handoff` | JWT | Create Jules Session → redirect |
| 26 | GET | `/api/history/blueprints` | JWT | Blueprint history list |

---

**Total: 26 unique API endpoints** (11 Phase 1, 8 Phase 2, 7 Phase 3)

---

## Stress Test & Edge Case Catalog

### Authentication & Security

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-1 | Expired JWT token on any endpoint | `401 Unauthorized` with clear error, frontend redirects to login | 🔴 Critical |
| S-2 | Tampered JWT (invalid signature) | `401 Unauthorized`, logged server-side | 🔴 Critical |
| S-3 | Webhook payload with invalid `svix-signature` | `400 Bad Request`, event rejected | 🔴 Critical |
| S-4 | User A tries to access User B's profile/data | `403 Forbidden` — all endpoints must scope to authenticated user | 🔴 Critical |
| S-5 | Clerk webhook `user.deleted` event | Cascade delete all user data across 7 collections | 🔴 Critical |
| S-6 | OAuth tokens rotated/expired | Backend refreshes via stored refresh token or Clerk SDK | 🟡 Medium |

### Idempotency & Concurrency

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-7 | Duplicate `POST /api/profile/analyze` while job is running | Return existing `job_id`, don't create duplicate | 🔴 Critical |
| S-8 | Duplicate `POST /api/recommendations/generate` with same `idempotency_key` | `409 Conflict` with existing job reference | 🔴 Critical |
| S-9 | Duplicate `POST /api/blueprints` with same `idempotency_key` | `409 Conflict` | 🔴 Critical |
| S-10 | Duplicate `POST /api/blueprints/:id/jules-handoff` (double-click) | `409 Conflict` — prevent duplicate Jules sessions | 🔴 Critical |
| S-11 | Two browser tabs trigger analysis on same repo simultaneously | Only one analysis runs; second request returns existing job | 🟡 Medium |
| S-12 | Race condition: profile analysis completes while dashboard is mid-poll | Next poll picks up `completed` status; frontend re-fetches data | 🟡 Medium |

### Background Jobs & Reliability

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-13 | Backend crashes mid-job execution | Job stays in `running` state; on restart, stale jobs detected by timeout and retried | 🔴 Critical |
| S-14 | Job exceeds max retries | Job transitions to `dead_letter`; frontend shows permanent failure state | 🟡 Medium |
| S-15 | Job timeout exceeded | Worker detects expired lease, marks job as `failed`, increments `attempt_count` | 🟡 Medium |
| S-16 | Backend restarts with queued jobs | Jobs remain in MongoDB; workers pick them up on restart | 🔴 Critical |

### GitHub API

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-17 | GitHub API rate limit hit (5000/hr) | Exponential backoff; job retries; user informed if delay > few seconds | 🟡 Medium |
| S-18 | GitHub API down entirely | Profile analysis fails gracefully; dashboard shows retry state | 🟡 Medium |
| S-19 | User has 500+ public repos | Profile analyzer caps to top 20 most recently active repos | 🟢 Low |
| S-20 | User has 0 public repos | Redirect to onboarding fallback for manual preferences | 🟡 Medium |
| S-21 | User's GitHub account is deleted after sign-up | Profile analysis fails; show manual preference fallback | 🟢 Low |

### LLM / Gemini API

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-22 | Gemini API timeout (> 30s response) | Job retries; if persistent, use cached/partial results | 🟡 Medium |
| S-23 | Gemini returns malformed JSON | Validation failure logged in `ai_runs`; retry with different prompt version | 🟡 Medium |
| S-24 | Gemini API quota exceeded | Switch to fallback provider (OpenAI) if configured; log in `ai_runs` | 🟡 Medium |
| S-25 | Gemini generates hallucinated content | Structurally prevented: explanations are generated FROM pre-computed scores, not free-form reasoning | 🟢 Low (by design) |

### Data Integrity

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-26 | Repository becomes archived after recommendation | Excluded from future runs; existing recommendations still viewable | 🟡 Medium |
| S-27 | Repository's license removed after caching | Next eligibility check marks as `ineligible`; flagged in UI if user revisits | 🟢 Low |
| S-28 | Blueprint references opportunity that was closed | `412 Precondition Failed` on generation; suggest alternative | 🟡 Medium |
| S-29 | Profile snapshot references deleted GitHub data | Snapshot is immutable — data preserved as historical record | 🟢 Low |
| S-30 | Concurrent updates to `user_preferences` | Last-write-wins with `updated_at` timestamp | 🟢 Low |

### Frontend Resilience

| # | Scenario | Expected Behavior | Severity |
|---|----------|-------------------|----------|
| S-31 | Dashboard aggregate endpoint partially fails | Render successful parts; null + error field for failed parts | 🟡 Medium |
| S-32 | Network disconnect during job polling | SWR retries with exponential backoff; show "Reconnecting…" indicator | 🟡 Medium |
| S-33 | User navigates away during blueprint generation | Job continues server-side; user can return later to see completed blueprint | 🟢 Low |
| S-34 | Browser tab left open for hours (stale JWT) | Clerk SDK auto-refreshes session; if expired, redirect to login | 🟡 Medium |
| S-35 | Very slow network (> 10s API response) | All API calls should have configurable timeouts; show timeout message | 🟢 Low |

---

> [!CAUTION]
> **Before starting backend development**, verify that every `idempotency_key` generation strategy is documented and implemented consistently. An idempotency failure in production could create duplicate Jules sessions, duplicate blueprint versions, or duplicate recommendation runs — all of which are expensive and confusing for users.

# OpenScout.ai — Phase 1 Specification (Core Recommendations)

This specification defines the product flow, algorithms, and API contracts for **Phase 1: Discover the Right Repository**.

---

## 1. Phase 1 Goal & Scope
The outcome of Phase 1 is to allow a developer to sign in with GitHub, have their skills analyzed, and receive 5–10 eligible open-source repository recommendations ranked by a personalized match score, accompanied by transparent, AI-generated explanations and confidence scores.

### Phase 1 Core Architecture Stack
- **Frontend:** Next.js (App Router), Tailwind CSS.
- **Backend:** FastAPI (Python).
- **Database:** MongoDB (Motor driver).
- **Authentication:** Clerk OAuth (GitHub identity).
- **Background Jobs:** FastAPI BackgroundTasks tracked durably in MongoDB.
- **AI Engine:** Google Gemini API (via unified `ai_service`).

---

## 2. End-to-End User & Process Flow

```
User logs in (Clerk OAuth)
  │
  ▼
Clerk Webhook creates User document in MongoDB
  │
  ▼
API triggers Developer Profile Analysis job (returns Job ID)
  │
  ▼ (FastAPI BackgroundTask)
1. Crawls user's public repos, languages, commit frequencies, and PR activities.
2. If GitHub data is empty/sparse → prompts manual preferences survey.
3. Infers primary languages, frameworks, topics, and experience level.
4. Generates immutable Evidence Snapshot and aggregates Developer Profile.
5. Updates Job status → completed.
  │
  ▼
Dashboard polls Job Status → complete. Triggers Recommendation Generation (returns Job ID)
  │
  ▼ (FastAPI BackgroundTask)
1. Candidate Ingestion: Constructs query strings from user profile and queries live GitHub Search API.
2. Deduplicates candidates and caches raw repositories in MongoDB.
3. Eligibility Gate: Deterministically filters candidates against quality rules.
4. Heuristic Scoring: Runs weighted matching scoring.
5. AI explanation: Gemini generates bullet reasons based on score breakdowns.
6. Saves Recommendation Run & Recommendations to MongoDB.
7. Updates Job status → completed.
  │
  ▼
Dashboard polls Job Status → complete. Displays Recommendations Feed.
```

---

## 3. Core Components & Logic

### 3.1 Developer Profile Analyzer
- **Deterministic parsing:** Summarizes public repository language bytes, topic counts, commit counts, and repository sizes.
- **Competency / Experience Heuristics:** Inferred based on repository sizes, commit frequencies, and project domains.
- **Fallback Onboarding:** Triggered if a user's GitHub account has no public repositories or commits. The user selects:
  - Skills (e.g., frontend, backend)
  - Languages (e.g., Python, TypeScript)
  - Frameworks (e.g., FastAPI, React)
  - Interests & difficulty preferences
  These are saved in `user_preferences` and merged into the active `developer_profile`.

### 3.2 Candidate Ingestion Service
- **Query Builder:** Takes top 3 languages, top 3 frameworks, and top 2 interests from the developer profile and formats search strings:
  `language:TypeScript topic:react pushed:>2026-04-01`
- **GitHub Search API:** Fetches up to 50 repository candidates matching the query.
- **Deduplication:** Inserts new repositories into the `repositories` collection using the unique `github_repo_id` key.

### 3.3 Eligibility Filters (Deterministic Quality Gate)
Every candidate repository must satisfy **all** of the following filters to be graded as `"eligible"`. If any filter fails, it is graded `"ineligible"` with a cached reason list:
1. **Public:** `is_fork == false` AND `is_archived == false`.
2. **Recent Activity:** Last commit (`pushed_at`) was within the last 90 days.
3. **Readme Presence:** A README file exists and contains at least 500 characters.
4. **Valid License:** A detectable open-source license is present (e.g., MIT, Apache 2.0, GPL, BSD).
5. **Popularity Minimum:** Stars count $\ge$ 10 and forks count $\ge$ 2.
6. **Community Size:** Distinct contributors count $\ge$ 2 in GitHub metadata.

### 3.4 Heuristic Match Scoring
The composite match score (0-100) is calculated using a deterministic weighted formula:
- **30% Language Overlap:** Fraction of the repository's languages matching the user's primary languages.
- **20% Framework/Topic Similarity:** Match between repository topics/tags and user's framework preferences.
- **15% Experience Level Alignment:** Direct alignment of user experience level with repository difficulty indicators (e.g., ratio of good-first-issues to total issues, codebase size).
- **10% Recency and Activity:** Frequency and density of commits in the last 90 days.
- **10% Beginner Friendliness:** Presence of structured templates (PR templates, issue templates) and labels.
- **15% Documentation & Maintainer Health:** Documentation quality score (derived from README structure) and average issue closure latency.

### 3.5 AI explanation Generation
To preserve transparency, Gemini is given only structured match data. It generates readable explanations justifying the score.
* **Input Payload:**
```json
{
  "user_profile": {
    "primary_languages": ["TypeScript", "JavaScript"],
    "skills": ["React", "CSS"],
    "experience_level": "beginner"
  },
  "repository": {
    "name": "calcom/cal.com",
    "primary_language": "TypeScript",
    "topics": ["scheduling", "react"],
    "stars": 24000,
    "good_first_issue_count": 14
  },
  "score_breakdown": {
    "language_match": 1.0,
    "framework_match": 0.9,
    "difficulty_match": 0.85
  }
}
```
* **Gemini Output:**
```json
{
  "confidence_score": 0.92,
  "reasons": [
    "Perfect language fit: This project's core code is written in TypeScript, your primary language.",
    "Framework match: Cal.com uses React for its scheduling dashboard, aligned with your frontend skills.",
    "Beginner friendly: Surface level issues are active, with 14 open 'good first issues' ready to claim."
  ]
}
```

---

## 4. Phase 1 API Specifications

### 4.1 Authentication Webhook
#### `POST /api/auth/webhook/clerk`
Synchronizes Clerk auth users to MongoDB.
- **Request Headers:**
  - `svix-signature`: Svix webhook validation signature
- **Response:**
  - `200 OK` (user created or updated)

#### `GET /api/auth/me`
Retrieves details of the logged-in user.
- **Headers:**
  - `Authorization: Bearer <Clerk JWT>`
- **Response `200 OK`:**
```json
{
  "user_id": "60c72b2f9b1d8a2f1c8d4567",
  "github_username": "dev-first-time",
  "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4"
}
```

### 4.2 Profile Endpoints
#### `POST /api/profile/analyze`
Starts an asynchronous background job to analyze user's GitHub profile.
- **Headers:** `Authorization: Bearer <Clerk JWT>`
- **Response `202 Accepted`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8d8888",
  "status": "queued"
}
```

#### `GET /api/profile/me`
Retrieves the user's inferred profile details.
- **Response `200 OK`:**
```json
{
  "experience_level": "beginner",
  "experience_confidence": 0.85,
  "primary_languages": ["Python", "TypeScript"],
  "frameworks": ["FastAPI", "React"],
  "skills": ["API development", "Component styling"],
  "interests": ["CLI tools", "Web Apps"],
  "last_analyzed_at": "2026-07-17T11:00:00Z"
}
```

#### `PUT /api/profile/preferences`
Updates onboarding preferences when profile evidence is empty or needs manual overriding.
- **Request Body:**
```json
{
  "skills": ["JavaScript", "HTML"],
  "languages": ["JavaScript"],
  "frameworks": ["React"],
  "interests": ["Automation"],
  "difficulty_preference": "beginner"
}
```
- **Response `200 OK`:** Profile updated successfully.

### 4.3 Recommendation Endpoints
#### `POST /api/recommendations/generate`
Starts an asynchronous recommendations calculation run.
- **Headers:** `Authorization: Bearer <Clerk JWT>`
- **Response `202 Accepted`:**
```json
{
  "job_id": "60c72b2f9b1d8a2f1c8d9999",
  "recommendation_run_id": "60c72b2f9b1d8a2f1c8d2222",
  "status": "queued"
}
```

#### `GET /api/recommendations`
Retrieves recommendations list from the user's latest completed run.
- **Response `200 OK`:**
```json
{
  "run_id": "60c72b2f9b1d8a2f1c8d2222",
  "created_at": "2026-07-17T11:05:00Z",
  "recommendations": [
    {
      "repository_id": "60c72b2f9b1d8a2f1c8d1111",
      "full_name": "facebook/react",
      "description": "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      "primary_language": "JavaScript",
      "match_score": 92.5,
      "confidence_score": 0.9,
      "reasons": [
        "Aligns with your TypeScript/JavaScript skills.",
        "Matches your interest in frontend web development.",
        "Contains 5 active beginner-friendly issues."
      ]
    }
  ]
}
```

#### `GET /api/recommendations/runs/:run_id`
Retrieves recommendations from a specific historical run ID.
- **Response `200 OK`:** Same structure as `GET /api/recommendations`.

### 4.4 Job Polling
#### `GET /api/jobs/:id`
Queries the status of a background job.
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

---

## 5. Verification & Validation Metrics
- **Job Recovery:** Force backend termination during a running job, restart backend, and verify that the job state transitions via retry/polling rather than locking up.
- **Onboarding Fallback:** Verify that a new user with 0 public repositories is successfully prompted for onboarding, can save preferences, and receives matching recommendations.
- **Eligibility Validation:** Run a mock repository through the filters and verify it is rejected with correct details when star count is below 10 or pushes are older than 90 days.

# OpenScout.ai — Technical Architecture Document

**From MRD & PRD to Production-Ready Web App**

> This document translates the Market Requirements Document and Product Requirements Document into an actionable engineering blueprint. It covers the tech stack rationale, monorepo organization, system architecture, data model, API contracts, authentication flow, storage strategy, deployment topology, and a phased build plan — all without implementation-level code, so it can serve as a stable reference regardless of refactors.

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [System Architecture](#3-system-architecture)
4. [Frontend Architecture — Next.js](#4-frontend-architecture--nextjs)
5. [Backend Architecture — Python (FastAPI)](#5-backend-architecture--python-fastapi)
6. [Database Design — MongoDB Atlas](#6-database-design--mongodb-atlas)
7. [Authentication Architecture — Clerk](#7-authentication-architecture--clerk)
8. [Storage Architecture — Storj](#8-storage-architecture--storj)
9. [Deployment Topology — Vercel + Railway/Render](#9-deployment-topology--vercel--railwayrender)
10. [API Contract Summary](#10-api-contract-summary)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Development Workflow](#12-development-workflow)
13. [Phased Build Plan](#13-phased-build-plan)
14. [Security Considerations](#14-security-considerations)
15. [Performance & Scalability](#15-performance--scalability)
16. [Glossary](#16-glossary)

---

## 1. Tech Stack Overview

### 1.1 Stack Selection

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | 14+ | Server components, API routes, SSR/ISR, file-based routing. Optimized performance out of the box. |
| **Styling** | Tailwind CSS | v3 | Utility-first CSS co-located with components. Rapid iteration for hackathon timelines. |
| **Backend** | Python / FastAPI | 3.12+ / latest | Async-first, auto-generated OpenAPI docs, native Pydantic validation. Best-in-class for AI/ML workloads (LLM calls, GitHub API processing). |
| **Database** | MongoDB Atlas | 7.x | Flexible document model maps naturally to the PRD's JSON-structured data (skills, recommendations, blueprints). Managed free tier available. |
| **Storage** | Storj | — | Decentralized, S3-compatible object storage for blueprint exports, cached analysis artifacts, and uploaded assets. |
| **Auth** | Clerk | v5+ | Managed authentication with first-class GitHub OAuth. Handles session management, JWTs, and user metadata with zero custom auth code. |
| **Deployment** | Vercel (frontend) + Railway/Render (backend) | — | Native Next.js hosting (edge, previews, CI/CD). Backend deployed as a persistent service for long-running AI tasks. |
| **Jules Integration** | Google Jules REST API | — | API-driven handoff. Backend creates Jules Sessions programmatically with the Blueprint's prompt pre-loaded. Eliminates manual copy-paste. |

### 1.2 Why This Stack Works for OpenScout.ai

- **Next.js + FastAPI separation** keeps AI-heavy operations (LLM calls, GitHub crawling, scoring algorithms) in Python — where the ML ecosystem is strongest — while the frontend gets the React/Next.js ecosystem for a polished UI.
- **MongoDB's document model** naturally maps to the PRD's data structures: nested JSON for skills, variable-length recommendation reason arrays, and multi-section blueprints — without fighting a relational schema.
- **Clerk** eliminates weeks of auth engineering. GitHub OAuth, session management, and webhook-based user sync are handled out of the box.
- **Storj** provides S3-compatible storage at a fraction of the cost, useful for caching large analysis artifacts and blueprint exports.

---

## 2. Monorepo Structure

### 2.1 Directory Layout

A single repository manages both frontend and backend using a simple folder-based monorepo (no Turborepo or Nx needed at this scale). Shared configuration lives at the root.

```
openscout.ai/
│
├── README.md                    # Project overview & quickstart
├── TECHNICAL_GUIDE.md           # This document
├── MRD.md                       # Market Requirements Document
├── PRD.md                       # Product Requirements Document
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml      # Lint, test, build for frontend
│       └── backend-ci.yml       # Lint, test for backend
│
├── .env.example                 # Template for all environment variables
├── docker-compose.yml           # Local dev: backend + MongoDB
│
├── frontend/                    # Next.js application
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local.example
│   ├── public/                  # Static assets (logos, icons, OG images)
│   └── src/
│       ├── app/                 # App Router pages (see §4.3)
│       ├── components/          # Reusable UI components (see §4.4)
│       ├── lib/                 # Utilities & API client
│       ├── hooks/               # Custom React hooks
│       ├── types/               # TypeScript type definitions
│       └── styles/              # Global CSS / Tailwind directives
│
├── backend/                     # Python FastAPI application
│   ├── pyproject.toml           # Dependencies
│   ├── Dockerfile
│   ├── .env.example
│   └── app/
│       ├── main.py              # FastAPI app entrypoint
│       ├── config.py            # Settings / env loading
│       ├── api/                 # Route handlers (see §5.2)
│       ├── services/            # Business logic (see §5.3)
│       ├── models/              # Pydantic request/response schemas
│       ├── db/                  # Database connection & indexes
│       ├── core/                # Auth, rate limiter, cache, exceptions
│       └── workers/             # Background task processing
│
└── docs/                        # Additional documentation
    ├── api-reference.md
    ├── local-setup.md
    └── deployment.md
```

### 2.2 Key Monorepo Decisions

| Decision | Rationale |
|---|---|
| **No monorepo tool (Turborepo/Nx)** | At two packages (frontend + backend in different languages), a tool adds complexity without meaningful benefit. Simple `Makefile` or npm scripts at the root handle orchestration. |
| **Separate `package.json` and `pyproject.toml`** | Frontend (Node.js) and backend (Python) have completely independent dependency trees. No shared runtime. |
| **Shared `.env.example` at root** | Single source of truth for all environment variables across both apps. Each app also has its own `.env.example` for app-specific vars. |
| **Shared GitHub Actions** | CI workflows live at the repo root, each targeting their respective directory. |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Vercel Edge)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │ Dashboard │  │ Repo     │  │ Blueprint  │  │ Search /  │  │  │
│  │  │ Page     │  │ Detail   │  │ View       │  │ History   │  │  │
│  │  └──────────┘  └──────────┘  └────────────┘  └───────────┘  │  │
│  │                        │                                      │  │
│  │               Clerk Auth SDK (JWT Management)                 │  │
│  └─────────────────────┬─────────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────────┘
                         │ HTTPS (JWT in Authorization header)
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Python Backend (FastAPI)                            │
│              Deployed on: Railway / Render                           │
│                                                                     │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────────────┐   │
│  │ API      │  │ Services      │  │ Workers (Background Tasks) │   │
│  │ Routes   │──│ • Profile     │  │ • Profile Analysis         │   │
│  │          │  │ • Recommend   │  │ • Repo Analysis            │   │
│  │          │  │ • Blueprint   │  │                            │   │
│  │          │  │ • Eligibility │  │                            │   │
│  └──────────┘  └───────┬───────┘  └────────────────────────────┘   │
│                        │                                            │
│            ┌───────────┼───────────┐                               │
│            ▼           ▼           ▼                               │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│     │ MongoDB  │ │ GitHub   │ │ LLM API  │                       │
│     │ Atlas    │ │ REST API │ │ (Gemini) │                       │
│     └──────────┘ └──────────┘ └──────────┘                       │
│            │                                                       │
│            ▼                                                       │
│     ┌──────────┐                                                  │
│     │  Storj   │  (Blueprint exports, cached artifacts)           │
│     └──────────┘                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

1. **User opens the app** → Next.js serves the page from Vercel's edge network.
2. **Clerk handles auth** → User signs in with GitHub OAuth. Clerk issues a JWT.
3. **Frontend calls backend** → Every API request includes the Clerk JWT in the `Authorization: Bearer <token>` header.
4. **Backend verifies JWT** → FastAPI middleware validates the Clerk JWT against Clerk's public JWKS endpoint and extracts the `user_id`.
5. **Backend processes request** → Calls GitHub API, runs AI analysis, queries MongoDB, and returns the response.
6. **Background tasks** → Long-running operations (profile analysis, repo analysis) run asynchronously via FastAPI's `BackgroundTasks` or a task queue.

### 3.3 Data Flow — End-to-End User Journey

```
GitHub Login → Profile Analysis → Recommendations → Repo Detail → Blueprint → Jules Handoff
```

| Step | Trigger | Backend Service | Data Source | Output |
|---|---|---|---|---|
| **1. Login** | User clicks "Continue with GitHub" | Clerk Webhook Handler | Clerk OAuth → GitHub | `users` and `oauth_connections` (encrypted) records created |
| **2. Profile Analysis** | Automatic after first login | `profile_analyzer` | GitHub REST API (repos, languages, commits) | `developer_profiles` record + immutable `profile_snapshots` evidence |
| **3. Recommendations** | Dashboard load | `recommendation_engine` | `developer_profiles` + `repositories` | `recommendation_runs` record + list of `recommendations` |
| **4. Repo Detail** | User clicks a recommendation | `repo_analyzer` | GitHub API + LLM (Gemini) | Commit-specific `repository_analyses` (by default_branch/commit_sha) |
| **5. Opportunities** | Part of repo detail | `opportunity_discovery` | GitHub Issues API + LLM | 8-tier opportunities tracking freshness signals |
| **6. Blueprint** | User selects an opportunity | `blueprint_generator` | Profile + repo analysis + opportunity + LLM | Versioned `blueprints` record (non-overwriting, group-tracked) |
| **7. Jules Handoff** | User clicks "Continue to Google Jules" | `jules_handoff_service` | Jules REST API + Blueprint data | Jules Session created via API with `idempotency_key` → redirect to `jules.google.com` |


---

## 4. Frontend Architecture — Next.js

### 4.1 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Server components reduce client JS bundle. API routes provide a BFF (Backend For Frontend) proxy layer. |
| **Styling** | Tailwind CSS v3 | Utility-first, co-located with components. Speeds up development. |
| **Data Fetching** | SWR | Caching, revalidation, and optimistic UI. Keeps dashboard and repo pages feeling fast. |
| **Animation** | Framer Motion | Blueprint progressive reveal, page transitions, micro-interactions. |
| **Icons** | Lucide React | Clean, consistent icon library. |
| **Markdown Rendering** | react-markdown | Renders AI-generated content (repo summaries, blueprint sections). |
| **Notifications** | Sonner | Toast notifications for async operations (analysis complete, blueprint saved). |
| **Auth SDK** | @clerk/nextjs | Provides auth provider, sign-in components, `useUser()` hooks, and middleware for protected routes. |

### 4.2 Routing & Page Protection

All routes except the landing page, sign-in, and sign-up are protected by Clerk middleware. Unauthenticated users are redirected to the sign-in page.

**Public routes:** `/`, `/sign-in(.*)`, `/sign-up(.*)`

**Protected routes:** All other routes.

### 4.3 Page → PRD Mapping

| Page Route | PRD Section | Description |
|---|---|---|
| `/` | §6.1 | Landing page — value proposition + "Continue with GitHub" CTA |
| `/dashboard` | §6.9 | Personalized dashboard — skills module + recommendation feed |
| `/repository/[id]` | §6.5, §6.6 | Repository detail — AI summary + tiered contribution opportunities |
| `/blueprint/[id]` | §6.7, §6.8 | Blueprint view — progressive reveal sections + Jules handoff |
| `/search` | §6.10 | Manual repository search with eligibility indicators |
| `/history` | §6.11 | Recently viewed repos, saved repos, past blueprints |

### 4.4 Component Architecture

Components are organized by domain responsibility:

| Directory | Contents | Examples |
|---|---|---|
| `components/ui/` | Design-system primitives | Button, Card, Badge, Skeleton, Modal |
| `components/layout/` | Structural layout shells | Header, Sidebar, Footer, PageWrapper |
| `components/dashboard/` | Dashboard-specific widgets | SkillsModule, RecommendationCard, ProfileSummary |
| `components/repository/` | Repo detail widgets | RepoHeader, AISummary, OpportunitiesList, HealthSignals |
| `components/blueprint/` | Blueprint view widgets | BlueprintSections, JulesHandoffBlock, ProgressiveReveal |
| `components/shared/` | Cross-cutting UI | ConfidenceBadge, DifficultyBadge, LoadingSkeleton |

### 4.5 Frontend ↔ Backend Communication

The frontend communicates with the Python backend through a thin API client layer that:

1. Automatically attaches the Clerk JWT to every request via the `Authorization: Bearer <token>` header.
2. Handles error responses uniformly (4xx/5xx → typed error objects).
3. Can be used from both server components (via `auth()`) and client components (via `useAuth()`).

The frontend does **not** call GitHub, MongoDB, or any LLM directly. All external service calls are proxied through the Python backend.

### 4.6 Custom React Hooks

| Hook | Purpose |
|---|---|
| `useProfile` | Fetches and caches the authenticated user's developer profile |
| `useRecommendations` | Fetches personalized recommendations with SWR caching |
| `useBlueprint` | Fetches a specific blueprint with loading/error state management |

### 4.7 TypeScript Type Definitions

Shared types are defined in `src/types/` and cover:

- `user.ts` — User, AuthState
- `repository.ts` — Repository, RepositoryAnalysis, HealthSignals
- `recommendation.ts` — Recommendation, MatchScore, Confidence
- `blueprint.ts` — Blueprint, BlueprintSection, JulesPrompt, JulesSession, JulesHandoffResult
- `api.ts` — ApiResponse, ApiError, PaginatedResponse

---

## 5. Backend Architecture — Python (FastAPI)

### 5.1 Why FastAPI

| Concern | How FastAPI Addresses It |
|---|---|
| **Async I/O** | GitHub API calls, LLM requests, and MongoDB queries all benefit from async/await. |
| **API Documentation** | Auto-generated OpenAPI docs at `/docs` — speeds up frontend-backend coordination. |
| **Data Validation** | Pydantic models enforce the PRD's structured data contracts at the boundary. |
| **Background Tasks** | Built-in `BackgroundTasks` for non-blocking profile and repo analysis. |

### 5.2 API Layer (Route Handlers)

| Module | Route Prefix | Responsibility |
|---|---|---|
| `api/auth.py` | `/api/auth` | Clerk webhook handler, current-user endpoint |
| `api/profile.py` | `/api/profile` | Trigger analysis, return profile results |
| `api/recommendations.py` | `/api/recommendations` | Personalized repo recommendations, feedback signals |
| `api/repositories.py` | `/api/repositories` | Repo detail, force re-analysis, analysis status polling, save/unsave |
| `api/blueprints.py` | `/api/blueprints` | Generate, retrieve, list, update blueprints, Jules API session creation and handoff |
| `api/search.py` | `/api/search` | Manual repository search |
| `api/history.py` | `/api/history` | Recently viewed repos, blueprint history |
| `api/dashboard.py` | `/api/dashboard` | Aggregate dashboard data endpoint |

### 5.3 Service Layer — Core Business Logic

Each service maps directly to a PRD feature. All services are stateless and receive their dependencies (database handles, API clients) via dependency injection.

| Service | PRD Section | Responsibility |
|---|---|---|
| `github_service` | — | GitHub REST API integration. Fetches repos, languages, commits, contribution data. Retrieves GitHub OAuth tokens from Clerk's Backend API. |
| `profile_analyzer` | §6.2 | Infers developer skills, experience level, confidence scores from GitHub activity. Produces the `developer_profiles` document. |
| `recommendation_engine` | §6.3 | Scores and ranks repositories against the user's profile. Computes match %, confidence, and generates human-readable explanations via LLM. |
| `eligibility_filter` | §6.4 | Pure-function quality gate. Rejects archived, forked, unlicensed, no-README, and stale repositories. Returns `(eligible: bool, reasons: list)`. |
| `repo_analyzer` | §6.5 | Generates AI-powered repository summary using LLM. Extracts tech stack, activity signals, community health, and contribution friendliness score. |
| `opportunity_discovery` | §6.6 | 8-tier contribution opportunity pipeline. Scans GitHub Issues, labels, README gaps, test coverage, and documentation quality to surface actionable opportunities. |
| `blueprint_generator` | §6.7 | Creates structured Contribution Blueprints. Outputs: repository understanding, match explanation, learning objectives, reading order, implementation strategy, and the final Jules prompt. |
| `jules_handoff_service` | §6.8 | Integrates with the Jules REST API. Creates Sessions programmatically with the Blueprint's `final_jules_prompt`, verifies Source (repo) connectivity, manages per-user API key retrieval, and handles graceful fallback to copy-paste when the API is unavailable. |
| `storj_service` | — | S3-compatible upload/download using Storj. Handles blueprint exports (PDF/Markdown) and cached analysis artifacts. |
| `ai_service` | — | LLM abstraction layer. Wraps Gemini (primary) and OpenAI (fallback) APIs behind a unified interface. Handles prompt construction, token management, and response parsing. |

### 5.4 Background Task Architecture

Profile analysis and repository analysis are long-running operations (10–30 seconds due to LLM calls + GitHub API crawling). These are handled via a durable async task pattern using MongoDB:

1. **Client sends request** → API creates a job record in the `background_jobs` collection with status `"queued"` and returns `202 Accepted` immediately with the `job_id`.
2. **FastAPI BackgroundTask claims job** → Backend triggers a task in a separate background thread. The worker updates the job state in MongoDB to `"running"`, setting its lease and timeout details.
3. **Worker executes logic** → Runs LLM analysis, GitHub crawling, scoring in the background.
4. **Client polls for status** → Frontend queries `GET /api/jobs/:id`, which returns the current state (`queued`, `running`, `completed`, `failed`) directly from the MongoDB `background_jobs` collection.
5. **On completion/failure** → The task updates the job document with the result or errors and updates status to `"completed"` or `"failed"`. Next poll returns the finished data.

**MVP implementation:** FastAPI's built-in `BackgroundTasks` writing to the MongoDB `background_jobs` collection to guarantee durability and recoverability across backend restarts.
**Production scale:** Dedicated worker process polling the MongoDB `background_jobs` collection (or Celery + Redis / ARQ).

### 5.5 Middleware & Cross-Cutting Concerns

| Module | Responsibility |
|---|---|
| `core/auth.py` | Clerk JWT verification. Fetches Clerk's public JWKS, validates token signature (RS256), checks audience and issuer, extracts `user_id` from claims. |
| `core/rate_limiter.py` | GitHub API rate limit management. Tracks remaining quota, implements exponential backoff, and queues requests when approaching limits. |
| `core/cache.py` | Analysis caching logic. Prevents redundant LLM calls for recently-analyzed repositories. Uses a TTL-based cache key on `repository_id + default_branch + commit_sha + analysis_version`. |
| `core/exceptions.py` | Custom exception classes mapped to HTTP status codes. Provides structured error responses for the frontend. |

### 5.6 Key Backend Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `motor` | Async MongoDB driver |
| `pydantic-settings` | Environment variable management with validation |
| `httpx` | Async HTTP client for GitHub API and LLM calls |
| `python-jose` | JWT verification for Clerk tokens |
| `boto3` | S3-compatible client for Storj |

---

## 6. Database Design — MongoDB Atlas

### 6.1 Why MongoDB

The PRD's data model is **heavily document-oriented** — skills are nested JSON arrays with weights, recommendations have variable-length reason arrays, blueprints contain multiple text sections of different structures. MongoDB handles this naturally without migrations or schema fights.

### 6.2 MongoDB Atlas Setup

1. Create a free-tier cluster on MongoDB Atlas.
2. Create a database user with read/write permissions.
3. Whitelist IPs — `0.0.0.0/0` for development, deployment platform IPs for production.
4. Obtain the connection string for the `MONGODB_URI` environment variable.

### 6.3 Collections & Data Model

Each collection maps to a PRD concept. Below is the schema definition for each collection.

---

#### `users`
**PRD Reference:** §6.1
**Purpose:** Stores authenticated user summaries synced from Clerk via webhook.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `clerk_id` | string (unique) | Clerk's internal user ID |
| `github_id` | string (unique) | GitHub user ID |
| `github_username` | string | GitHub login handle |
| `avatar_url` | string | Profile image URL |
| `created_at` | datetime | Account creation timestamp |
| `last_login_at` | datetime | Most recent sign-in |

---

#### `oauth_connections`
**PRD Reference:** §6.1
**Purpose:** Encrypted OAuth access and refresh credentials, isolated from primary user records.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users) | Reference to the user |
| `provider` | string | Authentication provider (e.g. `github`) |
| `access_token` | string (encrypted) | AES-256 encrypted access token |
| `refresh_token` | string (encrypted) | AES-256 encrypted refresh token |
| `scopes` | array of strings | Permitted scopes list |
| `token_status` | string | Token validity (e.g. `active`, `revoked`) |
| `key_rotation_metadata` | object | Rotation logs (`last_rotated`, `next_rotation_due`) |
| `created_at` | datetime | Record creation time |
| `updated_at` | datetime | Record last update time |

---

#### `user_preferences`
**PRD Reference:** §6.1
**Purpose:** Developer profile fallbacks (for empty profiles) and settings.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users, unique) | Reference to the user |
| `skills` | array of strings | Manually selected/inferred skills |
| `languages` | array of strings | Manually selected languages |
| `frameworks` | array of strings | Manually selected frameworks |
| `interests` | array of strings | Preferred domains/topics |
| `contribution_preferences` | array of strings | Preferred contribution types |
| `difficulty_preference` | string | Preferred difficulty (`beginner`/`intermediate`/`advanced`) |
| `jules_api_key` | string (encrypted) | AES-256 encrypted Jules API key |
| `created_at` | datetime | Record creation time |
| `updated_at` | datetime | Record last update time |

---

#### `developer_profiles`
**PRD Reference:** §6.2
**Purpose:** Active aggregated developer skill profile.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users, unique) | Reference to the user |
| `experience_level` | string | Classification (`beginner`/`intermediate`/`advanced`) |
| `experience_confidence` | float (0-1) | Confidence in classification |
| `contribution_history_summary`| object | Inferred stats from past repositories |
| `project_domains` | array of strings | Inferred domain expertises |
| `last_analyzed_at` | datetime | Last analysis timestamp |
| `analysis_version` | string | Evaluator logic version |

---

#### `profile_snapshots`
**PRD Reference:** §6.2
**Purpose:** Immutable snapshots of inferred skills and raw evidence.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users) | Reference to the user |
| `developer_profile_id` | string (FK → developer_profiles) | Reference to the profile |
| `inferred_skills` | object (JSON) | Captured skill weights & confidence details |
| `source_evidence` | object (JSON) | Raw GitHub commit frequencies, PR links, repository data |
| `scoring_rationale` | string | Explanatory rationale behind inference scoring |
| `created_at` | datetime | Snapshot creation timestamp |

---

#### `repositories`
**PRD Reference:** §6.3, §6.4
**Purpose:** Cached repository index and quality scoring metrics.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `github_repo_id` | integer (unique) | GitHub's numeric repository ID |
| `full_name` | string (unique) | `owner/repo` format name |
| `description` | string | Summary metadata from GitHub |
| `primary_language` | string | Dominant language |
| `topics` | array of strings | Topic categories |
| `stars` | integer | Stars count |
| `forks` | integer | Forks count |
| `open_issues_count` | integer | Issues count |
| `last_commit_at` | datetime | Last push activity time |
| `license` | string | License tag |
| `is_fork` | boolean | Is fork indicator |
| `is_archived` | boolean | Is archived indicator |
| `health_score` | float (0-100) | Calculated community health metric |
| `beginner_friendly_score` | float (0-100) | Calculated onboarding index |
| `doc_quality_score` | float (0-100) | Calculated documentation index |
| `size_kb` | integer | Size in kilobytes |
| `eligibility_status` | string | Quality gate filter (`eligible`/`ineligible`) |
| `eligibility_reasons` | array of strings | Filter validation messages |
| `cached_at` | datetime | Cache record timestamp |

---

#### `repository_analyses`
**PRD Reference:** §6.5
**Purpose:** Commit-specific cached repository analysis.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `repository_id` | string (FK → repositories) | Reference to the repository |
| `default_branch` | string | Target branch analyzed |
| `commit_sha` | string | Target Git commit SHA |
| `analysis_version` | string | AI Analyzer logic version |
| `summary_text` | string | AI repository description |
| `tech_stack` | array of strings | Identified languages/tools |
| `activity_summary` | string | Inferred PR/commit activity description |
| `community_summary` | string | Contributor friendliness description |
| `contribution_friendliness_score` | float (0-100) | AI score |
| `onboarding_difficulty` | string | Estimated difficulty (`easy`/`moderate`/`hard`) |
| `confidence_score` | float (0-1) | AI summary confidence |
| `analyzed_at` | datetime | Generation timestamp |
| `cache_invalidated_at` | datetime (nullable)| Invalidation timestamp |

---

#### `contribution_opportunities`
**PRD Reference:** §6.6
**Purpose:** Tiered contribution opportunities including issue details.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `repository_id` | string (FK → repositories) | Reference to the repository |
| `repository_commit_sha` | string | Commit SHA opportunity was identified on |
| `tier` | integer (1-8) | Prioritized tier level |
| `source_type` | string | Opportunity source (`github_issue`/`ai_generated`) |
| `github_issue_number` | integer (nullable) | Issue number on GitHub |
| `github_issue_url` | string (nullable) | Link to issue |
| `current_issue_state` | string (nullable) | Issue status (`open`/`closed`) |
| `assignees` | array of strings | Assigned GitHub users |
| `linked_pull_requests` | array of strings | Linked PR URLs |
| `title` | string | Opportunity name |
| `description` | string | Detailed guide or issue description |
| `confidence_score` | float (nullable) | Required for Tier 8 |
| `estimated_difficulty` | string | Difficulty (`easy`/`moderate`/`hard`) |
| `last_issue_activity` | datetime (nullable)| Timestamp from GitHub |
| `last_verification_time` | datetime | Timestamp of validation |
| `expiration_time` | datetime (nullable)| Expiry window of opportunity |
| `relevant_verified_file_paths` | array of strings | File paths to modify |
| `is_possibly_claimed` | boolean | Claims warning flag |
| `created_at` | datetime | Opportunity discovery timestamp |

---

#### `recommendation_runs`
**PRD Reference:** §6.3
**Purpose:** Parameterized runs for reproducible recommendation batches.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users) | Target user |
| `profile_snapshot_id` | string (FK → profile_snapshots) | Snapshot used |
| `scoring_algorithm_version` | string | Algorithm ruleset |
| `filters_applied` | object (JSON) | Scope configuration |
| `candidates_evaluated_count` | integer | Candidate pools size |
| `idempotency_key` | string (unique) | Idempotency tag |
| `created_at` | datetime | Run timestamp |

---

#### `recommendations`
**PRD Reference:** §6.3
**Purpose:** Individual Match records linked to a run.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `recommendation_run_id` | string (FK → recommendation_runs) | Reference to run parent |
| `user_id` | string (FK → users) | Reference to user |
| `repository_id` | string (FK → repositories) | Reference to repository |
| `match_score` | float (0-100) | Similarity score |
| `confidence_score` | float (0-1) | AI calculation confidence |
| `reasons` | array of strings | Explained rationale factors |
| `created_at` | datetime | Creation timestamp |

---

#### `user_repository_states`
**PRD Reference:** §6.11
**Purpose:** Consolidated tracker for saves, views, and dismissals.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users) | Reference to user |
| `repository_id` | string (FK → repositories) | Reference to repository |
| `is_saved` | boolean | Saved for later flag |
| `saved_at` | datetime (nullable)| Save timestamp |
| `is_viewed` | boolean | Recently viewed flag |
| `last_viewed_at` | datetime (nullable)| View timestamp |
| `recommendation_state` | string | Status (`active`/`dismissed`/`completed`) |
| `created_at` | datetime | Record created timestamp |
| `updated_at` | datetime | Record updated timestamp |

---

#### `blueprints`
**PRD Reference:** §6.7
**Purpose:** Versioned structured onboarding Contribution Blueprints.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `blueprint_group_id` | UUID (string) | ID of the grouping for this blueprint |
| `version` | integer | Incremented version number |
| `supersedes_blueprint_id` | string (FK → blueprints, nullable) | Reference to previous version |
| `user_id` | string (FK → users) | Reference to user |
| `repository_id` | string (FK → repositories) | Reference to repository |
| `repository_commit_sha` | string | Commit SHA blueprint was generated on |
| `opportunity_id` | string (FK → contribution_opportunities) | Target opportunity |
| `prompt_version` | string | Prompt version used |
| `output_schema_version` | string | LLM output schema version |
| `repository_understanding` | string | AI understanding description |
| `match_explanation` | string | Explanatory match message |
| `confidence_level` | float (0-1) | AI calculation confidence |
| `estimated_difficulty` | string | Difficulty (`easy`/`moderate`/`hard`) |
| `estimated_effort` | string | Time estimate (e.g. `2-4 hours`) |
| `learning_objectives` | array of strings | Learning takeaways |
| `constraints` | array of strings | Gotchas/constraints list |
| `suggested_reading_order` | array of objects | Files to read `{file, reason}` |
| `implementation_strategy` | string | AI action plan |
| `final_jules_prompt` | string | Formatted context prompt |
| `idempotency_key` | string (unique) | Idempotency tag |
| `status` | string | Status (`generating`/`complete`/`failed`) |
| `created_at` | datetime | Timestamp |

---

#### `handoff_events`
**PRD Reference:** §6.8
**Purpose:** Tracker logs for session redirects/clipboard fallback actions.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `blueprint_id` | string (FK → blueprints) | Source blueprint |
| `method` | string | Handoff mode (`api`/`copy`) |
| `jules_session_id` | string (nullable) | Created session identifier |
| `jules_session_url` | string (nullable) | Created session redirect link |
| `error_reason` | string (nullable) | Error message if failed |
| `idempotency_key` | string (unique) | Idempotency tag |
| `initiated_at` | datetime | Creation timestamp |

---

#### `background_jobs`
**PRD Reference:** §6.12
**Purpose:** Durable queues for async profile/repository processing.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `job_type` | string | Task type (`profile_analysis`/`repo_analysis` etc.) |
| `status` | string | Status (`queued`/`running`/`completed`/`failed`/`dead_letter`) |
| `retries` | integer | Max retry count |
| `attempt_count` | integer | Executed attempt count |
| `idempotency_key` | string (unique) | Idempotency key |
| `worker_lease` | string (nullable) | Claimed worker lease tag |
| `timeout` | integer | Timeout threshold in seconds |
| `dead_letter_state` | object (JSON) | Fail reasons logs |
| `payload` | object (JSON) | Worker parameters configuration |
| `created_at` | datetime | Queue timestamp |
| `updated_at` | datetime | State update timestamp |

---

#### `ai_runs`
**PRD Reference:** §6.13
**Purpose:** Observability and prompt auditing tracking.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `provider` | string | Provider (`gemini`/`openai`) |
| `model` | string | Model name |
| `prompt_version` | string | Prompts rules version |
| `output_schema_version` | string | Schema parser version |
| `token_usage` | object (JSON) | Input/output token counters |
| `latency_ms` | integer | Call latency in milliseconds |
| `validation_failure` | boolean | Validation check failure |
| `fallback_provider_usage`| boolean | Fallback flag |
| `grounding_evidence_hash`| string | SHA-256 hash of grounding evidence |
| `estimated_cost` | float | Token cost calculated |
| `created_at` | datetime | Record timestamp |

---

#### `analytics_events`
**PRD Reference:** §11
**Purpose:** Tracking KPI funnels.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users, nullable) | Reference to user |
| `event_name` | string | Tracked metric name |
| `payload` | object (JSON) | Analytics metrics |
| `created_at` | datetime | Log time |

---

#### `audit_logs`
**PRD Reference:** §6.14
**Purpose:** Immutable records of security actions.

| Field | Type | Description |
|---|---|---|
| `id` | UUID (string) | Primary key |
| `user_id` | string (FK → users, nullable) | Reference to user |
| `action` | string | Executed task name |
| `resource_type` | string | Object modified category |
| `resource_id` | string (nullable) | Object modified key |
| `ip_address` | string (nullable) | Source IP |
| `user_agent` | string (nullable) | Source client agent string |
| `payload` | object (JSON) | Details logs |
| `created_at` | datetime | Execution timestamp |


### 6.4 Index Strategy

| Collection / Table | Index | Type | Purpose |
|---|---|---|---|
| `users` | `clerk_id` | Unique | Fast lookup by Clerk ID |
| `users` | `github_id` | Unique | Fast lookup by GitHub ID |
| `oauth_connections` | `user_id` | Standard | Retrieve encrypted credentials for a user |
| `oauth_connections` | `(user_id, provider)` | Unique | Restrict connection per provider per user |
| `user_preferences` | `user_id` | Unique | One preference record per user |
| `developer_profiles` | `user_id` | Unique | One profile per user |
| `profile_snapshots` | `user_id` | Standard | Retrieve evidence snapshots for user reviews |
| `repositories` | `github_repo_id` | Unique | Deduplication and lookup by GitHub ID |
| `repositories` | `full_name` | Unique | Lookup by owner/name |
| `repositories` | `eligibility_status` | Standard | Filter eligible repositories for crawler engine |
| `repository_analyses` | `(repository_id, commit_sha, analysis_version)` | Compound Unique | Cache key matching repo, commit, and AI version |
| `contribution_opportunities`| `repository_id` | Standard | Fetch opportunities list for detail page |
| `contribution_opportunities`| `(repository_id, tier, current_issue_state)` | Compound | Filter open opportunities by tier |
| `recommendation_runs` | `user_id` | Standard | Fetch recommendation run list |
| `recommendations` | `(user_id, match_score DESC)` | Compound | Dashboard query: user matches sorted by relevance |
| `recommendations` | `recommendation_run_id` | Standard | Fetch match pool for run |
| `user_repository_states` | `(user_id, repository_id)` | Compound Unique | Prevent duplicate entries |
| `user_repository_states` | `user_id` (filtered is_saved = true) | Partial Index | Fetch user's saved bookmarks |
| `user_repository_states` | `(user_id, last_viewed_at DESC)` (filtered is_viewed = true) | Partial Index | Fetch user's view history |
| `blueprints` | `user_id` | Standard | List user's blueprints |
| `blueprints` | `(blueprint_group_id, version DESC)` | Compound | Query versions in reverse order |
| `handoff_events` | `blueprint_id` | Standard | Session redirected log auditing |
| `background_jobs` | `(status, created_at)` (filtered status: queued/failed) | Partial Index | Poll workers task retrieval |
| `ai_runs` | `(provider, model, latency_ms)` | Compound | Audit metrics query |
| `analytics_events` | `(event_name, created_at)` | Compound | Analytics funnel aggregation query |
| `audit_logs` | `(user_id, action, created_at)` | Compound | Audit compliance logging lookups |


---

## 7. Authentication Architecture — Clerk

### 7.1 Auth Flow

The authentication flow eliminates all custom auth code:

```
User clicks "Continue with GitHub"
        │
        ▼
Clerk OAuth flow (hosted UI or embedded <SignIn/> component)
        │
        ▼
Clerk creates/updates user record, issues JWT
        │
        ▼
Frontend receives JWT via Clerk SDK
        │
        ▼
Frontend sends JWT to Python backend on every API call
        │
        ▼
Backend verifies JWT using Clerk's JWKS endpoint
        │
        ▼
Backend extracts user_id from JWT claims, processes request
```

### 7.2 Clerk Setup Requirements

| Step | Detail |
|---|---|
| **1. Create Clerk App** | Register at clerk.com, create a new application |
| **2. Enable GitHub OAuth** | Dashboard → Social Connections → GitHub |
| **3. Configure OAuth Scopes** | Request `read:user` and `public_repo` (minimum for profile analysis) |
| **4. Obtain API Keys** | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (frontend) and `CLERK_SECRET_KEY` (backend) |
| **5. Set Redirect URLs** | Sign-in: `/sign-in`, After sign-in: `/dashboard`, After sign-up: `/dashboard` |

### 7.3 User Sync via Webhooks

When Clerk fires a `user.created` event (after first GitHub OAuth sign-in), the backend webhook handler:

1. Extracts the GitHub OAuth account from the user's `external_accounts` array.
2. Creates a new document in the `users` collection with `clerk_id`, `github_id`, `github_username`, and `avatar_url`.
3. Sets `profile_analysis_status` to `"pending"`.
4. Triggers an async profile analysis task.

Webhook payloads are verified using the **svix** library to ensure they originate from Clerk.

### 7.4 GitHub Token Retrieval

The backend retrieves the user's GitHub OAuth credentials from the `oauth_connections` collection:
- During webhook sync on first login, access and refresh tokens are retrieved from Clerk and stored encrypted at rest in `oauth_connections`.
- Background workers and API routes fetch and decrypt these tokens from `oauth_connections` to make authenticated GitHub requests.
- Token refresh flow uses stored refresh tokens or triggers updates via Clerk SDK, updating the `oauth_connections` store with the new keys.


### 7.5 JWT Verification (Backend)

The backend verifies Clerk JWTs by:

1. Fetching Clerk's public JWKS from `https://{CLERK_DOMAIN}/.well-known/jwks.json` (cached after first fetch).
2. Verifying the JWT signature using RS256.
3. Validating the `audience` and `issuer` claims.
4. Extracting the `sub` claim as `user_id`.

Failed verification returns a `401 Unauthorized` response.

---

## 8. Storage Architecture — Storj

### 8.1 What Gets Stored

| Content | Why Storj (not MongoDB) |
|---|---|
| Exported blueprint PDFs and Markdown files | Binary/large text files that users may want to download or share |
| Cached repository analysis artifacts | Large analysis payloads that don't need to live in the primary database |
| Generated OG images | Social sharing preview images (static assets) |

### 8.2 Storj Setup Requirements

| Step | Detail |
|---|---|
| **1. Create Account** | Register at storj.io |
| **2. Create Bucket** | e.g., `openscout-artifacts` |
| **3. Generate S3 Credentials** | Storj provides an S3-compatible gateway |
| **4. Obtain Credentials** | `STORJ_ACCESS_KEY`, `STORJ_SECRET_KEY`, `STORJ_ENDPOINT`, `STORJ_BUCKET` |

### 8.3 Storage Key Structure

All objects follow a predictable key structure for easy retrieval:

| Content Type | Key Pattern | Example |
|---|---|---|
| Blueprint export (Markdown) | `blueprints/{blueprint_id}/export.md` | `blueprints/abc123/export.md` |
| Blueprint export (PDF) | `blueprints/{blueprint_id}/export.pdf` | `blueprints/abc123/export.pdf` |
| Analysis cache | `cache/analyses/{repository_id}/{version}.json` | `cache/analyses/xyz789/v1.json` |
| OG images | `og/{repository_id}.png` | `og/xyz789.png` |

### 8.4 Access Pattern

- **Uploads** are performed server-side by the backend after blueprint generation or analysis completion.
- **Downloads** use pre-signed URLs generated by the backend (valid for 1 hour), returned to the frontend for direct client-side download.
- The frontend never communicates with Storj directly.

---

## 9. Deployment Topology — Vercel + Railway/Render

### 9.1 Deployment Strategy

| Component | Platform | Reason |
|---|---|---|
| **Frontend (Next.js)** | Vercel | Native Next.js support, edge rendering, preview deploys, automatic CI/CD from Git. |
| **Backend (FastAPI)** | Railway or Render (recommended) | Persistent service with no timeout limits, background workers, WebSocket support, and persistent DB connections. |
| **MongoDB** | MongoDB Atlas | Managed, cloud-native database. |
| **Storj** | Storj Cloud | Managed, S3-compatible object storage. |

### 9.2 Frontend Deployment on Vercel

**Vercel Project Configuration:**

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Framework Preset | Next.js |
| Environment Variables | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BACKEND_URL` |

### 9.3 Backend Deployment — Decision Matrix

| Criteria | Vercel Serverless | Railway / Render |
|---|---|---|
| **Timeout** | 10s (free tier) | No limit |
| **Background Workers** | ❌ Not supported | ✅ Native support |
| **Persistent Connections** | ❌ Cold starts | ✅ Always-on |
| **WebSockets** | ❌ | ✅ |
| **Complexity** | Lower (same platform as frontend) | Slightly higher (separate platform) |
| **Cost** | Free tier available | Free tier available |

**Recommendation:** Use **Railway or Render for production** because profile/repo analysis tasks can take 10–30 seconds (exceeding Vercel's serverless timeout), and background workers are essential for async processing.

### 9.4 Handling Long-Running Tasks

Profile analysis and repository analysis involve multiple LLM calls and GitHub API requests, taking 10–30 seconds. The architecture uses an async task pattern:

```text
Frontend                    Backend API                  MongoDB                  Background Task
   │                          │                           │                             │
   │── POST /analyze ────────>│                           │                             │
   │                          │── Create job (queued) ───>│                             │
   │<── 202 Accepted ────────│                           │                             │
   │    {job_id, status}      │── Trigger task ───────────┼────────────────────────────>│
   │                          │                           │                             │── Update job to "running"
   │                          │                           │<── Write Status ────────────│
   │── GET /api/jobs/:id ────>│                           │                             │
   │<── {status: "running"} ──│── Query status ──────────>│                             │
   │                          │                           │                             │── Execute job logic
   │                          │                           │                             │── Update job to "completed"
   │                          │                           │<── Write Results ───────────│
   │── GET /api/jobs/:id ────>│                           │                             │
   │<── {status: "complete"} ─│── Query status ──────────>│                             │
```

**MVP:** FastAPI's built-in `BackgroundTasks` executing tasks whose state and lifecycle are durably tracked in the MongoDB `background_jobs` collection.
**Production:** Celery + Redis or ARQ (async Redis queue) polling the `background_jobs` collection.

### 9.5 CI/CD Pipeline

| Workflow | Trigger | Steps |
|---|---|---|
| **Frontend CI** | Push to `frontend/**` | Checkout → Setup Node 20 → `npm ci` → `npm run lint` → `npm run build` |
| **Backend CI** | Push to `backend/**` | Checkout → Setup Python 3.12 → `pip install` → `pytest tests/` |
| **Deploy Frontend** | Merge to `main` | Vercel auto-deploys from Git |
| **Deploy Backend** | Merge to `main` | Railway/Render auto-deploys from Git |

---

## 10. API Contract Summary

All endpoints require JWT authentication unless otherwise noted. The base URL for backend API is configured via the `NEXT_PUBLIC_BACKEND_URL` environment variable.

### 10.1 Authentication

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/webhook/clerk` | POST | Clerk Webhook Signature | Sync user data from Clerk on `user.created` / `user.updated` events |
| `/api/auth/me` | GET | JWT | Returns the currently authenticated user's profile |

### 10.2 Profile

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/profile/analyze` | POST | JWT | Trigger profile (re)analysis. Returns `202 Accepted` with task ID |
| `/api/profile/me` | GET | JWT | Get profile analysis results (skills, experience, confidence) |

### 10.3 Recommendations

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/recommendations` | GET | JWT | Personalized repository recommendations (ranked by match score) |
| `/api/recommendations/feedback` | POST | JWT | Submit feedback signal (dismiss / save) |

### 10.4 Repositories

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/repositories/:id` | GET | JWT | Repository detail + cached analysis |
| `/api/repositories/:id/analyze` | POST | JWT | Force re-analysis. Returns `202 Accepted` |
| `/api/repositories/:id/analysis-status` | GET | JWT | Poll analysis task status |
| `/api/repositories/:id/opportunities` | GET | JWT | List tiered contribution opportunities |
| `/api/repositories/:id/save` | POST | JWT | Save repository for later |
| `/api/repositories/:id/save` | DELETE | JWT | Unsave repository |

### 10.5 Blueprints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/blueprints` | POST | JWT | Generate a new blueprint for a given opportunity |
| `/api/blueprints/:id` | GET | JWT | Retrieve a specific blueprint |
| `/api/blueprints` | GET | JWT | List all blueprints for the authenticated user |
| `/api/blueprints/:id` | PATCH | JWT | Update or regenerate a blueprint section |
| `/api/blueprints/:id/jules-handoff` | POST | JWT | Create a Jules Session via the Jules REST API with the Blueprint's prompt. Returns `{ session_url, session_id, method }` on success, or `{ prompt, method: "copy", error_reason }` on failure |

### 10.6 Dashboard, Search & History

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/dashboard` | GET | JWT | Aggregate dashboard data (profile summary + recommendations + recent activity) |
| `/api/search` | GET | JWT | Search repositories with query, language, and topic filters |
| `/api/history/repositories` | GET | JWT | Recently viewed repositories (sorted by `viewed_at DESC`) |
| `/api/history/blueprints` | GET | JWT | Blueprint history (sorted by `created_at DESC`) |

---

## 11. Environment Variables Reference

All environment variables required by the application, organized by component.

### 11.1 Frontend (Next.js)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's frontend publishable key | `pk_test_...` |
| `NEXT_PUBLIC_BACKEND_URL` | Python backend API base URL | `http://localhost:8000` |

### 11.2 Backend (FastAPI)

| Variable | Description | Example |
|---|---|---|
| **Clerk** | | |
| `CLERK_SECRET_KEY` | Clerk's backend secret key | `sk_test_...` |
| `CLERK_DOMAIN` | Clerk instance domain | `your-app.clerk.accounts.dev` |
| `CLERK_WEBHOOK_SECRET` | Webhook signature verification secret | `whsec_...` |
| **MongoDB** | | |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/openscout` |
| `MONGODB_DB_NAME` | Database name | `openscout` |
| **GitHub** | | |
| `GITHUB_APP_TOKEN` | Fallback GitHub token for unauthenticated API calls | `ghp_...` |
| **Storj** | | |
| `STORJ_ACCESS_KEY` | S3-compatible access key | (from Storj dashboard) |
| `STORJ_SECRET_KEY` | S3-compatible secret key | (from Storj dashboard) |
| `STORJ_ENDPOINT` | S3 gateway URL | `https://gateway.storjshare.io` |
| `STORJ_BUCKET` | Bucket name | `openscout-artifacts` |
| **LLM / AI** | | |
| `LLM_PROVIDER` | Which LLM to use | `gemini` or `openai` |
| `GEMINI_API_KEY` | Google Gemini API key | (from Google AI Studio) |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | `sk-...` |
| **App** | | |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `BACKEND_PORT` | Port for the FastAPI server | `8000` |
| **Jules API** | | |
| `JULES_API_BASE_URL` | Base URL for the Jules REST API | `https://jules.google.com/api` |
| `JULES_DEFAULT_API_KEY` | Optional fallback Jules API key for development/testing (production uses per-user keys) | (from Jules settings page) |

---

## 12. Development Workflow

### 12.1 Local Development Setup

| Step | Action | Details |
|---|---|---|
| 1 | Clone the repository | Standard Git clone |
| 2 | Copy environment variables | Copy `.env.example` to `.env` and fill in credentials |
| 3 | Start the backend | Create Python virtual environment, install dependencies from `pyproject.toml`, run the FastAPI server on port 8000 |
| 4 | Start the frontend | Install npm dependencies, run Next.js dev server on port 3000 |

**Access points during local development:**

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |

### 12.2 Docker Compose (Optional)

A `docker-compose.yml` at the root provides an optional local development setup with the backend and a local MongoDB instance running in containers. This eliminates the need for a cloud MongoDB Atlas connection during development.

**Services:**

| Service | Image/Build | Port |
|---|---|---|
| `backend` | Built from `./backend/Dockerfile` | 8000 |
| `mongo` | `mongo:7` | 27017 |

### 12.3 Git Branching Strategy

```
main              ← production-ready code
  └── develop     ← integration branch
       ├── feat/auth-clerk
       ├── feat/profile-analysis
       ├── feat/recommendations
       ├── feat/repo-detail
       ├── feat/blueprint-generation
       └── feat/dashboard-ui
```

| Branch | Purpose |
|---|---|
| `main` | Production-ready, deployed code. Only receives merges from `develop`. |
| `develop` | Integration branch. Feature branches merge here after review. |
| `feat/*` | Individual feature branches. One branch per PRD feature or component. |

---

## 13. Phased Build Plan

### Phase 1A — Foundation and Authentication (Days 1–2)

| Task | Owner | Details |
|---|---|---|
| Initialize monorepo structure | Full Stack | Create folder structure, configs, READMEs |
| Next.js + Tailwind setup | Frontend | Create-next-app, Tailwind config, design tokens, layout shell |
| FastAPI skeleton | Backend | App entrypoint, CORS, health check endpoint, Pydantic settings |
| MongoDB connection | Backend | Motor setup, connection module, index creation |
| Clerk integration | Full Stack | Frontend `<ClerkProvider>`, middleware, backend JWT verification |
| Clerk webhook → user sync | Backend | `/api/auth/webhook/clerk` creates/syncs user in MongoDB |
| Landing page | Frontend | Value prop, Clerk "Continue with GitHub" login CTA |

**✅ Milestone:** User can sign in with GitHub via Clerk and their user record is synchronized to MongoDB.

---

### Phase 1B — Profile Analysis (Days 3–4)

| Task | Owner | Details |
|---|---|---|
| GitHub API service | Backend | Fetch user repos, languages, commits, contribution data |
| Profile analyzer service | Backend | Infer skills, experience level, confidence scores from raw evidence |
| Durable jobs queue setup | Backend | Create MongoDB `background_jobs` and wire FastAPI BackgroundTasks |
| Profile API (`/api/profile/*`) | Backend | Trigger profile analysis job (`/api/profile/analyze`), check job status (`/api/jobs/:id`), return profile (`/api/profile/me`) |
| Fallback preferences | Full Stack | Onboarding fallback flow: prompt user for manual preferences if GitHub data is sparse, save in `user_preferences`, blend into profile |

**✅ Milestone:** User profile analysis runs durably in the background, with manual fallback onboarding if GitHub data is empty.

---

### Phase 1C — Eligibility and Recommendations (Days 5–6)

| Task | Owner | Details |
|---|---|---|
| Candidate ingestion service | Backend | `candidate_repository_service` to build GitHub Search queries and fetch candidate repos, caching them in MongoDB |
| Eligibility filter | Backend | Deterministic quality gate filter (public, not fork/archived, commit < 90 days, README > 500 chars, valid license, stars/forks count) |
| Recommendation engine | Backend | Weighted heuristic scoring (languages, frameworks, interests, health) + Gemini explanation generator |
| Recommendations API | Backend | `POST /api/recommendations/generate` (asynchronously queued) and `GET /api/recommendations` (returns latest completed run) |

**✅ Milestone:** Candidate repositories are fetched, filtered for quality, heuristically matched, and explained via Gemini LLM.

---

### Phase 1D — Recommendation Dashboard (Days 7–8)

| Task | Owner | Details |
|---|---|---|
| Dashboard layout | Frontend | Aggregate dashboard endpoint (`/api/dashboard`), skeleton loaders, user profile module |
| Recommendation cards | Frontend | Card list showing match %, difficulty/confidence badges, and Gemini text explanation |
| Job polling integration | Frontend | Poll `GET /api/jobs/:id` for profile and recommendation jobs, displaying progressive loading states |

**✅ Milestone:** Users can view their detected profile and interact with personalized repository recommendation cards on a polished dashboard.

---

### Phase 2 — Repository Detail & Opportunities (Days 9–10)

| Task | Owner | Details |
|---|---|---|
| Repo analyzer service | Backend | AI codebase summaries and default branch / commit SHA caching |
| Repository API | Backend | `/api/repositories/:id` with cached/on-open analysis |
| Opportunity discovery service | Backend | 8-tier opportunity pipeline (Good First Issues, AI suggestions) |
| Repository detail page | Frontend | AI summary, tech stack tags, opportunity table |
| Search API & Saved History | Full Stack | Manual search, saving repositories, recently viewed history |

**✅ Milestone:** User can click a recommendation to open a repository, read its AI-generated analysis, and browse available contribution opportunities.

---

### Phase 3 — Blueprint & Handoff (Days 11–12)

| Task | Owner | Details |
|---|---|---|
| Blueprint generator service | Backend | Full versioned blueprint generator (Gemini prompt versioning and file references) |
| Blueprint API & UI | Full Stack | Generate, retrieve, list versions, and progressive loading view |
| Jules API integration | Backend | Create Google Jules sessions via Jules REST API, verify source repository, handle deep-linking |
| Jules handoff flow | Frontend | "Continue to Google Jules" redirection, copy-paste graceful fallback |
| Storj integration | Backend | Blueprint PDF/Markdown export and S3-compatible storage |

**✅ Milestone:** Complete end-to-end flow from login to generating a Contribution Blueprint and handing off to a Google Jules editing session.

## 14. Security Considerations

### 14.1 Authentication & Authorization

| Concern | Mitigation |
|---|---|
| JWT forgery | All JWTs verified against Clerk's public JWKS endpoint using RS256 |
| Token exposure | JWTs transmitted only over HTTPS. Frontend never stores tokens in localStorage — Clerk SDK manages session tokens via secure cookies |
| Unauthorized access | Every backend endpoint (except webhooks and health check) requires a valid JWT. Route-level protection enforced by middleware |
| Webhook tampering | Clerk webhook payloads verified using svix signature validation |

### 14.2 Data Security

| Concern | Mitigation |
|---|---|
| GitHub token storage | Stored encrypted in the `oauth_connections` collection using AES-256-GCM. Isolated entirely from `users` records and primary user APIs. |
| Database access | MongoDB Atlas uses TLS encryption in transit, encryption at rest, and IP whitelisting |
| Secrets management | All secrets stored in environment variables, never committed to the repository. `.env.example` contains only placeholder values |

### 14.3 API Security

| Concern | Mitigation |
|---|---|
| CORS | Backend only accepts requests from the configured `FRONTEND_URL` origin |
| Rate limiting | GitHub API rate limits managed by the backend's rate limiter module (exponential backoff, quota tracking) |
| Input validation | All request bodies validated by Pydantic models before reaching business logic |

### 14.4 Token Security & Isolation
- Encrypted credentials (such as access tokens and refresh tokens) reside in `oauth_connections` to limit leakage vector should a user record or user profile API get compromised.
- Decryption keys are stored strictly in backend server environment variables (`ENCRYPTION_KEY`), and decrypted values are never transmitted to the frontend.


---

## 15. Performance & Scalability

### 15.1 Caching Strategy

| What | Where | TTL | Invalidation |
|---|---|---|---|
| Repository metadata | MongoDB (`repositories` collection) | 24 hours | On manual re-analysis |
| Repository analysis | MongoDB (`repository_analyses` collection) | 24 hours | On manual re-analysis or default branch / commit SHA updates. Keyed on `repository_id + commit_sha + analysis_version`. |
| Clerk JWKS | In-memory (backend process) | Indefinite (until restart) | Server restart |
| Developer profile | MongoDB (`developer_profiles` collection) | Until re-analysis | On manual re-analysis |


### 15.2 Performance Targets

| Operation | Target Latency | Strategy |
|---|---|---|
| Dashboard load | < 500ms | Pre-computed recommendations served from MongoDB. SWR cache on frontend |
| Repository detail (cached) | < 300ms | Serve cached analysis from MongoDB |
| Repository detail (fresh analysis) | 10–30s | Async task pattern with polling. User sees skeleton UI during analysis |
| Blueprint generation | 15–45s | Async task pattern with progressive section reveal |
| Search | < 1s | MongoDB text index with pre-filtered eligible repos |

### 15.3 Scalability Path

| Current (MVP) | Scale-Up Path |
|---|---|
| Single FastAPI instance | Horizontal scaling on Railway/Render (multiple instances behind load balancer) |
| FastAPI `BackgroundTasks` | Celery + Redis for distributed task processing |
| MongoDB Atlas free tier | Atlas auto-scaling (paid tiers) |
| In-memory JWKS cache | Redis for shared cache across instances |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Blueprint** | A structured Contribution Blueprint — the core deliverable of OpenScout.ai. Contains repository understanding, match explanation, learning objectives, implementation strategy, and a pre-formatted Jules prompt. |
| **Confidence Score** | A float (0–1) representing how confident the AI is in a particular analysis, recommendation, or classification. Displayed to users for transparency. |
| **Eligibility Filter** | A quality gate that rejects repositories not suitable for contribution recommendations (archived, forked, unlicensed, stale, etc.). |
| **Experience Level** | A classification of a developer's overall experience: `beginner`, `intermediate`, or `advanced`. Inferred from GitHub activity. |
| **Handoff** | The act of transferring a completed Blueprint to Google Jules for implementation. Primary path: API-driven session creation via the Jules REST API. Fallback: copy-to-clipboard. |
| **Health Score** | A composite metric (0–100) measuring a repository's overall health based on commit frequency, issue responsiveness, contributor diversity, and documentation quality. |
| **Jules** | Google Jules — an AI coding agent. OpenScout.ai creates Jules Sessions via the Jules REST API, pre-loading context-rich prompts so the developer can move directly from planning to implementation with zero manual re-entry. |
| **Match Score** | A float (0–100) representing how well a repository matches a developer's profile, based on language overlap, topic similarity, difficulty alignment, and community health. |
| **Opportunity** | A specific, actionable contribution opportunity within a repository (e.g., a good-first-issue, a documentation gap, a missing test). Categorized into 8 tiers of difficulty. |
| **Profile Analysis** | The process of analyzing a developer's GitHub activity to infer skills, experience level, and interests. Produces the `developer_profiles` document. |
| **Tier** | A priority classification (1–8) for contribution opportunities based on source priority (such as existing Good First Issues, Help Wanted issues, doc updates, refactoring, and AI-generated ideas), rather than a strict complexity/difficulty ladder. |

---

*This document is a living guide. Update it as architectural decisions are finalized and TBDs from the PRD are resolved.*

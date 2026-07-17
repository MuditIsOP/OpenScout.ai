# OpenScout.ai — Application Flow & Architecture

> Visual architecture reference for the entire OpenScout.ai platform. Each diagram maps directly to PRD features and TECHNICAL_GUIDE specifications.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Browser"]
        FE["Next.js Frontend<br/>(Vercel Edge)"]
        ClerkSDK["Clerk Auth SDK"]
    end

    subgraph Backend["⚙️ Python Backend (Railway/Render)"]
        API["FastAPI<br/>API Routes"]
        Services["Service Layer"]
        Workers["Background Workers"]
        JHS["Jules Handoff<br/>Service"]
    end

    subgraph ExternalAPIs["🌐 External APIs"]
        GitHub["GitHub REST API"]
        Gemini["Google Gemini<br/>(LLM)"]
        JulesAPI["Jules REST API"]
        ClerkAPI["Clerk Backend API"]
    end

    subgraph DataStores["💾 Data Stores"]
        MongoDB["MongoDB Atlas"]
        Storj["Storj<br/>(S3-compatible)"]
    end

    FE -->|"HTTPS + JWT"| API
    ClerkSDK -->|"OAuth + JWT"| ClerkAPI
    API --> Services
    API --> Workers
    Services --> GitHub
    Services --> Gemini
    Services --> ClerkAPI
    JHS -->|"X-Goog-Api-Key"| JulesAPI
    Services --> MongoDB
    Services --> Storj
    Workers --> MongoDB
    Workers --> Gemini
    Workers --> GitHub

    style Client fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
    style Backend fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style ExternalAPIs fill:#134e4a,stroke:#14b8a6,color:#ccfbf1
    style DataStores fill:#78350f,stroke:#f59e0b,color:#fef3c7
```

---

## 2. End-to-End User Journey

This is the primary product flow — every screen and API call maps to a step in this journey.

```mermaid
flowchart TD
    A["🔐 GitHub Login<br/>(Clerk OAuth)"] --> B["📊 Profile Analysis<br/>(Auto-triggered)"]
    B --> C["🏠 Dashboard<br/>(Personalized)"]
    C --> D{"How does user<br/>find a repo?"}
    D -->|"AI Recommendations"| E["⭐ Recommendation Cards<br/>(Ranked by match %)"]
    D -->|"Manual Search"| F["🔍 Search Results<br/>(With eligibility badges)"]
    E --> G["📁 Repository Detail<br/>(AI Summary + Opportunities)"]
    F --> G
    G --> H["🎯 Select Contribution<br/>Opportunity"]
    H --> I["📋 Blueprint Generation<br/>(Progressive reveal)"]
    I --> J{"Jules API Key<br/>configured?"}
    J -->|"Yes"| K["🚀 Jules API Handoff<br/>(Session created → Redirect)"]
    J -->|"No"| L["📎 Copy Prompt<br/>(Polished fallback UI)"]
    K --> M["✅ Implementing in Jules<br/>(jules.google.com)"]
    L --> M

    style A fill:#7c3aed,stroke:#a78bfa,color:#fff
    style B fill:#2563eb,stroke:#60a5fa,color:#fff
    style C fill:#0891b2,stroke:#22d3ee,color:#fff
    style G fill:#059669,stroke:#34d399,color:#fff
    style I fill:#d97706,stroke:#fbbf24,color:#fff
    style K fill:#dc2626,stroke:#f87171,color:#fff
    style M fill:#16a34a,stroke:#4ade80,color:#fff
```

---

## 3. Authentication Flow (Clerk + GitHub OAuth)

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FE as Next.js Frontend
    participant Clerk as Clerk OAuth
    participant GH as GitHub
    participant BE as FastAPI Backend
    participant DB as MongoDB

    User->>FE: Click "Continue with GitHub"
    FE->>Clerk: Initiate OAuth flow
    Clerk->>GH: Redirect to GitHub OAuth
    GH-->>User: Authorize OpenScout.ai
    GH->>Clerk: Return OAuth token
    Clerk->>Clerk: Create/update user record
    Clerk-->>FE: Issue JWT + session
    
    Note over Clerk,BE: Webhook (async)
    Clerk-)BE: POST /api/auth/webhook/clerk<br/>(user.created event)
    BE->>BE: Verify webhook signature (svix)
    BE->>DB: Create user document<br/>(clerk_id, github_id, username)
    BE->>BE: Queue profile analysis task

    Note over FE,BE: Subsequent API calls
    FE->>BE: GET /api/profile/me<br/>(Authorization: Bearer JWT)
    BE->>BE: Verify JWT via Clerk JWKS
    BE->>DB: Fetch user profile
    BE-->>FE: Return profile data
```

---

## 4. Profile Analysis Pipeline

```mermaid
flowchart TD
    A["🔔 Trigger<br/>(First login or manual preferences fallback)"] --> B["POST /api/profile/analyze"]
    B --> C["202 Accepted<br/>{job_id, status: queued}"]
    C --> D["⚙️ Background Task Worker"]
    
    D --> E["Fetch GitHub Data"]
    E --> E1["Repositories (owned/contributed)"]
    E --> E2["Languages & technology stack"]
    E --> E3["Commit history & frequencies"]
    E --> E4["PR & issue activities"]
    
    E1 & E2 & E3 & E4 --> F["⚙️ Deterministic & Heuristic Parsing"]
    
    F --> G["Aggregate Skill Stats"]
    G --> G1["Primary languages & usage weights"]
    G --> G2["Framework familiarity & active topics"]
    G --> G3["Heuristic Experience Level<br/>(based on codebase complexity & activity)"]
    
    G1 & G2 & G3 --> H["🤖 Gemini LLM Profile Summarizer"]
    H --> I["Generate readable summary & matching evidence reasons"]
    
    I & G1 & G2 & G3 --> J["💾 Save to MongoDB<br/>(developer_profiles & profile_snapshots)"]
    J --> K["Update Job Status → completed"]

    K --> L["Frontend polls<br/>GET /api/jobs/:job_id"]
    L --> M["✅ Profile ready<br/>→ GET /api/profile/me<br/>→ Dashboard loads"]

    style A fill:#7c3aed,stroke:#a78bfa,color:#fff
    style D fill:#2563eb,stroke:#60a5fa,color:#fff
    style F fill:#0891b2,stroke:#22d3ee,color:#fff
    style H fill:#059669,stroke:#34d399,color:#fff
    style J fill:#d97706,stroke:#fbbf24,color:#fff
```

---

## 5. Recommendation Engine Flow

```mermaid
flowchart TD
    subgraph Discovery["🔍 Candidate Ingestion & Quality Gates"]
        A["Developer Profile"] --> B["GitHub Search Query Builder"]
        B -->|"Live Query"| C["GitHub REST API"]
        C --> D["Candidate Repository Pool"]
        D --> E["Metadata Enrichment"]
        E --> F["Eligibility Filter<br/>(Forks, Archived, Activity, License, README check)"]
        F -->|"Rejected Candidates"| F1["Discarded Pool<br/>(Log Reasons)"]
        F -->|"Accepted Candidates"| G["Eligible Repository Pool<br/>(Cached in MongoDB)"]
    end

    subgraph Scoring["⚙️ Heuristic Scoring Pipeline"]
        G --> H1["Language Similarity (30%)"]
        G --> H2["Framework/Topic Match (20%)"]
        G --> H3["Difficulty Alignment (15%)"]
        G --> H4["Activity & Recency (10%)"]
        G --> H5["Beginner Friendliness (10%)"]
        G --> H6["Docs & Maintainer Health (15%)"]
        
        A --> H1 & H2 & H3
        
        H1 & H2 & H3 & H4 & H5 & H6 --> I["Heuristic Match Score (0-100)"]
    end

    subgraph Output["📤 Output Generation"]
        I --> J["Rank & Deduplicate Recommendations"]
        J -->|"Top Candidates"| K["🤖 Gemini LLM Explanations Generator"]
        K --> L["Final Recommendations Document<br/>(Saved to MongoDB)"]
    end

    style Discovery fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
    style Scoring fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style Output fill:#134e4a,stroke:#14b8a6,color:#ccfbf1
```

---

## 6. Repository Analysis & Opportunity Discovery

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend API
    participant GH as GitHub API
    participant LLM as Gemini LLM
    participant DB as MongoDB
    participant Cache as Analysis Cache

    FE->>BE: GET /api/repositories/:id
    BE->>Cache: Check for cached analysis
    
    alt Cache hit (fresh)
        Cache-->>BE: Return cached data
        BE-->>FE: Repository + analysis data
    else Cache miss or stale
        BE-->>FE: 202 Accepted (analysis_status: running)
        
        par Repository Metadata
            BE->>GH: Fetch repo info, README, contributors
        and Opportunity Discovery
            BE->>GH: Fetch issues, labels, PR templates
        end
        
        BE->>BE: Run Eligibility Filter<br/>(archived? forked? licensed? active?)
        
        BE->>LLM: Generate AI summary<br/>(repo purpose, tech stack, health)
        LLM-->>BE: Structured analysis

        BE->>BE: Query GitHub API for Issues (Tiers 1-3 Good First Issues/Help Wanted)
        BE->>LLM: Generate Tier 8 AI-generated Suggestions (if confidence high)
        LLM-->>BE: AI Suggestions (Tier 8)
        BE->>BE: Merge and Prioritize Opportunities (Tiers 1-8)

        BE->>DB: Save repository_analyses
        BE->>DB: Save contribution_opportunities
        BE->>Cache: Cache results (TTL-based)
        
        FE->>BE: GET /api/repositories/:id/analysis-status
        BE-->>FE: {status: complete, data: ...}
    end
```

---

## 7. Blueprint Generation Flow

```mermaid
flowchart TD
    A["User selects an opportunity<br/>from repository detail page"] --> B["POST /api/blueprints<br/>{repository_id, opportunity_id}"]
    
    B --> C["Backend gathers context"]
    C --> C1["Developer profile"]
    C --> C2["Repository analysis"]
    C --> C3["Selected opportunity details"]
    C --> C4["Repo README + file structure"]
    
    C1 & C2 & C3 & C4 --> D["🤖 LLM Blueprint Generation<br/>(Gemini)"]
    
    D --> E["Generate All Sections"]
    E --> E1["📖 Repository Understanding"]
    E --> E2["🎯 Match Explanation"]
    E --> E3["📚 Learning Objectives"]
    E --> E4["📂 Suggested Reading Order"]
    E --> E5["🔧 Implementation Strategy"]
    E --> E6["🚀 Final Jules Prompt"]
    
    E1 & E2 & E3 & E4 & E5 & E6 --> F["💾 Save Blueprint<br/>(status: complete)"]
    
    F --> G["Frontend: Progressive Reveal<br/>(Section-by-section animation)"]
    
    G --> H["User reviews Blueprint"]
    H --> I["Continue to Google Jules →"]

    style A fill:#7c3aed,stroke:#a78bfa,color:#fff
    style D fill:#2563eb,stroke:#60a5fa,color:#fff
    style F fill:#d97706,stroke:#fbbf24,color:#fff
    style G fill:#059669,stroke:#34d399,color:#fff
    style I fill:#dc2626,stroke:#f87171,color:#fff
```

---

## 8. Jules API Handoff Flow (API-Driven)

This is the **primary KPI completion event** — the moment the user transitions from planning to implementation.

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FE as Frontend
    participant BE as FastAPI Backend
    participant DB as MongoDB
    participant Jules as Jules REST API

    User->>FE: Click "Continue to Google Jules"
    FE->>BE: POST /api/blueprints/:id/jules-handoff

    BE->>DB: Fetch blueprint.final_jules_prompt
    BE->>DB: Fetch user.jules_api_key

    alt No API key configured
        BE-->>FE: {method: "copy", prompt: "...",<br/>error_reason: "api_key_missing"}
        FE->>User: Show copy-to-clipboard fallback<br/>+ link to settings
    else API key exists
        BE->>Jules: GET /sources<br/>(X-Goog-Api-Key header)
        
        alt Repo not connected
            Jules-->>BE: Source not found
            BE-->>FE: {method: "copy", prompt: "...",<br/>error_reason: "repo_not_connected"}
            FE->>User: Show "Install Jules GitHub App" message<br/>+ copy fallback
        else Repo connected
            BE->>Jules: POST /sessions<br/>{source_id, prompt: final_jules_prompt}
            Jules-->>BE: {session_id, session_url}
            
            BE->>DB: Log handoff_event<br/>(method: api, session_id, session_url)
            BE-->>FE: {method: "api",<br/>session_url, session_id}
            
            FE->>User: Redirect to jules.google.com<br/>(Context pre-loaded!)
        end
    end

    Note over User,Jules: ✅ Zero manual re-entry required
```

---

## 9. Frontend Page Architecture

```mermaid
graph TD
    subgraph AppRouter["Next.js App Router"]
        Root["/ (Landing Page)"]
        SignIn["/sign-in (Clerk)"]
        Dashboard["/dashboard"]
        RepoDetail["/repository/[id]"]
        BlueprintView["/blueprint/[id]"]
        Search["/search"]
        History["/history"]
        Settings["/settings"]
    end

    subgraph SharedComponents["Shared Components"]
        Header["Header + Nav"]
        ConfBadge["ConfidenceBadge"]
        DiffBadge["DifficultyBadge"]
        Skeleton["LoadingSkeleton"]
    end

    subgraph DashboardComponents["Dashboard Components"]
        ProfileSummary["ProfileSummary"]
        SkillsModule["SkillsModule"]
        RecommendationCard["RecommendationCard"]
    end

    subgraph RepoComponents["Repository Components"]
        RepoHeader["RepoHeader"]
        AISummary["AISummary"]
        HealthSignals["HealthSignals"]
        OpportunitiesList["OpportunitiesList"]
    end

    subgraph BlueprintComponents["Blueprint Components"]
        BlueprintSections["BlueprintSections"]
        ProgressiveReveal["ProgressiveReveal"]
        JulesHandoff["JulesHandoffBlock"]
    end

    Root --> SignIn
    SignIn -->|"Authenticated"| Dashboard
    Dashboard --> RepoDetail
    Dashboard --> Search
    Dashboard --> History
    Dashboard --> Settings
    RepoDetail --> BlueprintView

    Dashboard --- DashboardComponents
    RepoDetail --- RepoComponents
    BlueprintView --- BlueprintComponents

    style AppRouter fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
    style SharedComponents fill:#78350f,stroke:#f59e0b,color:#fef3c7
    style DashboardComponents fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style RepoComponents fill:#134e4a,stroke:#14b8a6,color:#ccfbf1
    style BlueprintComponents fill:#7f1d1d,stroke:#ef4444,color:#fecaca
```

---

## 10. Backend Service Architecture

```mermaid
graph TD
    subgraph APILayer["API Layer (Route Handlers)"]
        AuthAPI["api/auth.py<br/>/api/auth"]
        ProfileAPI["api/profile.py<br/>/api/profile"]
        RecoAPI["api/recommendations.py<br/>/api/recommendations"]
        RepoAPI["api/repositories.py<br/>/api/repositories"]
        BlueprintAPI["api/blueprints.py<br/>/api/blueprints"]
        SearchAPI["api/search.py<br/>/api/search"]
        HistoryAPI["api/history.py<br/>/api/history"]
        DashAPI["api/dashboard.py<br/>/api/dashboard"]
    end

    subgraph ServiceLayer["Service Layer (Business Logic)"]
        GHService["github_service"]
        ProfileSvc["profile_analyzer"]
        RecoSvc["recommendation_engine"]
        EligSvc["eligibility_filter"]
        RepoSvc["repo_analyzer"]
        OpportSvc["opportunity_discovery"]
        BlueprintSvc["blueprint_generator"]
        JulesSvc["jules_handoff_service"]
        StorjSvc["storj_service"]
        AISvc["ai_service"]
    end

    subgraph Middleware["Middleware"]
        JWTAuth["core/auth.py<br/>(JWT verification)"]
        RateLimit["core/rate_limiter.py<br/>(GitHub API quota)"]
        CacheMgr["core/cache.py<br/>(Analysis caching)"]
        ErrHandler["core/exceptions.py<br/>(Error mapping)"]
    end

    AuthAPI --> GHService
    ProfileAPI --> ProfileSvc
    RecoAPI --> RecoSvc
    RepoAPI --> RepoSvc & EligSvc & OpportSvc
    BlueprintAPI --> BlueprintSvc & JulesSvc
    
    ProfileSvc --> GHService & AISvc
    RecoSvc --> AISvc
    RepoSvc --> GHService & AISvc
    OpportSvc --> GHService & AISvc
    BlueprintSvc --> AISvc
    JulesSvc -.->|"Jules REST API"| JulesExt["jules.google.com"]

    style APILayer fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
    style ServiceLayer fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style Middleware fill:#78350f,stroke:#f59e0b,color:#fef3c7
```

---

## 11. Database Entity Relationships

```mermaid
erDiagram
    users ||--o{ oauth_connections : "has credentials"
    users ||--o| user_preferences : "defines settings"
    users ||--o| developer_profiles : "possesses profile"
    users ||--o{ profile_snapshots : "records skill evidence"
    users ||--o{ recommendation_runs : "triggers evaluations"
    users ||--o{ recommendations : "receives matches"
    users ||--o{ user_repository_states : "maintains views and saves"
    users ||--o{ blueprints : "generates outlines"
    users ||--o{ analytics_events : "emits tracking"
    users ||--o{ audit_logs : "records actions"

    developer_profiles ||--o{ profile_snapshots : "backed by snapshots"
    profile_snapshots ||--o{ recommendation_runs : "parameterizes runs"
    recommendation_runs ||--o{ recommendations : "produces matching pools"

    repositories ||--o{ repository_analyses : "contains evaluations"
    repositories ||--o{ contribution_opportunities : "contains issue lists"
    repositories ||--o{ recommendations : "targeted in runs"
    repositories ||--o{ user_repository_states : "state track target"
    repositories ||--o{ blueprints : "outlined for"

    contribution_opportunities ||--o{ blueprints : "satisfies details"
    blueprints ||--o{ handoff_events : "launches sessions"
    blueprints ||--o| blueprints : "supersedes versions"

    users {
        uuid id PK
        string clerk_id UK
        string github_id UK
        string github_username
        string avatar_url
        datetime created_at
        datetime last_login_at
    }

    oauth_connections {
        uuid id PK
        uuid user_id FK
        string provider
        string access_token
        string refresh_token
        array scopes
        string token_status
        object key_rotation_metadata
        datetime created_at
        datetime updated_at
    }

    user_preferences {
        uuid id PK
        uuid user_id FK "unique"
        array skills
        array languages
        array frameworks
        array interests
        array contribution_preferences
        string difficulty_preference
        string jules_api_key
        datetime created_at
        datetime updated_at
    }

    developer_profiles {
        uuid id PK
        uuid user_id FK "unique"
        string experience_level
        float experience_confidence
        object contribution_history_summary
        array project_domains
        datetime last_analyzed_at
        string analysis_version
    }

    profile_snapshots {
        uuid id PK
        uuid user_id FK
        uuid developer_profile_id FK
        object inferred_skills
        object source_evidence
        string scoring_rationale
        datetime created_at
    }

    repositories {
        uuid id PK
        integer github_repo_id UK
        string full_name UK
        string description
        string primary_language
        array topics
        integer stars
        integer forks
        integer open_issues_count
        datetime last_commit_at
        string license
        boolean is_fork
        boolean is_archived
        float health_score
        float beginner_friendly_score
        float doc_quality_score
        integer size_kb
        string eligibility_status
        array eligibility_reasons
        datetime cached_at
    }

    repository_analyses {
        uuid id PK
        uuid repository_id FK
        string default_branch
        string commit_sha
        string analysis_version
        string summary_text
        array tech_stack
        string activity_summary
        string community_summary
        float contribution_friendliness_score
        string onboarding_difficulty
        float confidence_score
        datetime analyzed_at
        datetime cache_invalidated_at
    }

    contribution_opportunities {
        uuid id PK
        uuid repository_id FK
        string repository_commit_sha
        integer tier
        string source_type
        integer github_issue_number
        string github_issue_url
        string current_issue_state
        array assignees
        array linked_pull_requests
        string title
        string description
        float confidence_score
        string estimated_difficulty
        datetime last_issue_activity
        datetime last_verification_time
        datetime expiration_time
        array relevant_verified_file_paths
        boolean is_possibly_claimed
        datetime created_at
    }

    recommendation_runs {
        uuid id PK
        uuid user_id FK
        uuid profile_snapshot_id FK
        string scoring_algorithm_version
        object filters_applied
        integer candidates_evaluated_count
        string idempotency_key UK
        datetime created_at
    }

    recommendations {
        uuid id PK
        uuid recommendation_run_id FK
        uuid user_id FK
        uuid repository_id FK
        float match_score
        float confidence_score
        array reasons
        datetime created_at
    }

    user_repository_states {
        uuid id PK
        uuid user_id FK
        uuid repository_id FK
        boolean is_saved
        datetime saved_at
        boolean is_viewed
        datetime last_viewed_at
        string recommendation_state
        datetime created_at
        datetime updated_at
    }

    blueprints {
        uuid id PK
        uuid blueprint_group_id
        integer version
        uuid supersedes_blueprint_id FK
        uuid user_id FK
        uuid repository_id FK
        string repository_commit_sha
        uuid opportunity_id FK
        string prompt_version
        string output_schema_version
        string repository_understanding
        string match_explanation
        float confidence_level
        string estimated_difficulty
        string estimated_effort
        array learning_objectives
        array constraints
        object suggested_reading_order
        string implementation_strategy
        string final_jules_prompt
        string idempotency_key UK
        string status
        datetime created_at
    }

    handoff_events {
        uuid id PK
        uuid blueprint_id FK
        string method
        string jules_session_id
        string jules_session_url
        string error_reason
        string idempotency_key UK
        datetime initiated_at
    }

    background_jobs {
        uuid id PK
        string job_type
        string status
        integer retries
        integer attempt_count
        string idempotency_key UK
        string worker_lease
        integer timeout
        object dead_letter_state
        object payload
        datetime created_at
        datetime updated_at
    }

    ai_runs {
        uuid id PK
        string provider
        string model
        string prompt_version
        string output_schema_version
        object token_usage
        integer latency_ms
        boolean validation_failure
        boolean fallback_provider_usage
        string grounding_evidence_hash
        float estimated_cost
        datetime created_at
    }

    analytics_events {
        uuid id PK
        uuid user_id FK
        string event_name
        object payload
        datetime created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        string ip_address
        string user_agent
        object payload
        datetime created_at
    }
```

---

## 12. Deployment Topology

```mermaid
graph LR
    subgraph UserDevice["👤 User Device"]
        Browser["Browser"]
    end

    subgraph Vercel["Vercel"]
        Edge["Edge Network<br/>(Global CDN)"]
        NextJS["Next.js SSR<br/>(App Router)"]
    end

    subgraph BackendHost["Railway / Render"]
        FastAPI["FastAPI Server<br/>(uvicorn)"]
        BGWorker["Background Workers"]
    end

    subgraph ManagedServices["Managed Services"]
        Atlas["MongoDB Atlas"]
        StorjCloud["Storj Cloud"]
        ClerkCloud["Clerk"]
    end

    subgraph GoogleAPIs["Google"]
        GeminiAPI["Gemini API"]
        JulesREST["Jules REST API"]
    end

    subgraph GitHubCloud["GitHub"]
        GHAPI["GitHub REST API"]
    end

    Browser <-->|"HTTPS"| Edge
    Edge <--> NextJS
    NextJS <-->|"HTTPS + JWT"| FastAPI
    FastAPI --> BGWorker
    FastAPI <--> Atlas
    FastAPI <--> StorjCloud
    FastAPI <--> ClerkCloud
    FastAPI <--> GeminiAPI
    FastAPI <-->|"X-Goog-Api-Key"| JulesREST
    FastAPI <--> GHAPI
    BGWorker --> Atlas
    BGWorker --> GeminiAPI
    BGWorker --> GHAPI

    style UserDevice fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
    style Vercel fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style BackendHost fill:#134e4a,stroke:#14b8a6,color:#ccfbf1
    style ManagedServices fill:#78350f,stroke:#f59e0b,color:#fef3c7
    style GoogleAPIs fill:#7f1d1d,stroke:#ef4444,color:#fecaca
    style GitHubCloud fill:#1c1917,stroke:#a3a3a3,color:#e5e5e5
```

---

## Quick Reference — API Call Map

Which service calls which external API:

| Backend Service | GitHub API | Gemini LLM | Jules API | Clerk API | MongoDB | Storj |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `github_service` | ✅ | | | | | |
| `profile_analyzer` | ✅ | ✅ | | | ✅ | |
| `recommendation_engine` | | ✅ | | | ✅ | |
| `eligibility_filter` | | | | | ✅ | |
| `repo_analyzer` | ✅ | ✅ | | | ✅ | |
| `opportunity_discovery` | ✅ | ✅ | | | ✅ | |
| `blueprint_generator` | | ✅ | | | ✅ | |
| `jules_handoff_service` | | | ✅ | | ✅ | |
| `storj_service` | | | | | | ✅ |
| `ai_service` | | ✅ | | | | |
| `core/auth.py` | | | | ✅ | | |

---

## 13. Background Job Lifecycle (Durable Jobs)

Durable tasks like profile analysis and recommendations generation track progress and leases through a database-backed state machine:

```mermaid
stateDiagram-v2
    [*] --> Queued : POST request creates job document (queued)
    Queued --> Running : Background task starts execution (worker claims lease, updates timestamp)
    Running --> Completed : Job logic completes successfully (status → completed, saves results)
    Running --> Failed : Job encounters recoverable error (status → failed, releases lease)
    Failed --> Queued : Auto-retry queued if attempts < max_retries (increments attempt_count)
    Failed --> DeadLetter : Job exceeds max_retries (status → dead_letter, logs diagnostic error)
    Completed --> [*]
    DeadLetter --> [*]
```

---

*This document provides the visual architecture companion to [TECHNICAL_GUIDE.md](file:///d:/OpenScout.ai-main/OpenScout.ai-main/OpenScout.ai/TECHNICAL_GUIDE.md) and [PRD.md](file:///d:/OpenScout.ai-main/OpenScout.ai-main/OpenScout.ai/PRD.md). All diagrams reflect the API-driven Jules integration strategy.*

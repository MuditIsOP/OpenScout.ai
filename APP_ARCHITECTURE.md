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
    A["🔔 Trigger<br/>(First login or manual re-analysis)"] --> B["POST /api/profile/analyze"]
    B --> C["202 Accepted<br/>{task_id, status: queued}"]
    C --> D["⚙️ Background Worker"]
    
    D --> E["Fetch GitHub Data"]
    E --> E1["Repositories (owned)"]
    E --> E2["Languages & frameworks"]
    E --> E3["Commit history"]
    E --> E4["PR & issue contributions"]
    
    E1 & E2 & E3 & E4 --> F["🤖 LLM Analysis<br/>(Gemini)"]
    
    F --> G["Generate Profile"]
    G --> G1["Languages + weights + confidence"]
    G --> G2["Frameworks + weights"]
    G --> G3["Experience level<br/>(beginner/intermediate/advanced)"]
    G --> G4["Project domains"]
    G --> G5["Topics of interest"]
    
    G1 & G2 & G3 & G4 & G5 --> H["💾 Save to MongoDB<br/>(developer_profiles)"]
    H --> I["Status → complete"]

    I --> J["Frontend polls<br/>GET /api/profile/me"]
    J --> K["✅ Profile ready<br/>→ Dashboard loads"]

    style A fill:#7c3aed,stroke:#a78bfa,color:#fff
    style D fill:#2563eb,stroke:#60a5fa,color:#fff
    style F fill:#059669,stroke:#34d399,color:#fff
    style H fill:#d97706,stroke:#fbbf24,color:#fff
```

---

## 5. Recommendation Engine Flow

```mermaid
flowchart LR
    subgraph Inputs["📥 Inputs"]
        Profile["Developer Profile<br/>(languages, frameworks,<br/>experience, interests)"]
        RepoPool["Repository Pool<br/>(eligible repos from<br/>quality gate)"]
    end

    subgraph Scoring["⚙️ Scoring Pipeline"]
        LangMatch["Language Overlap<br/>Score"]
        TopicMatch["Topic Similarity<br/>Score"]
        DiffMatch["Difficulty Alignment<br/>Score"]
        HealthMatch["Community Health<br/>Score"]
        Composite["Composite Match %<br/>(weighted average)"]
    end

    subgraph Output["📤 Output"]
        Ranked["Ranked Recommendations"]
        Reasons["Human-readable<br/>Explanations (LLM)"]
        Confidence["Confidence Scores"]
    end

    Profile --> LangMatch & TopicMatch & DiffMatch
    RepoPool --> LangMatch & TopicMatch & DiffMatch & HealthMatch
    LangMatch & TopicMatch & DiffMatch & HealthMatch --> Composite
    Composite --> Ranked
    Composite -->|"Top N repos"| Reasons
    Composite --> Confidence

    style Inputs fill:#1e1b4b,stroke:#7c3aed,color:#e9d5ff
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

        BE->>LLM: Discover contribution opportunities<br/>(8-tier pipeline)
        LLM-->>BE: Tiered opportunities list

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
    users ||--o| developer_profiles : "has one"
    users ||--o{ recommendations : "receives many"
    users ||--o{ blueprints : "creates many"
    users ||--o{ repository_views : "views many"
    users ||--o{ saved_repositories : "saves many"
    
    repositories ||--o| repository_analyses : "has one"
    repositories ||--o{ contribution_opportunities : "has many"
    repositories ||--o{ recommendations : "recommended in"
    repositories ||--o{ blueprints : "targeted by"
    repositories ||--o{ repository_views : "viewed in"
    repositories ||--o{ saved_repositories : "saved in"
    
    contribution_opportunities ||--o{ blueprints : "addressed by"
    blueprints ||--o{ handoff_events : "handed off via"

    users {
        string clerk_id UK
        string github_id UK
        string github_username
        string avatar_url
        string jules_api_key
        enum profile_analysis_status
        datetime created_at
        datetime last_login_at
    }

    developer_profiles {
        string user_id FK
        array languages
        array frameworks
        enum experience_level
        float experience_confidence
        array project_domains
        datetime last_analyzed_at
    }

    repositories {
        string github_repo_id UK
        string full_name
        string primary_language
        integer stars
        float health_score
        float beginner_friendly_score
        enum eligibility_status
        datetime cached_at
    }

    repository_analyses {
        string repository_id FK
        string summary_text
        array tech_stack
        float contribution_friendliness_score
        float confidence_score
        datetime analyzed_at
    }

    recommendations {
        string user_id FK
        string repository_id FK
        float match_score
        float confidence_score
        array reasons
        enum status
    }

    contribution_opportunities {
        string repository_id FK
        integer tier
        string source_type
        string title
        string description
        float confidence_score
    }

    blueprints {
        string user_id FK
        string repository_id FK
        string opportunity_id FK
        string repository_understanding
        string match_explanation
        string implementation_strategy
        string final_jules_prompt
        enum status
    }

    handoff_events {
        string blueprint_id FK
        enum method
        string jules_session_id
        string jules_session_url
        string error_reason
        datetime initiated_at
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

*This document provides the visual architecture companion to [TECHNICAL_GUIDE.md](file:///d:/OpenScout.ai-main/OpenScout.ai-main/OpenScout.ai/TECHNICAL_GUIDE.md) and [PRD.md](file:///d:/OpenScout.ai-main/OpenScout.ai-main/OpenScout.ai/PRD.md). All diagrams reflect the API-driven Jules integration strategy.*

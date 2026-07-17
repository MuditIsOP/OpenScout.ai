Market Requirements Document (MRD)
Project Name
OpenScout.ai
Tagline: Open-Source from hours to minutes.

1. Executive Summary
OpenScout.ai is an AI-powered onboarding platform that helps developers discover open-source projects that match their skills and prepares them to contribute through an AI-generated Contribution Blueprint.
Instead of spending hours searching for repositories, understanding unfamiliar codebases, and deciding where to begin, users receive personalized repository recommendations, contextual repository summaries, and an actionable contribution plan before seamlessly transitioning into Google Jules for implementation.
OpenScout.ai does not replace coding assistants. It replaces the manual research and onboarding process that happens before coding begins.

2. Problem Statement
Open-source contribution has a high onboarding cost.
Developers often struggle with:

Finding repositories relevant to their skills.
Understanding unfamiliar projects.
Identifying meaningful contribution opportunities.
Deciding where to begin.
Spending hours reading documentation before writing any code.

While AI coding assistants help developers write code, they do not solve the discovery and onboarding problem.

3. Vision
Build an AI onboarding platform that enables developers to discover suitable open-source projects and begin contributing in minutes instead of hours.

4. Target Audience
Primary Audience

College students
Fresh graduates
Beginner contributors
Intermediate developers
Developers making their first open-source contribution

Secondary Audience

Experienced developers looking for personalized repository recommendations


5. Product Positioning
GitHub helps developers host code.
Google Jules helps developers write code.
OpenScout.ai helps developers discover where they should contribute and prepares them before coding begins.

6. Core Value Proposition
OpenScout.ai analyzes a developer's GitHub profile, recommends repositories that match their skills, generates an AI-powered Contribution Blueprint, and hands the developer off to Google Jules with all the context required to begin contributing confidently.

7. Goals
Business Goals

Reduce onboarding friction.
Encourage open-source contributions.
Increase developer confidence.
Demonstrate practical AI-assisted software engineering.

User Goals
Users should be able to:

Discover relevant repositories.
Understand why a repository matches them.
Understand the repository without reading extensive documentation.
Receive clear contribution guidance.
Begin implementation quickly using Google Jules.


8. Success Metrics
Primary KPI

User reaches Google Jules with a completed Contribution Blueprint.

Secondary KPIs

Repository selected.
Blueprint generated successfully.
Recommendation accepted.
Repeat usage.
Saved repositories reopened.


9. Product Journey and Phase Separation
To ensure structured engineering, OpenScout.ai's lifecycle is separated into three distinct phases:

### Phase 1: Discover the Right Repository (Current Phase)
- User logs in via Clerk-managed GitHub OAuth.
- System starts a durable profile analysis job (FastAPI & MongoDB).
- Candidate repository pool is fetched dynamically using live GitHub Search and cached in MongoDB.
- Repositories are filtered via deterministic eligibility rules.
- Heuristic matching score is computed, and Gemini generates transparent, human-readable explanations.
- User sees recommendations on a personalized Dashboard.

### Phase 2: Understand the Repository & Identify Work
- User opens a recommended repository, triggering a live repository analysis.
- System identifies suitable, active issues (Good First Issues, Help Wanted, etc.) matching the user's skills.
- Opportunities are categorized into source-priority tiers (Tiers 1-8).

### Phase 3: Generate Contribution Blueprint & Handoff
- User requests a Contribution Blueprint for a specific opportunity.
- System generates versioned, immutable Blueprints containing constraints, learning objectives, and implementation guidance.
- Complete context is loaded, and the developer hands off to Google Jules for final coding.


10. Developer Profile Analysis
The system should infer:

Primary programming languages
Framework familiarity
Repository topics
Commit activity
Preferred technology stack
Approximate experience level
Contribution history
Project domains

The platform should estimate competency rather than simply counting repositories.


11. Repository Recommendation Engine & Candidate Ingestion
The recommendation engine acts on a repository pool generated via live queries.

Candidate Pool Ingestion:
- Construct structured search queries from the user's inferred languages, frameworks, and topics.
- Run live queries against the GitHub Search API on profile creation or manual regeneration to retrieve candidate repositories.
- Deduplicate candidates by GitHub repository ID and store/enrich in the local MongoDB repository cache.

Recommendation Ranking:
Recommendations must combine multiple factors into a weighted heuristic score (avoiding raw LLM ranking):
- Programming language similarity
- Framework similarity
- Repository domain vs user interests
- Repository health and size
- Recent activity and contributor activity
- Beginner friendliness
- Documentation quality and issue quality
- Maintainer responsiveness

Every recommendation must include a human-readable explanation generated by Gemini based on the pre-computed heuristic factors.


12. Repository Eligibility Thresholds
To ensure high-quality recommendations, repositories must pass deterministic eligibility filters before scoring. The following thresholds apply:
- **Public & Active:** Must be a public repository, not a fork, not archived.
- **Recent Development:** Must have a commit pushed within the last 90 days (`pushed_at`).
- **README Presence:** README must exist and contain at least 500 characters.
- **Valid Open Source License:** Must have a detectable open-source license (e.g., MIT, Apache 2.0, GPL, BSD).
- **Minimum Popularity:** Must have at least 10 stars and 2 forks (filters out empty test repos).
- **Community Activity:** Must have at least 2 distinct contributors in the repository metadata.

Repositories failing any of these thresholds are flagged as ineligible with a stored reason and excluded from recommendations.

13. Repository Overview
Each repository page should provide:

Repository purpose
AI-generated project summary
Tech stack
Primary languages
Repository activity
Community information
Contribution friendliness
Open issues
Estimated onboarding difficulty
AI confidence score


14. Contribution Blueprint
The Contribution Blueprint is the platform's primary feature.
Instead of exposing raw prompts, it generates structured context that prepares the developer before coding.
The blueprint includes:

Why this repository was recommended
Recommended contribution opportunity
Confidence level
Estimated difficulty
Estimated effort
Learning objectives
Constraints
High-level implementation guidance
Suggested reading order
Final AI prompt for Google Jules

The Contribution Blueprint acts as the bridge between repository discovery and AI-assisted implementation.

Every completed Contribution Blueprint is versioned (containing version number, blueprint group ID, superseded blueprint ID, prompt version, and target commit SHA). Completing or regenerating a blueprint must never overwrite a completed version.

15. Contribution Prioritization Strategy
Recommendations should prioritize opportunities in the following order:

Existing Good First Issue
Existing Help Wanted issue
Suitable open issues matching user skill
Documentation improvements
Test coverage improvements
Accessibility improvements
Refactoring opportunities
AI-generated improvement ideas (only when confidence is high)

The system should avoid inventing unnecessary work when genuine issues already exist.

16. Personalization
The homepage should clearly explain:

Why repositories were recommended
Skills detected
Technologies identified
User strengths
Match percentage
Confidence level

Recommendations should feel personalized rather than generic.

17. Repository Analysis
Repository analysis begins only after the user opens a recommended repository.
The generated analysis is cached.
Repository analyses must be tied to a specific repository ID, default branch, commit SHA, and analysis version.
The cache is refreshed / invalidated when repository changes (new commits or default branch updates) make the existing analysis stale.
This balances freshness with computational efficiency.

18. Search
Users may:

Browse AI recommendations.
Search repositories manually.

AI recommendations remain the primary experience.

19. Saved History
Users should be able to:

View recent repositories.
Reopen previous Contribution Blueprints (all versions).
Save repositories for later exploration.

To avoid conflicting data and state synchronization issues (e.g. recommendation active vs. saved vs. viewed), a unified repository state tracker (one document per user and repository) must manage saves, views, and dismissed states.

20. AI Principles
Every AI-generated result must be:

Explainable
Actionable
Confidence-scored
Grounded in repository data
Transparent about uncertainty

The platform should avoid hallucinating contribution opportunities.

21. Edge Cases
The platform should gracefully handle:

Empty GitHub profiles (allow users to self-select skills, languages, frameworks, interests, and difficulty preferences, persisting them in a preferences store)
No matching repositories
Repository archived after analysis
Missing README
Unsupported repositories
Repository too large for analysis
AI unable to confidently generate recommendations
Rate limits
Cached analysis becoming outdated

Users should receive clear explanations instead of generic errors.

22. Out of Scope (MVP)
The MVP will not:

Write production code
Automatically commit changes
Automatically create pull requests
Automatically merge code
Replace Google Jules
Guarantee AI-generated suggestions are correct

Developers remain responsible for reviewing, testing, and submitting their work.

23. Product Principles
Every feature should support at least one of these principles:

Personalization
Transparency
Simplicity
AI with human oversight
Fast onboarding
Explainability
Practical developer value


24. Long-Term Vision
OpenScout.ai aims to become the default starting point for developers entering open source.
Rather than searching endlessly for projects and manually understanding unfamiliar repositories, developers receive intelligent recommendations, contextual onboarding, and a structured Contribution Blueprint that prepares them to contribute confidently using AI while remaining fully in control of the final code.

North Star Statement

Help every developer discover the right open-source project and become ready to contribute in minutes, not hours.


25. Data Retention & Deletion Policy
A clean production environment requires explicit retention limits:
- User accounts and associated data must be deleted cascadingly upon request.
- OAuth connections must be disconnected and credentials purged when requested by the user.
- AI observability logs (token usage, latency, provider data) must be auto-purged after 30 days.
- Developer profile analysis logs and temporary run caches are pruned after 30 days.
- Audit logs should be kept for at least 1 year for compliance.
- Inactive background job logs should be cleaned up after 7 days.

26. Durable Background Job Model
To support frontend polling and worker recovery during long-running async steps (profile analysis, repository crawling, blueprint generation), the system must use a durable background job state model tracking status, attempt counts, leases, timeouts, idempotency keys, and dead-letter states.

27. Security and OAuth Connection Isolation
User access credentials (such as GitHub OAuth tokens) must not be stored on the main user record. They must reside in a separate, encrypted collection with strict access scopes, reducing security impact if a user document is exposed.

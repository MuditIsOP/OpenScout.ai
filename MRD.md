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


9. User Journey
GitHub Login
        │
        ▼
Analyze Developer Profile
        │
        ▼
Generate Personalized Recommendations
        │
        ▼
User Opens Repository
        │
        ▼
Live Repository Analysis
        │
        ▼
Generate Contribution Blueprint
        │
        ▼
Launch Google Jules
        │
        ▼
Developer Reviews AI Output
        │
        ▼
Continue Open-Source Contribution


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

11. Repository Recommendation Engine
Recommendations should consider multiple factors, including:

Programming language similarity
Framework similarity
Repository domain
Repository health
Recent activity
Contributor activity
Beginner friendliness
Repository size
Documentation quality
Issue quality
Maintainer responsiveness
Open contribution opportunities
Estimated difficulty
User experience level

Every recommendation must include a human-readable explanation describing why it was selected.

12. Repository Eligibility
Repositories considered for recommendation should satisfy quality thresholds such as:

Public repository
Active development
Not archived
Not a fork
Valid open-source license
README available
Healthy contribution history
Sufficient community activity
Meaningful contribution opportunities

Repositories failing these thresholds should not be recommended.

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
The cache is refreshed when repository changes invalidate previous analysis.
This balances freshness with computational efficiency.

18. Search
Users may:

Browse AI recommendations.
Search repositories manually.

AI recommendations remain the primary experience.

19. Saved History
Users should be able to:

View recent repositories.
Reopen previous Contribution Blueprints.
Save repositories for later exploration.


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

Empty GitHub profiles
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


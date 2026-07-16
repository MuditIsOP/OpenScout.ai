# OpenScout.ai Database Schema Specifications

This document defines the schema for the 17 production database collections required by OpenScout.ai. It provides a production-ready SQL DDL specification to guarantee strict data types, nullability, relationships, constraints, and indexes. 

---

## Final Collection List

The schema is divided into 17 collections/tables:
1. **`users`**: Core user record.
2. **`oauth_connections`**: Encrypted OAuth access and refresh credentials.
3. **`user_preferences`**: Developer preferences and fallback survey inputs.
4. **`profile_snapshots`**: Immutable snapshots of source evidence for skills.
5. **`developer_profiles`**: AI-inferred developer skill profile.
6. **`repositories`**: Evaluated open-source repository metadata.
7. **`repository_analyses`**: Commit-SHA specific AI-generated repository summaries.
8. **`contribution_opportunities`**: Tiered opportunities (GitHub issues and AI suggestions).
9. **`recommendation_runs`**: Parameterized runs used to generate recommendation batches.
10. **`recommendations`**: Individual recommendations linked to a recommendation run.
11. **`user_repository_states`**: Unified states (saved, viewed, dismissed, completed).
12. **`blueprints`**: Versioned, non-overwriting Contribution Blueprints.
13. **`handoff_events`**: Analytics and tracking for Jules handoffs.
14. **`background_jobs`**: Durable, retriable task queue.
15. **`ai_runs`**: Observability, token counting, and cost metrics for LLM queries.
16. **`analytics_events`**: User behavior metrics and KPI funnels.
17. **`audit_logs`**: Compliance and security log tracking.

---

## SQL DDL Schema

```sql
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. users
-- -------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    github_id VARCHAR(255) NOT NULL UNIQUE,
    github_username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_github_id ON users(github_id);

-- -------------------------------------------------------------
-- 2. oauth_connections
-- -------------------------------------------------------------
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'github',
    access_token TEXT NOT NULL, -- Encrypted at rest
    refresh_token TEXT,          -- Encrypted at rest
    scopes VARCHAR(100)[] NOT NULL DEFAULT '{}',
    token_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, revoked, expired
    key_rotation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- last_rotated, next_rotation_due
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_oauth_connections_user ON oauth_connections(user_id);

-- -------------------------------------------------------------
-- 3. user_preferences
-- -------------------------------------------------------------
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    skills VARCHAR(100)[] NOT NULL DEFAULT '{}',
    languages VARCHAR(100)[] NOT NULL DEFAULT '{}',
    frameworks VARCHAR(100)[] NOT NULL DEFAULT '{}',
    interests VARCHAR(100)[] NOT NULL DEFAULT '{}',
    contribution_preferences VARCHAR(100)[] NOT NULL DEFAULT '{}',
    difficulty_preference VARCHAR(50) NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced
    jules_api_key TEXT, -- Encrypted at rest
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 4. developer_profiles
-- -------------------------------------------------------------
CREATE TABLE developer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    experience_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced
    experience_confidence NUMERIC(3, 2) NOT NULL, -- 0.00 to 1.00
    contribution_history_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    project_domains VARCHAR(100)[] NOT NULL DEFAULT '{}',
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    analysis_version VARCHAR(50) NOT NULL DEFAULT 'v1'
);

-- -------------------------------------------------------------
-- 5. profile_snapshots
-- -------------------------------------------------------------
CREATE TABLE profile_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    developer_profile_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    inferred_skills JSONB NOT NULL, -- Detailed languages, weights, confidence
    source_evidence JSONB NOT NULL, -- The specific commit frequencies, PR links, repositories analyzed
    scoring_rationale TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profile_snapshots_user ON profile_snapshots(user_id);

-- -------------------------------------------------------------
-- 6. repositories
-- -------------------------------------------------------------
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_repo_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    primary_language VARCHAR(100),
    topics VARCHAR(100)[] NOT NULL DEFAULT '{}',
    stars INTEGER NOT NULL DEFAULT 0,
    forks INTEGER NOT NULL DEFAULT 0,
    open_issues_count INTEGER NOT NULL DEFAULT 0,
    last_commit_at TIMESTAMP WITH TIME ZONE,
    license VARCHAR(100),
    is_fork BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    health_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    beginner_friendly_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    doc_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    size_kb INTEGER NOT NULL DEFAULT 0,
    eligibility_status VARCHAR(50) NOT NULL DEFAULT 'eligible', -- eligible, ineligible
    eligibility_reasons TEXT[] NOT NULL DEFAULT '{}',
    cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repositories_eligibility ON repositories(eligibility_status);
CREATE INDEX idx_repositories_primary_language ON repositories(primary_language);

-- -------------------------------------------------------------
-- 7. repository_analyses
-- -------------------------------------------------------------
CREATE TABLE repository_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    default_branch VARCHAR(255) NOT NULL,
    commit_sha VARCHAR(40) NOT NULL,
    analysis_version VARCHAR(50) NOT NULL,
    summary_text TEXT NOT NULL,
    tech_stack VARCHAR(100)[] NOT NULL DEFAULT '{}',
    activity_summary TEXT,
    community_summary TEXT,
    contribution_friendliness_score NUMERIC(5, 2) NOT NULL,
    onboarding_difficulty VARCHAR(50) NOT NULL, -- easy, moderate, hard
    confidence_score NUMERIC(3, 2) NOT NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cache_invalidated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_repo_commit_version UNIQUE (repository_id, commit_sha, analysis_version)
);

CREATE INDEX idx_repository_analyses_lookup ON repository_analyses(repository_id, commit_sha, analysis_version);

-- -------------------------------------------------------------
-- 8. contribution_opportunities
-- -------------------------------------------------------------
CREATE TABLE contribution_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    repository_commit_sha VARCHAR(40) NOT NULL,
    tier INTEGER NOT NULL, -- 1 to 8
    source_type VARCHAR(50) NOT NULL, -- github_issue, ai_generated
    github_issue_number INTEGER,
    github_issue_url TEXT,
    current_issue_state VARCHAR(50), -- open, closed
    assignees VARCHAR(255)[] NOT NULL DEFAULT '{}',
    linked_pull_requests TEXT[] NOT NULL DEFAULT '{}',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score NUMERIC(3, 2), -- required for tier 8
    estimated_difficulty VARCHAR(50) NOT NULL, -- easy, moderate, hard
    last_issue_activity TIMESTAMP WITH TIME ZONE,
    last_verification_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_time TIMESTAMP WITH TIME ZONE,
    relevant_verified_file_paths TEXT[] NOT NULL DEFAULT '{}',
    is_possibly_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunities_repo ON contribution_opportunities(repository_id);
CREATE INDEX idx_opportunities_tier ON contribution_opportunities(tier);
CREATE INDEX idx_opportunities_lookup ON contribution_opportunities(repository_id, tier, current_issue_state);

-- -------------------------------------------------------------
-- 9. recommendation_runs
-- -------------------------------------------------------------
CREATE TABLE recommendation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_snapshot_id UUID NOT NULL REFERENCES profile_snapshots(id) ON DELETE CASCADE,
    scoring_algorithm_version VARCHAR(50) NOT NULL,
    filters_applied JSONB NOT NULL DEFAULT '{}'::jsonb,
    candidates_evaluated_count INTEGER NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reco_runs_user ON recommendation_runs(user_id);

-- -------------------------------------------------------------
-- 10. recommendations
-- -------------------------------------------------------------
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_run_id UUID NOT NULL REFERENCES recommendation_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) NOT NULL,
    confidence_score NUMERIC(3, 2) NOT NULL,
    reasons TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_run_repo UNIQUE (recommendation_run_id, repository_id)
);

CREATE INDEX idx_recommendations_lookup ON recommendations(user_id, match_score DESC);
CREATE INDEX idx_recommendations_run ON recommendations(recommendation_run_id);

-- -------------------------------------------------------------
-- 11. user_repository_states
-- -------------------------------------------------------------
CREATE TABLE user_repository_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,
    saved_at TIMESTAMP WITH TIME ZONE,
    is_viewed BOOLEAN NOT NULL DEFAULT FALSE,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    recommendation_state VARCHAR(50) NOT NULL DEFAULT 'active', -- active, dismissed, completed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_repo UNIQUE (user_id, repository_id)
);

CREATE INDEX idx_user_repo_states_saved ON user_repository_states(user_id) WHERE is_saved = TRUE;
CREATE INDEX idx_user_repo_states_viewed ON user_repository_states(user_id, last_viewed_at DESC) WHERE is_viewed = TRUE;

-- -------------------------------------------------------------
-- 12. blueprints
-- -------------------------------------------------------------
CREATE TABLE blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_group_id UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    supersedes_blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    repository_commit_sha VARCHAR(40) NOT NULL,
    opportunity_id UUID NOT NULL REFERENCES contribution_opportunities(id) ON DELETE CASCADE,
    prompt_version VARCHAR(50) NOT NULL,
    output_schema_version VARCHAR(50) NOT NULL,
    repository_understanding TEXT NOT NULL,
    match_explanation TEXT NOT NULL,
    confidence_level NUMERIC(3, 2) NOT NULL,
    estimated_difficulty VARCHAR(50) NOT NULL, -- easy, moderate, hard
    estimated_effort VARCHAR(100) NOT NULL,    -- e.g. "2-4 hours"
    learning_objectives TEXT[] NOT NULL DEFAULT '{}',
    constraints TEXT[] NOT NULL DEFAULT '{}',
    suggested_reading_order JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {file, reason}
    implementation_strategy TEXT NOT NULL,
    final_jules_prompt TEXT NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'generating', -- generating, complete, failed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_group_version UNIQUE (blueprint_group_id, version)
);

CREATE INDEX idx_blueprints_user ON blueprints(user_id);
CREATE INDEX idx_blueprints_lookup ON blueprints(blueprint_group_id, version DESC);

-- -------------------------------------------------------------
-- 13. handoff_events
-- -------------------------------------------------------------
CREATE TABLE handoff_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL, -- api, copy
    jules_session_id VARCHAR(255),
    jules_session_url TEXT,
    error_reason VARCHAR(255), -- api_key_missing, repo_not_connected, api_error, none
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_handoffs_blueprint ON handoff_events(blueprint_id);

-- -------------------------------------------------------------
-- 14. background_jobs
-- -------------------------------------------------------------
CREATE TABLE background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL, -- profile_analysis, repo_analysis, opportunity_discovery, blueprint_generation
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, running, completed, failed, dead_letter
    retries INTEGER NOT NULL DEFAULT 3,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    worker_lease VARCHAR(255),
    timeout INTEGER NOT NULL, -- in seconds
    dead_letter_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status_retry ON background_jobs(status, created_at) WHERE status IN ('queued', 'failed');
CREATE INDEX idx_jobs_idempotency ON background_jobs(idempotency_key);

-- -------------------------------------------------------------
-- 15. ai_runs
-- -------------------------------------------------------------
CREATE TABLE ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(100) NOT NULL, -- gemini, openai
    model VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    output_schema_version VARCHAR(50) NOT NULL,
    token_usage JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"input_tokens": 12, "output_tokens": 34}
    latency_ms INTEGER NOT NULL,
    validation_failure BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_provider_usage BOOLEAN NOT NULL DEFAULT FALSE,
    grounding_evidence_hash VARCHAR(64),
    estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_runs_perf ON ai_runs(provider, model, latency_ms);

-- -------------------------------------------------------------
-- 16. analytics_events
-- -------------------------------------------------------------
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_funnel ON analytics_events(event_name, created_at);

-- -------------------------------------------------------------
-- 17. audit_logs
-- -------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_lookup ON audit_logs(user_id, action, created_at);

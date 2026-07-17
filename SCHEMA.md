# OpenScout.ai MongoDB Schema Specifications

This document defines the schema for the 17 production database collections required by OpenScout.ai. It provides a production-ready document-oriented MongoDB specification to guarantee strict data types, indexes, and logical constraints using MongoDB JSON Schema validators.

---

## Architecture Context

To align with a document-oriented architecture, MongoDB Atlas is the canonical database. 
- Relations are modeled using `ObjectId` references.
- Flexible JSON structures (such as LLM evidence, skill breakdowns, blueprint strategies, and token counters) are nested directly within parent documents.
- Strict validation is enforced via MongoDB collection validation schemas.
- Unique constraints are guaranteed through unique indexes.

---

## Phase Separation

The 17 collections are separated by implementation phase:

### Phase 1 Core Collections (11 Collections)
1. **`users`**: Core user records synchronized from Clerk.
2. **`oauth_connections`**: Encrypted OAuth access and refresh credentials.
3. **`user_preferences`**: Developer preferences and fallback manual survey inputs.
4. **`developer_profiles`**: Current AI-inferred developer skill profiles.
5. **`profile_snapshots`**: Immutable snapshots of source evidence for skills.
6. **`repositories`**: Evaluated open-source repository metadata and eligibility status.
7. **`recommendation_runs`**: Parameterized runs used to generate recommendation batches.
8. **`recommendations`**: Individual recommendations linked to a run.
9. **`background_jobs`**: Durable task queue for async jobs.
10. **`ai_runs`**: Observability, token counting, and cost metrics for LLM queries.
11. **`analytics_events`**: User behavior metrics and KPI funnels.

### Phase 2 & 3 Deferred Collections (6 Collections)
12. **`repository_analyses`**: [Phase 2] AI-generated repository summaries.
13. **`contribution_opportunities`**: [Phase 2] Prioritized issues (Tiers 1-8).
14. **`user_repository_states`**: [Phase 2] Saved, viewed, and dismissed repository tracking states.
15. **`blueprints`**: [Phase 3] Versioned, non-overwriting Contribution Blueprints.
16. **`handoff_events`**: [Phase 3] Tracking for Google Jules handoffs.
17. **`audit_logs`**: [Phase 2/3] Compliance and security log tracking.

---

## MongoDB Collections & Schema Definitions

### Phase 1 Core Collections

#### 1. `users`
Core user record, created/updated via Clerk OAuth sync webhooks.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `clerk_id` (`String`): Clerk's unique user identifier.
  * `github_id` (`String`): GitHub's unique user identifier.
  * `github_username` (`String`): GitHub username.
  * `avatar_url` (`String`): URL of the user's GitHub avatar.
  * `current_profile_job_id` (`ObjectId`, optional): Reference to the active profile analysis job.
  * `profile_analysis_status` (`String`): Onboarding job status (`queued`, `in_progress`, `complete`, `failed`).
  * `created_at` (`Date`): Creation timestamp.
  * `last_login_at` (`Date`): Timestamp of the last sign-in.
* **Indexes:**
  * Unique index on `clerk_id`
  * Unique index on `github_id`

#### 2. `oauth_connections`
Encrypted GitHub OAuth credentials linked to the user.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `provider` (`String`): Auth provider, defaults to `"github"`.
  * `access_token` (`String`): Encrypted OAuth access token.
  * `refresh_token` (`String`, optional): Encrypted OAuth refresh token.
  * `scopes` (`Array` of `String`): List of granted scopes (e.g., `["read:user", "public_repo"]`).
  * `token_status` (`String`): Status of the token (`"active"`, `"revoked"`, `"expired"`).
  * `key_rotation_metadata` (`Document`): Contains rotation timestamps (`last_rotated`, `next_rotation_due`).
  * `created_at` (`Date`): Creation timestamp.
  * `updated_at` (`Date`): Update timestamp.
* **Indexes:**
  * Unique compound index on `{ user_id: 1, provider: 1 }`

#### 3. `user_preferences`
Fallback survey inputs and settings.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `skills` (`Array` of `String`): Self-selected skills.
  * `languages` (`Array` of `String`): Target programming languages.
  * `frameworks` (`Array` of `String`): Preferred frameworks.
  * `interests` (`Array` of `String`): Open source domains of interest.
  * `difficulty_preference` (`String`): Preferred difficulty level (`"beginner"`, `"intermediate"`, `"advanced"`).
  * `jules_api_key` (`String`, optional): Encrypted Google Jules API key (deferred).
  * `created_at` (`Date`): Creation timestamp.
  * `updated_at` (`Date`): Update timestamp.
* **Indexes:**
  * Unique index on `user_id`

#### 4. `developer_profiles`
AI-inferred developer skill profiles blending GitHub evidence and manual fallback preferences.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `experience_level` (`String`): Inferred level (`"beginner"`, `"intermediate"`, `"advanced"`).
  * `experience_confidence` (`Double`): Confidence score between `0.00` and `1.00`.
  * `primary_languages` (`Array` of `String`): Inferred primary languages.
  * `frameworks` (`Array` of `String`): Inferred frameworks.
  * `skills` (`Array` of `String`): Combined inferred and manual skills.
  * `interests` (`Array` of `String`): Combined domains of interest.
  * `contribution_history_summary` (`Document`): Textual summary of past contributions and activities.
  * `project_domains` (`Array` of `String`): Inferred domains (e.g., frontend, CLI, machine learning).
  * `last_analyzed_at` (`Date`): Timestamp of the last profile analysis.
  * `analysis_version` (`String`): Schema/prompt version for profile parsing.
* **Indexes:**
  * Unique index on `user_id`

#### 5. `profile_snapshots`
Immutable log of evidence parsed during profile analysis runs.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `developer_profile_id` (`ObjectId`): Reference to `developer_profiles._id`.
  * `inferred_skills` (`Document`): Detailed breakdown of skill categories with weights and confidence levels.
  * `source_evidence` (`Document`): Evidence dictionary containing commit frequencies, PR links, and repos analyzed.
  * `scoring_rationale` (`String`): Human-readable logic explaining the inferred classification.
  * `created_at` (`Date`): Generation timestamp.
* **Indexes:**
  * Index on `{ user_id: 1, created_at: -1 }`

#### 6. `repositories`
Local cache of evaluated open-source repositories dynamically queried from GitHub Search.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `github_repo_id` (`Int64`): Unique GitHub repository ID.
  * `full_name` (`String`): Unique full path (e.g., `"facebook/react"`).
  * `description` (`String`, optional): Repository description.
  * `primary_language` (`String`): Primary coding language.
  * `topics` (`Array` of `String`): Repository topics and tags.
  * `stars` (`Int`): Star count.
  * `forks` (`Int`): Fork count.
  * `open_issues_count` (`Int`): Count of open GitHub issues.
  * `last_commit_at` (`Date`): Last commit date (`pushed_at`).
  * `license` (`String`, optional): License name (e.g., `"MIT"`).
  * `is_fork` (`Boolean`): Whether the repository is a fork.
  * `is_archived` (`Boolean`): Whether the repository is archived.
  * `health_score` (`Double`): Computed health score (0-100).
  * `beginner_friendly_score` (`Double`): Computed beginner friendliness score (0-100).
  * `doc_quality_score` (`Double`): Computed documentation quality score (0-100).
  * `size_kb` (`Int`): Bounded codebase size.
  * `has_readme` (`Boolean`): Whether a README is present.
  * `contributors_count` (`Int`): Total contributor count.
  * `recent_contributors_count` (`Int`): Count of active contributors in the last 90 days.
  * `good_first_issue_count` (`Int`): Active Good First Issue count.
  * `help_wanted_issue_count` (`Int`): Active Help Wanted issue count.
  * `eligibility_status` (`String`): Status (`"eligible"`, `"ineligible"`).
  * `eligibility_reasons` (`Array` of `String`): Reasons for eligibility/ineligibility status.
  * `cached_at` (`Date`): Cache timestamp.
* **Indexes:**
  * Unique index on `github_repo_id`
  * Unique index on `full_name`
  * Index on `{ eligibility_status: 1, primary_language: 1 }`

#### 7. `recommendation_runs`
Log of matching runs triggered by users.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `profile_snapshot_id` (`ObjectId`): Reference to `profile_snapshots._id`.
  * `scoring_algorithm_version` (`String`): Version of the matching weights used.
  * `filters_applied` (`Document`): Dictionary of filters selected (e.g., language, difficulty).
  * `candidates_evaluated_count` (`Int`): Count of repository candidates evaluated.
  * `idempotency_key` (`String`): Unique key generated per client request to prevent duplicate runs.
  * `created_at` (`Date`): Generation timestamp.
* **Indexes:**
  * Unique index on `idempotency_key`
  * Index on `{ user_id: 1, created_at: -1 }`

#### 8. `recommendations`
Individual repository recommendations belonging to a run.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `recommendation_run_id` (`ObjectId`): Reference to `recommendation_runs._id`.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `repository_id` (`ObjectId`): Reference to `repositories._id`.
  * `match_score` (`Double`): Match percentage (0.00 to 100.00).
  * `confidence_score` (`Double`): Recommendation confidence (0.00 to 1.00).
  * `reasons` (`Array` of `String`): Bullet points explaining the match.
  * `created_at` (`Date`): Generation timestamp.
* **Indexes:**
  * Index on `{ recommendation_run_id: 1, match_score: -1 }`
  * Unique compound index on `{ recommendation_run_id: 1, repository_id: 1 }`

#### 9. `background_jobs`
Durable background job storage to poll progress and recover tasks.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `job_type` (`String`): Type (`"profile_analysis"`, `"recommendation_generation"`, `"repo_analysis"`, `"blueprint_generation"`).
  * `status` (`String`): Status (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"dead_letter"`).
  * `retries` (`Int`): Max retries, defaults to `3`.
  * `attempt_count` (`Int`): Active retry attempts.
  * `idempotency_key` (`String`): Prevent duplicate job creation.
  * `worker_lease` (`String`, optional): Identifier of the worker thread executing the job.
  * `timeout` (`Int`): Max execution seconds before lease expiration.
  * `dead_letter_state` (`Document`): Diagnostics details on persistent failures.
  * `payload` (`Document`): Input data required for job processing.
  * `created_at` (`Date`): Queued timestamp.
  * `updated_at` (`Date`): State transition timestamp.
* **Indexes:**
  * Unique index on `idempotency_key`
  * Index on `{ status: 1, created_at: 1 }`

#### 10. `ai_runs`
Token tracking and audit logs for LLM cost/observability.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `provider` (`String`): Provider name (`"gemini"`).
  * `model` (`String`): Model name (`"gemini-1.5-flash"`).
  * `prompt_version` (`String`): Version of system prompt used.
  * `output_schema_version` (`String`): Version of schema verified.
  * `token_usage` (`Document`): `{ input_tokens: Int, output_tokens: Int }`.
  * `latency_ms` (`Int`): API latency in milliseconds.
  * `validation_failure` (`Boolean`): Struct output parsing failure.
  * `fallback_provider_usage` (`Boolean`): Fallback mechanism indicator.
  * `grounding_evidence_hash` (`String`): SHA-256 hash of context inputs for security and deduplication.
  * `estimated_cost` (`Double`): Calculated pricing.
  * `created_at` (`Date`): Generation timestamp.
* **Indexes:**
  * Index on `{ provider: 1, model: 1, created_at: -1 }`

#### 11. `analytics_events`
KPI funnel tracking.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`, optional): Reference to `users._id`.
  * `event_name` (`String`): Analytics action (`"auth_login_succeeded"`, `"profile_analysis_completed"`, `"recommendation_run_started"`, etc.).
  * `payload` (`Document`): Detailed context parameters.
  * `created_at` (`Date`): Trigger timestamp.
* **Indexes:**
  * Index on `{ event_name: 1, created_at: -1 }`

---

### Phase 2 & 3 Deferred Collections

#### 12. `repository_analyses` [Phase 2]
AI codebase summaries generated on repository open.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `repository_id` (`ObjectId`): Reference to `repositories._id`.
  * `default_branch` (`String`): Branch name (e.g., `"main"`).
  * `commit_sha` (`String`): Target Git SHA (40 chars).
  * `analysis_version` (`String`): Prompts/schemas analyzer version.
  * `summary_text` (`String`): AI-generated explanation.
  * `tech_stack` (`Array` of `String`): Detected frameworks/libraries.
  * `activity_summary` (`String`): Summary of commit frequency.
  * `community_summary` (`String`): PR review and issues overview.
  * `contribution_friendliness_score` (`Double`): Score (0-100).
  * `onboarding_difficulty` (`String`): Difficulty (`"easy"`, `"moderate"`, `"hard"`).
  * `confidence_score` (`Double`): LLM confidence (0.00 to 1.00).
  * `analyzed_at` (`Date`): Analysis timestamp.
  * `cache_invalidated_at` (`Date`, optional): Eviction timestamp.
* **Indexes:**
  * Unique compound index on `{ repository_id: 1, commit_sha: 1, analysis_version: 1 }`

#### 13. `contribution_opportunities` [Phase 2]
GitHub issues and AI-generated opportunities grouped into Tiers 1-8.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `repository_id` (`ObjectId`): Reference to `repositories._id`.
  * `repository_commit_sha` (`String`): Target Git SHA (40 chars).
  * `tier` (`Int`): Priority tier index (1 to 8).
  * `source_type` (`String`): Source indicator (`"github_issue"`, `"ai_generated"`).
  * `github_issue_number` (`Int`, optional): GitHub issue number.
  * `github_issue_url` (`String`, optional): Link to GitHub.
  * `current_issue_state` (`String`, optional): `"open"` or `"closed"`.
  * `assignees` (`Array` of `String`): Assigned handles.
  * `linked_pull_requests` (`Array` of `String`): Related PRs.
  * `title` (`String`): Issue title.
  * `description` (`String`): Detailed task requirements.
  * `confidence_score` (`Double`, optional): Required for tier 8 AI suggestions.
  * `estimated_difficulty` (`String`): Difficulty rating (`"easy"`, `"moderate"`, `"hard"`).
  * `last_issue_activity` (`Date`, optional): GitHub updated_at.
  * `last_verification_time` (`Date`): Last checked timestamp.
  * `expiration_time` (`Date`, optional): Cleanup TTL.
  * `relevant_verified_file_paths` (`Array` of `String`): Target code files.
  * `is_possibly_claimed` (`Boolean`): Assignee/comment heuristics.
  * `created_at` (`Date`): Creation timestamp.
* **Indexes:**
  * Index on `{ repository_id: 1, tier: 1, current_issue_state: 1 }`

#### 14. `user_repository_states` [Phase 2]
Tracks user engagement, saves, and dismissals for clean dashboard rendering.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `repository_id` (`ObjectId`): Reference to `repositories._id`.
  * `is_saved` (`Boolean`): Save state indicator.
  * `saved_at` (`Date`, optional): Timestamp of save.
  * `is_viewed` (`Boolean`): View state indicator.
  * `last_viewed_at` (`Date`, optional): Timestamp of last click.
  * `recommendation_state` (`String`): Active visibility state (`"active"`, `"dismissed"`, `"completed"`).
  * `created_at` (`Date`): Creation timestamp.
  * `updated_at` (`Date`): Modify timestamp.
* **Indexes:**
  * Unique compound index on `{ user_id: 1, repository_id: 1 }`
  * Index on `{ user_id: 1, is_saved: 1 }`
  * Index on `{ user_id: 1, last_viewed_at: -1 }`

#### 15. `blueprints` [Phase 3]
Versioned, immutable contribution blueprints.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `blueprint_group_id` (`ObjectId`): Group UUID for tracking version chains.
  * `version` (`Int`): Auto-incrementing version number.
  * `supersedes_blueprint_id` (`ObjectId`, optional): Reference to `blueprints._id`.
  * `user_id` (`ObjectId`): Reference to `users._id`.
  * `repository_id` (`ObjectId`): Reference to `repositories._id`.
  * `repository_commit_sha` (`String`): Commit SHA of target codebase state.
  * `opportunity_id` (`ObjectId`): Reference to `contribution_opportunities._id`.
  * `prompt_version` (`String`): Version of system blueprint generator prompt.
  * `output_schema_version` (`String`): Schema tracking key.
  * `repository_understanding` (`String`): Summary of architecture files.
  * `match_explanation` (`String`): Why user fits this task.
  * `confidence_level` (`Double`): Accuracy confidence (0.00 to 1.00).
  * `estimated_difficulty` (`String`): Difficulty rating (`"easy"`, `"moderate"`, `"hard"`).
  * `estimated_effort` (`String`): Effort scale (e.g., `"2-4 hours"`).
  * `learning_objectives` (`Array` of `String`): Focus areas.
  * `constraints` (`Array` of `String`): Project styling/architecture constraints.
  * `suggested_reading_order` (`Array` of `Document`): List of `{ file: String, reason: String }`.
  * `implementation_strategy` (`String`): Multi-step instruction plan.
  * `final_jules_prompt` (`String`): Packaged context for Google Jules.
  * `idempotency_key` (`String`): Prevent duplicate blueprint jobs.
  * `status` (`String`): Status (`"generating"`, `"complete"`, `"failed"`).
  * `created_at` (`Date`): Generation timestamp.
* **Indexes:**
  * Unique compound index on `{ blueprint_group_id: 1, version: 1 }`
  * Unique index on `idempotency_key`
  * Index on `{ user_id: 1, created_at: -1 }`

#### 16. `handoff_events` [Phase 3]
Tracks transitions to Google Jules sessions.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `blueprint_id` (`ObjectId`): Reference to `blueprints._id`.
  * `method` (`String`): Session creation path (`"api"`, `"copy"`).
  * `jules_session_id` (`String`, optional): Target session ID on Jules.
  * `jules_session_url` (`String`, optional): Deep link to Jules UI.
  * `error_reason` (`String`, optional): Fallback reasons (`"api_key_missing"`, `"api_error"`, etc.).
  * `idempotency_key` (`String`): Prevent duplicate logging.
  * `initiated_at` (`Date`): Handoff timestamp.
* **Indexes:**
  * Unique index on `idempotency_key`
  * Index on `blueprint_id`

#### 17. `audit_logs` [Phase 2/3]
Auditing security and account changes.
* **Fields:**
  * `_id` (`ObjectId`): Primary key.
  * `user_id` (`ObjectId`, optional): Reference to `users._id`.
  * `action` (`String`): Action keyword (e.g., `"oauth_revoke"`, `"account_delete"`).
  * `resource_type` (`String`): Affected collection name.
  * `resource_id` (`String`): Stringified identifier.
  * `ip_address` (`String`): Request IP (IPv4/IPv6).
  * `user_agent` (`String`): Request browser string.
  * `payload` (`Document`): Supplementary auditing parameters.
  * `created_at` (`Date`): Action timestamp.
* **Indexes:**
  * Index on `{ user_id: 1, action: 1, created_at: -1 }`

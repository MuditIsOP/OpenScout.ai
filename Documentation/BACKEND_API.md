# OpenScout.ai Backend API Reference

This document outlines the API contracts for the Phase 1 MVP backend. All endpoints are hosted on the FastAPI backend (default port `8000`).

## Base URL
`http://localhost:8000` (Local Development)

## Authentication
All endpoints (except `/health` and `/api/auth/webhook/clerk`) require a valid Clerk JWT passed in the `Authorization` header.

```http
Authorization: Bearer <clerk_jwt_token>
```

---

## 1. Auth & User

### `GET /api/auth/me`
Retrieves the currently authenticated user's profile and database metadata.

* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "user_id": "64b1f...",
  "clerk_id": "user_2...",
  "github_username": "mudit8sharma",
  "avatar_url": "https://...",
  "profile_analysis_status": "complete", // "pending", "queued", "running", "complete", "failed"
  "created_at": "2026-07-17T12:00:00Z",
  "last_login_at": "2026-07-17T12:00:00Z"
}
```

---

## 2. Profile Analysis

### `POST /api/profile/analyze`
Triggers an asynchronous background job to analyze the user's GitHub profile. 
**Note:** The Clerk webhook automatically triggers this when a user first signs up. You only need to call this to manually re-analyze.

* **Headers**: `Authorization: Bearer <token>`
* **Response (202 Accepted)**:
```json
{
  "job_id": "64b2a...",
  "status": "queued"
}
```

### `GET /api/profile/me`
Retrieves the parsed skills, languages, and experience level of the current user.

* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "experience_level": "intermediate",
  "experience_confidence": 0.8,
  "primary_languages": ["Python", "TypeScript", "JavaScript"],
  "frameworks": ["react", "fastapi"],
  "skills": ["Git", "Open Source"],
  "interests": ["machine-learning", "automation"],
  "profile_analysis_status": "complete",
  "last_analyzed_at": "2026-07-17T12:05:00Z"
}
```

### `PUT /api/profile/preferences`
Allows the user to manually override or set onboarding preferences (especially if they have an empty GitHub profile).

* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "skills": ["React", "FastAPI"],
  "languages": ["TypeScript", "Python"],
  "frameworks": ["Next.js", "Vue"],
  "interests": ["AI", "Web3"],
  "difficulty_preference": "beginner" // Enum: "beginner", "intermediate", "advanced"
}
```
* **Response (200 OK)**:
```json
{
  "message": "Preferences saved successfully",
  "user_id": "user_2..."
}
```

---

## 3. Recommendations

### `POST /api/recommendations/generate`
Triggers an asynchronous background job to find, score, and rank repositories for the user. Requires `profile_analysis_status` to be `"complete"`.

* **Headers**: `Authorization: Bearer <token>`
* **Response (202 Accepted)**:
```json
{
  "job_id": "64b3c...",
  "recommendation_run_id": "64b3d...",
  "status": "queued"
}
```

### `GET /api/recommendations`
Retrieves the **latest successfully completed** recommendation run.

* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "run_id": "64b3d...",
  "created_at": "2026-07-17T12:10:00Z",
  "recommendations": [
    {
      "repository_id": "64b5e...",
      "full_name": "calcom/cal.com",
      "description": "Scheduling infrastructure for absolutely everyone.",
      "primary_language": "TypeScript",
      "stars": 24000,
      "match_score": 92.5,
      "confidence_score": 0.9,
      "reasons": [
        "Perfect language fit: Core is written in TypeScript.",
        "Framework match: Uses React, matching your skills.",
        "Beginner friendly: Surface level issues are active."
      ],
      "difficulty_badge": "beginner-friendly"
    }
  ]
}
```

### `POST /api/recommendations/feedback`
Submit user feedback (swiping logic) on a specific recommended repository.

* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "repository_id": "64b5e...",
  "signal": "saved" // Enum: "saved", "dismissed", "not_interested"
}
```
* **Response (200 OK)**:
```json
{
  "message": "Feedback recorded"
}
```

---

## 4. Dashboard

### `GET /api/dashboard`
Aggregated endpoint optimized for the home screen. Returns user data, profile summary, the latest active recommendations, and counters in a single network request.

* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "user": {
    "github_username": "mudit8sharma",
    "avatar_url": "https://...",
    "profile_analysis_status": "complete"
  },
  "profile_summary": {
    "experience_level": "intermediate",
    "primary_languages": ["Python", "TypeScript"],
    "frameworks": ["react"],
    "skills": ["Git"],
    "last_analyzed_at": "2026-07-17T12:05:00Z"
  },
  "recommendations": [
    {
      "repository_id": "64b5e...",
      "full_name": "calcom/cal.com",
      "description": "Scheduling...",
      "primary_language": "TypeScript",
      "stars": 24000,
      "match_score": 92.5,
      "confidence_score": 0.9,
      "reasons": ["..."],
      "difficulty_badge": "beginner-friendly"
    }
  ],
  "recent_activity": {
    "saved_count": 5,
    "blueprints_count": 0
  }
}
```

---

## 5. Background Jobs

### `GET /api/jobs/{job_id}`
Poll the status of an asynchronous job (like profile analysis or recommendation generation) returned by a `202 Accepted` endpoint.

* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "job_id": "64b2a...",
  "job_type": "profile_analysis",
  "status": "running", // "queued", "running", "completed", "failed"
  "attempt_count": 0,
  "created_at": "2026-07-17T12:05:00Z",
  "updated_at": "2026-07-17T12:05:05Z"
}
```

---

## 6. Utilities

### `GET /health`
Public healthcheck endpoint.

* **Headers**: None required.
* **Response (200 OK)**:
```json
{
  "status": "ok",
  "message": "OpenScout.ai API is running."
}
```

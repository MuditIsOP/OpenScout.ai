# OpenScout.ai

> **Reduce open-source onboarding from hours to minutes.**

OpenScout.ai is an AI-powered onboarding platform that sits between GitHub (where code lives) and Google Jules (where code gets written). It helps developers discover the right open-source repositories to contribute to, generates actionable Contribution Blueprints, and hands off the context seamlessly to Google Jules so they can begin coding immediately.

---

## 📂 Project Structure

This project is organized as a monorepo containing both the frontend client and the Python API backend:

*   **`frontend/`**: The web application built using Next.js (App Router), Tailwind CSS, and SWR.
*   **`backend/`**: The API backend server powered by Python 3.12, FastAPI, MongoDB (Motor), and the Google Gemini LLM.
*   **`Documentation/`**: Comprehensive specifications, architecture charts, and guides for the project.
*   **`assets/`**: Logos, diagrams, and branding resources.

---

## 📖 Documentation Index

For detailed guidelines on the platform's requirements and technical specifications, refer to the following documents in the `Documentation/` directory:

1.  **[Market Requirements Document (MRD)](./Documentation/MRD.md)**: Product vision, user journeys, success metrics, and core product principles.
2.  **[Product Requirements Document (PRD)](./Documentation/PRD.md)**: Detailed functional scope, edge case handling, and integration endpoints.
3.  **[Phase 1 Specification (Discover)](./Documentation/phase_1_spec.md)**: Product flow, heuristics, and API contracts for the core Phase 1 recommendations engine.
4.  **[Application Flow & Architecture](./Documentation/APP_ARCHITECTURE.md)**: High-level architectural diagrams, webhook processing pipelines, and data flows.
5.  **[Database Schema Specifications](./Documentation/SCHEMA.md)**: Production-ready MongoDB collection structures, indexes, and document validations.
6.  **[Phase 1 MongoDB JSON Schema](./Documentation/phase_1_schema.json)**: Production validation schemas for the core Phase 1 database collections.
7.  **[Technical Architecture & Guide](./Documentation/TECHNICAL_GUIDE.md)**: Monorepo configuration, API contracts, deployment topologies, and environment variables.

---

## 🛠️ Stack & Technologies

*   **Frontend Client:** Next.js 14+ (React Server Components), Tailwind CSS, Framer Motion
*   **Backend Server:** FastAPI, Uvicorn, Python 3.12
*   **Database:** MongoDB Atlas (NoSQL Document Store)
*   **Object Storage:** Storj (S3-compatible bucket)
*   **Authentication:** Clerk (GitHub OAuth identity provider)
*   **AI Integration:** Google Gemini API (Unified AI Service)
*   **Implementation Handoff:** Google Jules REST API

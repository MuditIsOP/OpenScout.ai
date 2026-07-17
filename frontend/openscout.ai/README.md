# OpenScout.ai - Phase 1 Frontend Flow

OpenScout.ai is an intelligent developer discovery platform. It analyzes a developer's GitHub profile activity, calculates technical skill confidence vectors, and recommends relevant, active open-source repositories tailored to their experience level and contribution goals.

This repository contains the complete, production-ready **Phase 1 Frontend Architecture**. It features an immersive **Glassmorphism Dark Theme UI** with fluid moving background gradients, responsive layouts, and interactive hover/transition filters.

## 🎨 Design Concept
Inspired by advanced visual aesthetics (Dribbble Glassmorphic Dark themes):
- **Glassmorphism Panels**: Developed with highly precise CSS blur filters (`backdrop-blur-md`), translucent border outlines, and ambient depth.
- **Fluid Backgrounds**: Moving mesh glows that pulses slowly behind structural cards to represent a living, interactive application.
- **Dynamic Micro-interactions**: Hover expansions, glowing accent boundaries, and smooth animation transitions.

## 🚀 Getting Started

To install package dependencies and start the development server:

```bash
# Install base dependencies
npm install

# Start the interactive development server
npm run dev
```

The application runs on **Port 3000** with Hot Module Replacement configured automatically.

## 📁 Scalable Folder Structure

```text
app/ (Vite React Client Structure)
├── src/
│   ├── components/
│   │   ├── analysis/             # Profile analysis progressive steps
│   │   ├── auth/                 # Clerk login triggers
│   │   ├── layout/               # Sidebars, headers, mobile drawers
│   │   ├── onboarding/           # Searchable multi-chips preferences fields
│   │   ├── profile/              # Skill badge grids & confidence metrics
│   │   ├── recommendations/      # Match score cards & interactive accordion
│   │   ├── states/               # Full loaders, rate-limits, and empties
│   │   └── ui/                   # Reusable glass Buttons, Badges, Cards, Progress bars
│   │
│   ├── lib/
│   │   ├── api.ts                # Asynchronous Mock API handlers
│   │   └── mock-data.ts          # Core profile metadata templates
│   │
│   ├── types.ts                  # Strong TypeScript type mappings
│   ├── App.tsx                   # Central coordinate state router
│   ├── index.css                 # Base glassmorphism classes & ambient animations
│   └── main.tsx                  # Client DOM mounter
```

## ⚙️ Testing Custom Scenarios
Inside the **Landing Page**, you can select simulated profiles from a dropdown to test all the required Phase 1 flows:
1. **Alex Mercer (`"octocat-scout"`)**: High-confidence profile (87%). Passes GitHub analysis step-timer automatically and lands **directly on the Dashboard** with fully scoped recommendations.
2. **John Doe (`"johndoe-codes"`)**: Low-confidence profile (32%). Triggers the analysis but redirects to **Manual Onboarding Preferences** to personalize criteria before showing the Dashboard.
3. **Empty Profile (`"empty-coder"`)**: Triggers a **No public repository activity** error panel, giving an option to enter skills manually.
4. **Simulated Error (`"error-coder"`)**: Triggers an **API Unavailable** error state with robust retry handlers.
5. **Simulated Rate Limit (`"rate-limit-coder"`)**: Triggers the **GitHub Rate-Limit** error state with a responsive retry action.

## 🔌 Connecting Real Backend APIs
To connect this frontend to production microservices later:
1. **Authentication**: Replace our Clerk login buttons with your live `@clerk/clerk-react` or `@clerk/nextjs` SDK wrappers.
2. **Profile Services**: In `/src/lib/api.ts`, swap out our `sleep()` simulated fetches in `analyzeGitHubProfile()` with actual `axios` or `fetch` requests targeting your AI ingestion endpoint.
3. **Recommendations**: Wire `/api/recommendations` inside `getRecommendations()` to query your active Firestore, PostgreSQL, or vector matching index.

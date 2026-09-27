# Vision

An end-to-end media intelligence and verification platform for environmental, social, and sustainability initiatives. Vision ingests field photos and videos, pairs them with geographic metadata, and verifies physical ground-truth progress through multimodal AI analysis and project-centric evidence dashboards.

[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## Architecture

Vision is decoupled into an autonomous Next.js 15 frontend application, an Express TypeScript REST backend with strict Zod schemas, Cloudinary asset storage, and a Supabase PostgreSQL persistence layer.

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 15 App Router)"]
        ProjectsUI["Projects List & Management Modals"]
        DashboardUI["Project Intelligence Dashboard"]
        UploadModal["Media Ingestion Modal (GPS + Drag-n-Drop)"]
        Inspector["Evidence Inspector & AI Badges"]
    end

    subgraph Backend ["Backend API (Express + TypeScript)"]
        AuthMiddleware["Authentication Middleware (Bearer Token / x-demo-user)"]
        API["REST Endpoints (/api/*)"]
        ZodValidator["Zod Schema Validation & Ownership Scoping"]
        UploadStream["Multer 15MB Memory Buffer"]
        CloudinaryService["Cloudinary SDK (Stream Uploader)"]
        DBRepo["Supabase Repository Layer (User Scoped)"]
        VisionEngine["Multimodal Vision Analysis Engine"]
    end

    subgraph Storage ["Cloud Infrastructure"]
        Cloudinary[("Cloudinary Media CDN\n(Optimized WebP / MP4)")]
        Supabase[("Supabase PostgreSQL\n(Projects, Assets, AI Analysis)")]
    end

    ProjectsUI -->|REST / JWT| AuthMiddleware
    DashboardUI -->|REST / JWT| AuthMiddleware
    AuthMiddleware --> API
    UploadModal -->|multipart/form-data| UploadStream
    UploadStream --> ZodValidator
    ZodValidator --> CloudinaryService
    CloudinaryService -->|Secure Stream Upload| Cloudinary
    Cloudinary -->|URL + Public ID| CloudinaryService
    CloudinaryService --> DBRepo
    DBRepo -->|SQL Query / RLS| Supabase
    API --> VisionEngine
    VisionEngine -.->|Multimodal Analysis| Supabase
```

---

## Development Milestones

| Milestone | Scope | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Core Architecture & Schemas** | Decoupled client/server, project schema, in-memory fallbacks, basic routing | Completed |
| **Phase 1** | **Media Ingestion Pipeline** | Cloudinary integration, GPS capture, drag-and-drop modal, live gallery feeds | Completed |
| **Phase 2** | **AI Vision Analysis** | Multimodal structured JSON extraction, resilient multi-model fallback chain, automated tagging, Visual Evidence Inspector | Completed |
| **Phase 3** | **Project Management & Dashboard** | Project creation, editing, deletion, real-time statistics, chronological timeline, activity breakdown, geo-clustering, multi-tenant security controls | Completed |
| **Phase 4** | **Vector Search & Similarity** | pgvector embeddings, duplicate detection, cross-project semantic queries | Planned |
| **Phase 5** | **ESG Impact Reports** | Metric aggregation, PDF report generation, public verification share links | Planned |

---

## Key Features

### Phase 3: Project Management & Intelligence Dashboard

- **Project Management System**: Create, edit, and safely delete real-world impact projects with strict client and server validation (name, location, description, and date ranges).
- **Multi-Tenant Security Controls**:
  - **Authentication Middleware**: Requires valid `Bearer` token or explicit `x-demo-user` credentials, returning `401 Unauthorized` when credentials are missing.
  - **Server-Side Ownership Scoping**: Enforces `created_by = userId` filtering across project, asset, and AI analysis endpoints to prevent IDOR URL tampering data leaks.
  - **Attacker-Controlled `created_by` Protection**: Client-supplied owner fields in request payloads are safely overridden server-side with the authenticated user ID.
- **Project Intelligence Dashboard**:
  - **Real-Time Statistics**: Dynamic Media Count, Activity Count, and Geo-Location Count cards.
  - **Activity Breakdown**: Case-insensitive normalization of AI vision activities (e.g. `tree plantation`, `Tree Plantation`), attributing assets across distinct categories without double-counting in total media counts.
  - **Geo-Location Site Clustering**: Validates coordinate boundaries (-90..90 lat, -180..180 lng) and groups operational sites at 0.001 degree precision (~110m accuracy).
  - **Chronological Evidence Timeline**: Groups project assets by Year → Month using `capture_date` (fallback `created_at`), transparently highlighting undated assets.
  - **Recent Media Evidence**: Displays recent project thumbnails with video indicators and broken URL fallback UI.

### Phase 2: AI Vision Analysis Capabilities

- **Multimodal Ground-Truth Verification**: Inspects uploaded photographic and video evidence through multimodal vision intelligence, automatically detecting verifiable environmental markers, activities, and physical conditions.
- **Resilient Fallback & Backoff**: Automatically handles upstream provider capacity spikes with bounded jittered exponential backoff and multi-model candidate failover.
- **Fail-Safe Diagnostics**: Upstream provider credential errors (`401`/`403`) are isolated server-side and mapped to `502 Bad Gateway`, safeguarding application client authentication state.
- **Evidence Inspector Modal**: Detailed visual drawer in the frontend with confidence scores, identified physical objects, sustainability activities, condition assessments, and interactive GPS coordinate details.

---

## Quickstart

### Prerequisites
- Node.js `v18.x` or higher
- npm `v9.x` or higher

### 1. Installation

Install both backend and frontend dependencies from the root repository:

```bash
git clone https://github.com/Sarthak-Pandey/Vision.git
cd Vision
npm run install:all
```

### 2. Environment Configuration

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Vision AI Configuration
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.8-flash
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

*Note: If cloud credentials are not provided, the backend falls back to an internal in-memory store and intelligent contextual simulation for local testing.*

### 3. Running Locally

Run both the backend API (`:5000`) and the Next.js frontend (`:3000`) concurrently:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend Health Check: `http://localhost:5000/api/health`
- Projects List: `http://localhost:3000/projects`

---

## REST API Reference

| Method | Endpoint | Description | Headers / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check | None |
| `GET` | `/api/projects` | List projects owned by authenticated user | `Authorization` or `x-demo-user` |
| `POST` | `/api/projects` | Create a new project | `{ name, description, location, start_date, end_date }` |
| `GET` | `/api/projects/:id` | Get project details and statistics | `id: UUID` |
| `PATCH` | `/api/projects/:id` | Update project details | `{ name, description, location, ... }` |
| `DELETE` | `/api/projects/:id` | Delete project and cascade assets | `id: UUID` |
| `POST` | `/api/assets/upload` | Stream image or video to Cloudinary | `multipart/form-data` (`file`) |
| `POST` | `/api/assets` | Register uploaded asset in database | `{ project_id, url, latitude, longitude, ... }` |
| `GET` | `/api/assets` | List ingested media assets for project | `?projectId=:id` |
| `POST` | `/api/assets/:id/analyze` | Execute automated AI Vision multimodal inspection | `id: UUID` |
| `GET` | `/api/assets/:id/analysis` | Fetch existing AI evidence analysis for an asset | `id: UUID` |

---

## Database Schema

The platform uses PostgreSQL via Supabase. Schema definitions are maintained in [`backend/schema.sql`](backend/schema.sql):

- **`projects`**: Project names, descriptions, locations, start/end dates, `created_by` owner IDs, creation timestamps.
- **`assets`**: Cloudinary URLs, public IDs, file types, GPS coordinates (latitude/longitude), upload timestamps, foreign key `project_id REFERENCES projects(id) ON DELETE CASCADE`.
- **`ai_analysis`**: Multimodal outputs (description, detected objects, activities, scene classifications, physical conditions, confidence metrics, source provenance), foreign key `asset_id REFERENCES assets(id) ON DELETE CASCADE`.

---

## Contributors

- **Sarthak Pandey** ([@Sarthak-Pandey](https://github.com/Sarthak-Pandey))
- **Swatantra** ([@Swatantra-66](https://github.com/Swatantra-66))

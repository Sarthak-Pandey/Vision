# AI Impact & Sustainability Media Intelligence Platform 🌿

[![Phase 0 Completed](https://img.shields.io/badge/Phase_0-Complete-success.svg?style=flat-square)](#)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black.svg?style=flat-square&logo=next.js)](#)
[![Express](https://img.shields.io/badge/Backend-Node.js_/_Express-green.svg?style=flat-square&logo=express)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg?style=flat-square&logo=typescript)](#)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8.svg?style=flat-square&logo=tailwindcss)](#)

> **Visual Evidence Intelligence Platform** transforming unstructured field photos and videos into searchable, traceable evidence of real-world environmental and social impact activities.

---

## 🏗️ Architecture Overview

The platform is engineered using a strictly decoupled client-server architecture to ensure high performance, security, and scalability.

```
                  ┌────────────────────────────────────────┐
                  │           Next.js 15 Frontend          │
                  │   App Router • Tailwind • Lucide UI    │
                  └───────────────────┬────────────────────┘
                                      │ REST API Requests
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         Node.js / Express Backend      │
                  │   TypeScript • Zod • Error Handlers    │
                  └─────────┬────────────────────┬─────────┘
                            │                    │
        ┌───────────────────┴──────┐      ┌──────┴───────────────────┐
        │ Supabase (PostgreSQL/pgvector) │  │ Cloudinary Vision Media  │
        │ Database & Fallback Store│      │ Ingestion Pipeline Store │
        └──────────────────────────┘      └──────────────────────────┘
```

---

## ✨ Phase 0 Features & Key Capabilities

- 🛡️ **Decoupled Architecture**: Independent frontend (`:3000`) & backend (`:5000`) servers.
- 📦 **In-Memory & Production DB Fallback**: Operates out-of-the-box with pre-seeded test data even without live cloud keys.
- 🔐 **Authentication & Session Simulation**: Secure token-based header auth with pre-filled demo accounts.
- 📁 **Project Portfolio Management**: Full CRUD capabilities for ESG & sustainability projects with metric tracking.
- 🖼️ **Media Evidence Ingestion**: Metadata-rich visual evidence viewer with status tracking (Verified, Pending, Flagged).
- 🔍 **Unified Semantic & Keyword Search**: High-performance multi-filter discovery interface.
- 📊 **ESG Reporting Module**: Generated summary analytics and downloadable impact reporting views.
- 🎨 **Design System**: Premium custom UI built with white, gray, and vibrant emerald/cyan accents.

---

## 📂 Repository Structure

```
ai-impact-platform/
├── backend/                  # Node.js / Express REST API Application
│   ├── src/
│   │   ├── config/           # Environment & database configuration
│   │   ├── controllers/      # Route request handlers
│   │   ├── middleware/       # Zod validation, auth & global error middleware
│   │   ├── repositories/     # Data access layer (Supabase + In-Memory fallback)
│   │   ├── routes/           # REST endpoints definition
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── services/         # Business logic layer
│   │   ├── types/            # TypeScript interfaces & types
│   │   ├── utils/            # Custom AppError & response wrappers
│   │   ├── app.ts            # Express application initialization
│   │   └── server.ts         # Server bootstrap entrypoint
│   ├── schema.sql            # Supabase PostgreSQL schema definition
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/                 # Next.js 15 Web Application
    ├── src/
    │   ├── app/              # Next.js App Router pages & sub-routes
    │   │   ├── (auth)/       # Authentication pages (Login)
    │   │   ├── (dashboard)/  # Main platform dashboard & workspace routes
    │   │   └── layout.tsx    # Root HTML & metadata provider
    │   ├── components/       # Reusable UI component library & layout shells
    │   ├── lib/              # API client, auth context & utility functions
    │   └── types/            # Shared client types
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Quick Start & Installation

### Prerequisites

- **Node.js**: `v18.x` or later
- **npm**: `v9.x` or later

### 1. Run the Backend API

```bash
cd backend
npm install
npm run dev
```

The backend server runs at `http://localhost:5000`.
Health endpoint: `http://localhost:5000/api/health`

### 2. Run the Frontend Application

```bash
cd frontend
npm install
npm run dev
```

The frontend application runs at `http://localhost:3000`.

---

## 🔑 Environment Configuration

Copy `.env.example` files to `.env` in both `backend/` and `frontend/` folders:

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://mock-supabase.supabase.co
SUPABASE_SERVICE_ROLE_KEY=mock-key
CLOUDINARY_CLOUD_NAME=mock-cloud
CLOUDINARY_API_KEY=mock-key
CLOUDINARY_API_SECRET=mock-secret
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_DEMO_USER_EMAIL=sarthak@example.com
```

---

## 📄 License

MIT License © 2026 Sarthak Pandey. All Rights Reserved.

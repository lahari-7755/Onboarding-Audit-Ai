# ONBOARDING AUDIT AGENT

Tagline: *"Experience onboarding before your employees do."*

Onboarding Audit Agent is a dual-engine fullstack platform that does not ask new hires for feedback. Instead, it acts like a real new employee (Agent Recruit). The system sequentially executes multi-agent audit operations to read corporate guidelines, attempt tasks, identify policy contradictions, log broken tools setup parameters, and recommend concrete action items.

---

## 🛠️ Complete Modular Architecture

This fullstack application integrates a highly-responsive React Vite frontend with an Express.js backend containing full-scale simulation, RAG processing, and Gemini AI agents.

### Folder Structure
```text
/
├── server.ts                    # Full-Stack Express.js Entrypoint & API Routings
├── package.json                 # Core Dependencies & Build scripts
├── vite.config.ts               # Bundling Configurations
├── metadata.json                # Project Capabilities & Permissions
├── data/
│   └── onboarding_audit_db.json # Durable Portable SQLite Cache (Local JSON DB)
└── src/
    ├── App.tsx                  # Dashboard Front-end (Plus Jakarta, Outfit typography)
    ├── index.css                # Style Definitions & Fonts Pre-loaders
    ├── main.tsx                 # React DOM Renderer standard
    ├── types.ts                 # Shared Types declarations
    ├── server-db.ts             # File-System transactional Database manager
    └── server-agents.ts         # Agent workflow engine & fallbacks (Gemini 3.5 Flash)
```

---

## 💾 Relational Database Schema (Supabase PostgreSQL / Cloud SQL)

For durable cloud SQL setups, implement this relational DDL schema matching our internal Portable JSON fields:

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'md'
  content TEXT NOT NULL,
  size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sessions Logs Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  candidate_role VARCHAR(100) NOT NULL, -- 'Software Engineer', 'Product Manager' etc.
  score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  progress INTEGER DEFAULT 0,
  findings_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  missing_info_count INTEGER DEFAULT 0
);

-- 4. Findings Log Table
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'info_miss', 'contradiction', 'broken_setup', 'confusion'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  document_reference VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
  status VARCHAR(50) DEFAULT 'active',
  details TEXT
);

-- 5. Action recommendations Table
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  action_item TEXT NOT NULL,
  impact VARCHAR(50) NOT NULL -- 'HIGH', 'MEDIUM', 'LOW'
);

-- 6. Interactive Chat history
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant'
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  agent_name VARCHAR(100) -- 'Auditor', 'Simulation'
);
```

---

## 🤖 Synchronization Multi-Agent Workflows (Simulated LangGraph)

The audit platform launches **Three Core Agents** to complete the analysis cycle:

```text
               [User Uploads Manuals]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   AGENT 1: DOCUMENT READER       │ ◄── Splits contents into context Chunks
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   AGENT 2: EMPLOYEE SIMULATOR    │ ◄── Emulates Candidate Role (e.g., Engineer)
        └────────────────┬─────────────────┘     Attempts setup. Compiles roadblock logs
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   AGENT 3: CONTRADICTION DETECTOR│ ◄── Cross-compares rules (Office vs Remote)
        └────────────────┬─────────────────┘     Computes Severity Ratings
                         │
                         ▼
             [EVALUATION MODULE] ──► Generates Onboarding Scores, Recommendations & Chats
```

1. **Document Reader Agent (RAG Indexer)**: Scrapes text and breaks content into context chunks.
2. **Employee Simulation Agent**: Emulates a newly hired role starting in the organization. It identifies missing setup directories, missing escalation buddies, API keys blocked by individual developers, and unclear project repositories.
3. **Contradiction Detector Agent**: Compares HR agreement models against engineering setup templates to detect compliance bugs (hybrid work hours differences, virtual hubs vs physical badge gates).

---

## 🔌 Exposed API Endpoints

The Express backend securely serves these endpoint routers:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/documents` | Retrieve all parsed manuals from index |
| `POST` | `/api/documents` | Load manual (PDF base64 extract, docx, or parsed text markdown) |
| `DELETE` | `/api/documents/:id` | Remove document from audit scope |
| `GET` | `/api/sessions` | Fetch historic audit list |
| `GET` | `/api/sessions/:id` | Detailed audit (scores, findings list, chats) |
| `POST` | `/api/sessions` | Launch a fresh multi-agent simulated Onboarding Audit |
| `POST` | `/api/sessions/:id/chat` | Chat interactively about the simulation with Auditor/Simulator |
| `DELETE` | `/api/sessions/:id`| Archive session history |

---

## 🐳 Docker Stack Setup

To pack and distribute Onboarding Audit Agent, deploy using this standard Docker configuration:

```dockerfile
# 1. Base Layer
FROM node:18-alpine

# Working Directory
WORKDIR /app

# Copy lock files and assets
COPY package*.json ./

# Install dev & prod dependencies
RUN npm install

# Copy source code
COPY . .

# Build step with CJS bundles
RUN npm run build

# Port binding
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
```

---

## 🔑 Environment Variables (.env)

Declare the following parameters inside `.env` configuration panels:

```bash
# Gemini LLM authentication key (Exposed to server side only)
GEMINI_API_KEY="AI_STUDIO_INJECTED_SECRET"

# Deployment app context endpoint link
APP_URL="https://onboarding-agent-preview-service.run.app"
```

---

## 🚀 Easy Development Deployment

Follow these quick commands to spin up locally or on your preferred container host:

```bash
# 1. Install packages
npm install

# 2. Boot local server & hot reloading web proxy on port 3000
npm run dev

# 3. Compile for production container build
npm run build

# 4. Standalone production start
npm run start
```

#  Customer Support Automation Using Generative AI

> A full-stack AI-powered customer support system with RAG pipeline, decision engine, and multi-role dashboards — deployed on free-tier cloud infrastructure.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://customer-support-automation-using-g.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-HuggingFace%20Spaces-yellow?logo=huggingface)](https://aeroscissors-nebulacore.hf.space)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)](https://cloud.mongodb.com)
[![LLM](https://img.shields.io/badge/LLM-Groq%20%7C%20Llama%203.1-orange)](https://console.groq.com)

---

##  Live Deployment

| Service | URL | Description |
|---|---|---|
|  **Frontend** | [customer-support-automation-using-g.vercel.app](https://customer-support-automation-using-g.vercel.app) | React app — Login, Chat, Dashboards |
|  **Backend API** | [aeroscissors-nebulacore.hf.space](https://aeroscissors-nebulacore.hf.space) | FastAPI REST backend |
|  **API Docs** | [aeroscissors-nebulacore.hf.space/docs](https://aeroscissors-nebulacore.hf.space/docs) | Interactive Swagger UI |
|  **Database** | MongoDB Atlas — OpenClusters (ap-south-1) | Cloud MongoDB (Free Tier M0) |

---

##  Access Roles

| Role | Login URL | Credentials |
|---|---|---|
|  **Customer** | `/chat` | No login required |
|  **Agent** | `/` → Login | Issued by Admin |
|  **Admin** | `/` → Login | `admin1` / *(set at deployment)* |

---

##  Architecture Overview

```
Customer Chat
     │
     ▼
FastAPI Backend (HuggingFace Spaces - NebulaCORE)
     │
     ├── RAG Pipeline
     │     ├── Embedder (sentence-transformers/all-MiniLM-L6-v2)
     │     ├── FAISS Vector Index (39 FAQs)
     │     └── Retriever (Top-K semantic search)
     │
     ├── LLM Generation
     │     └── Groq API (llama-3.1-8b-instant)
     │
     ├── Decision Engine
     │     ├── Confidence Scoring
     │     ├── Intent Risk Check (Legal, Financial, Security, Abuse)
     │     ├── Emotion Detection (Angry, Distressed, Abusive)
     │     └── AUTO_RESOLVE or ESCALATE_TO_HUMAN
     │
     └── MongoDB Atlas (OpenClusters)
           ├── tickets
           ├── users
           └── faqs
```

---

##  Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.10 | Core language |
| FastAPI | REST API framework |
| MongoDB + PyMongo | Database |
| FAISS | Vector similarity search |
| sentence-transformers | Text embeddings |
| Groq API (llama-3.1-8b-instant) | LLM inference |
| JWT (python-jose) | Authentication |
| passlib + bcrypt | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| Material UI (MUI) | Component library |
| Recharts | Analytics charts |
| React Router | Client-side routing |

### Infrastructure
| Service | Provider | Tier |
|---|---|---|
| Frontend Hosting | Vercel | Free |
| Backend Hosting | HuggingFace Spaces (Docker) | Free CPU |
| Database | MongoDB Atlas | Free M0 |
| LLM API | Groq | Free (14,400 req/day) |

---

##  Project Structure

```
genai-customer-support/
│
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers (chat, tickets, agent, admin, auth, faq)
│   │   ├── core/
│   │   │   ├── llm/          # Groq/Ollama generation + model loader
│   │   │   ├── rag/          # Embedder, FAISS retriever, index manager
│   │   │   ├── decision/     # Confidence, intent, emotion, decision engine
│   │   │   └── orchestration.py  # Central pipeline
│   │   ├── db/               # MongoDB connection + seed data
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # Business logic layer
│   │   └── utils/            # Config, logger, security
│   ├── data/
│   │   ├── faiss_index/      # index.bin + metadata.json
│   │   └── knowledge_base/   # Source FAQ JSON files
│   ├── scripts/
│   │   ├── build_faiss_index.py  # Rebuild vector index from MongoDB
│   │   └── insert_faqs.py        # Seed FAQ data
│   ├── Dockerfile            # HuggingFace Spaces deployment
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── app/              # Routes, App, ProtectedRoute
        ├── pages/            # CustomerChat, Login, Profile
        ├── dashboards/
        │   ├── AdminDashboard/   # Overview, Analytics, SLA, KnowledgeBase, Agents
        │   └── AgentDashboard/   # TicketQueue, TicketDetail, AIInsightPanel
        ├── components/       # Charts, StatCard, TopBar
        ├── services/api.js   # All API calls
        └── styles/           # Theme + CSS
```

---

##  Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas URI)
- Groq API key → [console.groq.com](https://console.groq.com)

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
LLM_MODEL_NAME=llama-3.1-8b-instant
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=genai_customer_support
JWT_SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
FAISS_INDEX_PATH=./data/faiss_index/index.bin
FAISS_TOP_K=4
CONFIDENCE_THRESHOLD=0.75
```

```bash
# Seed FAQs and build FAISS index
python scripts/insert_faqs.py
python scripts/build_faiss_index.py

# Create admin account
python create_admin.py

# Start backend
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`  
Backend runs at `http://localhost:8000`  
API Docs at `http://localhost:8000/docs`

---

##  AI Pipeline Flow

```
User Message
    │
    ▼
1. RAG Retrieval — FAISS semantic search → Top-5 relevant FAQs
    │
    ▼
2. LLM Generation — Groq Llama 3.1 generates answer from context
    │
    ▼
3. Confidence Score — Keyword overlap ratio (0.0 - 0.95)
    │
    ▼
4. Intent Check — Detect legal/financial/security/abuse keywords
    │
    ▼
5. Emotion Check — Detect anger/distress/abusive language
    │
    ▼
6. Decision Engine
    ├── is_risky → ESCALATE
    ├── is_escalated → ESCALATE
    ├── confidence < 0.5 → ESCALATE
    └── else → AUTO_RESOLVE
    │
    ▼
7. Ticket Created in MongoDB with status + AI response
```

---

##  Ticket Status Enum

| Status | Description |
|---|---|
| `AI_RESOLVED` | Answered by AI with high confidence |
| `ESCALATED` | Forwarded to human agent |
| `HUMAN_RESOLVED` | Agent replied and resolved |
| `CLOSED` | Ticket closed |
| `RESOLVED` | Final resolution state |

---

##  Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/` | Customer chat message |
| `POST` | `/auth/login` | Login for admin/agent |
| `GET` | `/tickets/` | List all tickets |
| `GET` | `/tickets/{id}` | Get ticket by ID |
| `POST` | `/tickets/{id}/message` | Agent reply to ticket |
| `GET` | `/admin/analytics` | Admin dashboard stats |
| `GET` | `/admin/agents` | List all agents |
| `POST` | `/agent/create` | Create agent account |
| `GET` | `/faq/` | List all FAQs |
| `POST` | `/faq/` | Add new FAQ |
| `GET` | `/health` | Health check |

---

##  Environment Variables (HuggingFace Secrets)

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `MONGO_DB_NAME` | Database name |
| `GROQ_API_KEY` | Groq API key |
| `LLM_PROVIDER` | `groq` or `ollama` |
| `LLM_MODEL_NAME` | `llama-3.1-8b-instant` |
| `JWT_SECRET_KEY` | JWT signing secret |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` |
| `FAISS_INDEX_PATH` | `./data/faiss_index/index.bin` |
| `FAISS_TOP_K` | Number of retrieved contexts (default: 4) |
| `CONFIDENCE_THRESHOLD` | Auto-resolve threshold (default: 0.75) |

---

##  Author

**AeroScissors**  
College Project — GenAI Customer Support Automation  
Stack: Python · FastAPI · React · FAISS · MongoDB · Groq · HuggingFace · Vercel
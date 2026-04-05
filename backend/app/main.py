from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api import tickets, faq, chat
from app.api import agent, admin
from app.api import auth

# DB
from app.db.mongo import init_indexes


app = FastAPI(
    title="GenAI Customer Support Backend",
    version="0.1.0",
    description="Backend core for customer support automation",
)

# --------------------------------------------------
# CORS (DEV)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Startup
# --------------------------------------------------
@app.on_event("startup")
def startup_event():
    init_indexes()


# --------------------------------------------------
# Health
# --------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# --------------------------------------------------
# Routers
# --------------------------------------------------
app.include_router(tickets.router)
app.include_router(faq.router)
app.include_router(chat.router)

app.include_router(agent.router)
app.include_router(admin.router)

app.include_router(auth.router)
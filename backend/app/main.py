import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.endpoints import ai, projects, auth
from app.db.session import engine, Base

# Load environment variables
load_dotenv()

# Initialize Database tables (fallback SQLite / PostgreSQL)
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
    
    # Auto-seed default user Devan
    from app.db.session import SessionLocal
    from app.models.project import User as UserModel
    import bcrypt
    
    db = SessionLocal()
    existing = db.query(UserModel).filter(UserModel.username == "devan").first()
    if not existing:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw("@levy123".encode('utf-8'), salt).decode('utf-8')
        user = UserModel(username="devan", password_hash=hashed)
        db.add(user)
        db.commit()
        print("Default user Devan seeded successfully.")
    db.close()
except Exception as e:
    print(f"Error initializing database or seeding: {e}")

app = FastAPI(
    title="ChemPilot OS Core API",
    description="FastAPI service for thermodynamic simulations, project storage, and RAG-based Terra AI companion.",
    version="1.0.0"
)

# Enable CORS for frontend development server and production Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://chempilot-phase1.vercel.app",
        "https://chempilot-phase1-mjbx81qne-terra-nova-intelligence.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "ChemPilot OS Core API is operational."}

import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.project import User as UserModel

router = APIRouter()

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "chempilot-os-jwt-secret-key-2026-secure")
JWT_ALGORITHM = "HS256"

# Schema
class AuthPayload(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: int, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@router.post("/register", response_model=UserResponse)
def register(payload: AuthPayload, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(UserModel).filter(UserModel.username == payload.username.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar.")
        
    hashed = hash_password(payload.password)
    user = UserModel(username=payload.username.strip().lower(), password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(payload: AuthPayload, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(
        UserModel.username == payload.username.strip().lower()
    ).first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Username atau password salah.")
        
    token = create_access_token(user.id, user.username)
    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(token: str, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Sesi tidak valid.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Sesi tidak valid.")
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi telah kedaluwarsa.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sesi tidak valid.")
    except Exception:
        raise HTTPException(status_code=401, detail="Sesi gagal divalidasi.")

class AIWorkspacePayload(BaseModel):
    ai_projects_json: str

@router.post("/me/ai-projects")
def save_ai_projects(payload: AIWorkspacePayload, token: str, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Sesi tidak valid.")
    try:
        token_payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = token_payload.get("user_id")
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
        user.ai_projects_json = payload.ai_projects_json
        db.add(user)
        db.commit()
        return {"status": "success", "message": "AI workspace saved successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/ai-projects")
def get_ai_projects(token: str, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Sesi tidak valid.")
    try:
        token_payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = token_payload.get("user_id")
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
        return {"ai_projects_json": user.ai_projects_json or ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.project import User as UserModel

router = APIRouter()

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
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

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
    hashed = hash_password(payload.password)
    user = db.query(UserModel).filter(
        UserModel.username == payload.username.strip().lower(),
        UserModel.password_hash == hashed
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Username atau password salah.")
        
    # Return simple session credentials (user_id and username as a token key)
    # Simple, clear token to avoid extra JWT package dependencies
    token = f"{user.id}:{user.username}"
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
    if not token or ":" not in token:
        raise HTTPException(status_code=401, detail="Sesi tidak valid.")
    try:
        user_id = int(token.split(":")[0])
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Sesi gagal divalidasi.")

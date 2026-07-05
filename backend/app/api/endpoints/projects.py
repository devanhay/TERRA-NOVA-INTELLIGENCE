from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.models.project import Project as ProjectModel, Flowsheet as FlowsheetModel

router = APIRouter()

# Schema definitions
class FlowsheetBase(BaseModel):
    flowsheet_json: str

class ProjectCreate(BaseModel):
    id: str
    name: str
    flowsheet: Optional[FlowsheetBase] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def get_user_id_from_token(token: Optional[str]) -> Optional[int]:
    if not token or ":" not in token:
        return None
    try:
        return int(token.split(":")[0])
    except Exception:
        return None

@router.get("/", response_model=List[ProjectResponse])
def list_projects(token: Optional[str] = None, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    if user_id is not None:
        # User is authenticated, only show their projects
        projects = db.query(ProjectModel).filter(ProjectModel.user_id == user_id).all()
    else:
        # Guest mode, show projects where user_id is null
        projects = db.query(ProjectModel).filter(ProjectModel.user_id.is_(None)).all()
        
    res = []
    for p in projects:
        res.append({
            "id": p.id,
            "name": p.name,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat()
        })
    return res

@router.get("/{project_id}")
def get_project(project_id: str, token: Optional[str] = None, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    # Allow looking up project only if it belongs to user_id, or is guest (null)
    query = db.query(ProjectModel).filter(ProjectModel.id == project_id)
    if user_id is not None:
        query = query.filter(ProjectModel.user_id == user_id)
    else:
        query = query.filter(ProjectModel.user_id.is_(None))
        
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
    
    flowsheet = db.query(FlowsheetModel).filter(FlowsheetModel.project_id == project_id).first()
    
    return {
        "id": project.id,
        "name": project.name,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "flowsheet_json": flowsheet.flowsheet_json if flowsheet else "{}"
    }

@router.post("/")
def save_project(payload: ProjectCreate, token: Optional[str] = None, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    # Check if project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == payload.id).first()
    
    if not project:
        project = ProjectModel(id=payload.id, name=payload.name, user_id=user_id)
        db.add(project)
    else:
        project.name = payload.name
        # Associate user_id if project is saved by logged-in user
        if user_id is not None:
            project.user_id = user_id
        db.add(project)
        
    db.commit()
    db.refresh(project)
    
    if payload.flowsheet:
        flowsheet = db.query(FlowsheetModel).filter(FlowsheetModel.project_id == payload.id).first()
        if not flowsheet:
            flowsheet = FlowsheetModel(project_id=payload.id, flowsheet_json=payload.flowsheet.flowsheet_json)
            db.add(flowsheet)
        else:
            flowsheet.flowsheet_json = payload.flowsheet.flowsheet_json
            db.add(flowsheet)
        db.commit()
        
    return {"status": "success", "project_id": project.id}

@router.delete("/{project_id}")
def delete_project(project_id: str, token: Optional[str] = None, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    query = db.query(ProjectModel).filter(ProjectModel.id == project_id)
    if user_id is not None:
        query = query.filter(ProjectModel.user_id == user_id)
    else:
        query = query.filter(ProjectModel.user_id.is_(None))
        
    project = query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
        
    db.delete(project)
    db.commit()
    return {"status": "success", "message": f"Project {project_id} deleted."}

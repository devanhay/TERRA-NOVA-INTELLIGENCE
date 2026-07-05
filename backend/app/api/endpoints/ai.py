from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.session import get_db
from app.models.project import ChatMessage as ChatMessageModel, DocumentChunk as DocumentChunkModel
from app.services.vector_db import search_similar_chunks, get_client
from app.api.endpoints.projects import get_user_id_from_token
from google import genai

router = APIRouter()

# Schema definitions
class MessageCreate(BaseModel):
    message: str
    include_rag: bool = True
    project_id: Optional[str] = None

class ChunkCreate(BaseModel):
    document_title: str
    page_num: int
    content: str

@router.get("/history")
def get_history(token: Optional[str] = None, project_id: Optional[str] = None, limit: int = 20, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    query = db.query(ChatMessageModel)
    if user_id is not None:
        query = query.filter(ChatMessageModel.user_id == user_id)
    else:
        query = query.filter(ChatMessageModel.user_id.is_(None))
        
    if project_id:
        query = query.filter(ChatMessageModel.project_id == project_id)
    else:
        query = query.filter(ChatMessageModel.project_id.is_(None))
        
    messages = query.order_by(ChatMessageModel.timestamp.desc()).limit(limit).all()
    # Reverse to return in chronological order
    messages = reversed(messages)
    return [{"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()} for m in messages]

@router.post("/chat")
def chat_endpoint(payload: MessageCreate, token: Optional[str] = None, db: Session = Depends(get_db)):
    user_id = get_user_id_from_token(token)
    
    # 1. Fetch RAG Context if requested and chunks exist
    context = ""
    relevant = []
    chunks = db.query(DocumentChunkModel).all()
    if payload.include_rag and chunks:
        relevant = search_similar_chunks(payload.message, chunks, db_session=db, top_k=3)
        if relevant:
            context = "\n".join([f"Konteks [Buku: {c.document_title}, Hal: {c.page_num}]: {c.content}" for c in relevant])

    # 2. Get Gemini client
    client = get_client()
    system_instruction = (
        "Anda adalah Terra AI, asisten sains dan rekayasa teknik kimia dari ChemPilot OS. "
        "Gunakan bahasa Indonesia yang ramah, sopan, dan profesional. "
        "Jika terdapat konteks buku referensi di bawah, gunakan informasi tersebut untuk menjawab pertanyaan dengan akurat.\n"
    )
    if context:
        system_instruction += f"\nKonteks buku yang relevan:\n{context}\n"

    # 3. Retrieve historical chat thread (sliding window - last 20 messages)
    history_query = db.query(ChatMessageModel)
    if user_id is not None:
        history_query = history_query.filter(ChatMessageModel.user_id == user_id)
    else:
        history_query = history_query.filter(ChatMessageModel.user_id.is_(None))
        
    if payload.project_id:
        history_query = history_query.filter(ChatMessageModel.project_id == payload.project_id)
    else:
        history_query = history_query.filter(ChatMessageModel.project_id.is_(None))
        
    history = history_query.order_by(ChatMessageModel.timestamp.desc()).limit(20).all()
    history.reverse()
    
    # 4. Save User Message
    user_msg = ChatMessageModel(role="user", content=payload.message, user_id=user_id, project_id=payload.project_id)
    db.add(user_msg)
    db.commit()

    # If Gemini API Key is missing, return fallback mock answer
    if not client:
        reply = (
            f"[Mode Offline - API Key belum disetel]\n\n"
            f"Saya menerima pesan Anda: \"{payload.message}\".\n\n"
            f"Untuk mengaktifkan jawaban AI sungguhan dari model Gemini, mohon pasang `GEMINI_API_KEY` pada file `.env` backend."
        )
        model_msg = ChatMessageModel(role="model", content=reply, user_id=user_id, project_id=payload.project_id)
        db.add(model_msg)
        db.commit()
        return {
            "reply": reply, 
            "sources": [{"title": c.document_title, "page": c.page_num} for c in relevant] if (payload.include_rag and chunks and relevant) else []
        }

    try:
        # Build chat session history for the Gemini API
        contents = []
        for h in history:
            contents.append(genai.types.Content(
                role="user" if h.role == "user" else "model",
                parts=[genai.types.Part.from_text(text=h.content)]
            ))
        
        # Append current user message
        contents.append(genai.types.Content(
            role="user",
            parts=[genai.types.Part.from_text(text=payload.message)]
        ))

        # Call Gemini SDK
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        reply = response.text
        
        # Save Model Message
        model_msg = ChatMessageModel(role="model", content=reply, user_id=user_id, project_id=payload.project_id)
        db.add(model_msg)
        db.commit()
        
        return {
            "reply": reply,
            "sources": [{"title": c.document_title, "page": c.page_num} for c in relevant] if (payload.include_rag and chunks and relevant) else []
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@router.post("/document-chunks")
def add_chunks(payloads: List[ChunkCreate], db: Session = Depends(get_db)):
    # Truncate old chunks for the same document_title to achieve idempotency/deduplication
    if payloads:
        titles_to_remove = list(set(p.document_title for p in payloads))
        db.query(DocumentChunkModel).filter(DocumentChunkModel.document_title.in_(titles_to_remove)).delete(synchronize_session=False)
        db.commit()

    for p in payloads:
        chunk = DocumentChunkModel(
            document_title=p.document_title,
            page_num=p.page_num,
            content=p.content
        )
        db.add(chunk)
    db.commit()
    return {"status": "success", "message": f"{len(payloads)} chunks ingested successfully."}


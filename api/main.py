from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import anthropic
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from dotenv import load_dotenv
import os
from textblob import TextBlob
from .database import SessionLocal, engine, Base
from .models import Document, ChatSession, Message
from datetime import datetime
import sqlalchemy.exc

# Initialize FastAPI app
app = FastAPI()

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# Initialize Anthropic API client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Create DB tables
Base.metadata.create_all(bind=engine)

# Ensure 'influence_score' column exists in 'documents' table
insp = inspect(engine)
columns = [col["name"] for col in insp.get_columns("documents")]

if "influence_score" not in columns:
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN influence_score FLOAT DEFAULT 0.5"))
            print("✅ Added 'influence_score' column to documents table.")
    except Exception as e:
        print(f"⚠️ Could not add column: {e}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "FastAPI backend running!"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = ""
    if file.filename.endswith(".pdf"):
        with pdfplumber.open(file.file) as pdf:
            content = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    else:
        content = (await file.read()).decode("utf-8")

    sentiment = TextBlob(content).sentiment.polarity

    new_doc = Document(
        name=file.filename,
        content=content,
        sentiment_score=sentiment,
        influence_score=0.5
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "filename": file.filename,
        "content": content,
        "sentiment_score": sentiment,
        "id": str(new_doc.id),
        "influence_score": new_doc.influence_score
    }

@app.post("/upload-document")
async def upload_document_alt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return await upload_document(file, db)

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    try:
        documents = db.query(Document).all()
        return [
            {
                "id": str(doc.id),
                "name": doc.name,
                "content": doc.content,
                "sentiment_score": doc.sentiment_score,
                "influence_score": getattr(doc, "influence_score", 0.5),
                "type": "pdf" if doc.name.endswith(".pdf") else "text"
            }
            for doc in documents
        ]
    except Exception as e:
        print(f"Error in get_documents: {e}")
        return []

@app.delete("/delete-document/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@app.patch("/update-influence/{document_id}")
def update_influence(document_id: str, influence_data: dict, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        document.influence_score = influence_data.get("influence", 0.5)
        db.commit()
        db.refresh(document)
        return {"id": str(document.id), "influence_score": document.influence_score}
    except Exception as e:
        db.rollback()
        print(f"Error updating influence: {e}")
        raise HTTPException(status_code=500, detail="Failed to update influence score")

@app.post("/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File is not a PDF")

    with pdfplumber.open(file.file) as pdf:
        content = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    return {"extracted_text": content}

@app.post("/generate-response")
async def generate_response(request_data: dict):
    if "query" not in request_data or "documents" not in request_data:
        raise HTTPException(status_code=400, detail="Missing query or documents in request")

    query = request_data["query"]
    document_ids = [doc["id"] for doc in request_data["documents"] if not doc.get("excluded", False)]

    db = SessionLocal()
    try:
        documents = db.query(Document).filter(Document.id.in_(document_ids)).all()
        document_texts = []
        for doc in documents:
            matching = next((d for d in request_data["documents"] if d["id"] == str(doc.id)), None)
            if matching:
                influence = matching.get("influence", 0.5)
                if influence > 0:
                    document_texts.append(f"Document '{doc.name}' (Influence: {influence*100:.0f}%):\n{doc.content}\n")

        context_text = "\n".join(document_texts)
        messages = [{"role": "user", "content": f"{context_text}\n\nQuery: {query}"}]


        try:
            response = client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1024,
                messages=messages
            )

            generated_text = response.content[0].text

            attribution_data = {
                "baseKnowledge": 40,
                "documents": [
                    {
                        "id": str(doc.id),
                        "name": doc.name,
                        "contribution": next((d for d in request_data["documents"] if d["id"] == str(doc.id)), {}).get("influence", 0.5) * 100
                    }
                    for doc in documents
                ]
            }

            total = sum(d["contribution"] for d in attribution_data["documents"])
            if total > 0:
                scale = 60 / total
                for d in attribution_data["documents"]:
                    d["contribution"] *= scale

            return {
                "generated_text": generated_text,
                "attributions": [],
                "attributionData": attribution_data
            }
        except Exception as e:
            print(f"Anthropic API error: {e}")
            return {
                "generated_text": "Unable to generate a response due to an API error.",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "error": str(e)
            }
    finally:
        db.close()

@app.post("/analyze-sentiment")
async def analyze_sentiment(data: dict):
    text = data.get("text", "")
    if not text:
        return {"sentiment_score": 0, "error": "No text provided"}

    sentiment = TextBlob(text).sentiment.polarity
    return {"sentiment_score": sentiment}

@app.post("/detect-bias")
async def detect_bias(data: dict):
    text = data.get("text", "")
    if not text:
        return {"bias_scores": {"political": 0.2}, "error": "No text provided"}

    political = 0.6 if "government" in text.lower() else 0.4 if "freedom" in text.lower() else 0.2
    gender = 0.7 if ("he" in text.lower()) ^ ("she" in text.lower()) else 0.1

    return {"bias_scores": {"political": political, "gender": gender}}

@app.post("/calculate-trust-score")
async def calculate_trust_score(data: dict):
    base = data.get("baseKnowledgePercentage", 50) / 100
    docs = data.get("documentContributions", [])

    if not docs:
        trust = base
    else:
        factor = sum(d.get("contribution", 0) for d in docs) / len(docs) / 100
        trust = (base * 0.7) + (factor * 0.3)

    trust = min(max(trust, 0), 1)
    return {"trust_score": trust}

@app.post("/api/chat/sessions")
async def create_chat_session(data: dict, db: Session = Depends(get_db)):
    session = ChatSession(title=data.get("title", "New Chat"))
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": str(session.id)}

@app.get("/api/chat/messages")
async def get_messages(chatSessionId: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.chat_session_id == chatSessionId).order_by(Message.timestamp).all()
    return [{"id": str(m.id), "role": m.role, "content": m.content, "timestamp": m.timestamp} for m in messages]

@app.post("/api/chat/messages")
async def save_message(data: dict, db: Session = Depends(get_db)):
    if not data.get("chatSessionId") or not data.get("role") or not data.get("content"):
        raise HTTPException(status_code=400, detail="Missing required fields")

    try:
        message = Message(
            chat_session_id=data["chatSessionId"],
            role=data["role"],
            content=data["content"],
            timestamp=datetime.now().isoformat()
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return {"id": str(message.id), "role": message.role, "content": message.content, "timestamp": message.timestamp}
    except Exception as e:
        db.rollback()
        print(f"Error saving message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save message: {str(e)}")

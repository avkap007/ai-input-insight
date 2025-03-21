
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import anthropic
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from textblob import TextBlob
from .database import SessionLocal, engine, Base
from .models import Document, ChatSession, Message
from datetime import datetime

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# Initialize Anthropic API client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Ensure database tables are created
Base.metadata.create_all(bind=engine)

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "FastAPI backend running!"}

# Upload and process document
@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = ""
    if file.filename.endswith(".pdf"):
        with pdfplumber.open(file.file) as pdf:
            content = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    else:
        content = (await file.read()).decode("utf-8")

    # Sentiment analysis on document
    sentiment = TextBlob(content).sentiment.polarity

    # Save document to database
    new_doc = Document(
        name=file.filename, 
        content=content, 
        sentiment_score=sentiment,
        influence_score=0.5  # Default influence score
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

# Also provide the upload-document endpoint to match frontend calls
@app.post("/upload-document")
async def upload_document_alt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return await upload_document(file, db)

# Get all documents
@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [
        {
            "id": str(doc.id),
            "name": doc.name,
            "content": doc.content,
            "sentiment_score": doc.sentiment_score,
            "influence_score": getattr(doc, "influence_score", 0.5),  # Safely get influence score
            "type": "pdf" if doc.name.endswith(".pdf") else "text"
        }
        for doc in documents
    ]

# Delete document
@app.delete("/delete-document/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# Update document influence
@app.patch("/update-influence/{document_id}")
def update_influence(document_id: str, influence_data: dict, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.influence_score = influence_data.get("influence")
    db.commit()
    db.refresh(document)
    
    return {
        "id": str(document.id),
        "influence_score": document.influence_score
    }

# Extract PDF text
@app.post("/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File is not a PDF")
    
    with pdfplumber.open(file.file) as pdf:
        content = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    return {"extracted_text": content}

# Generate AI response using Anthropic API
@app.post("/generate-response")
async def generate_response(request_data: dict):
    if "query" not in request_data or "documents" not in request_data:
        raise HTTPException(status_code=400, detail="Missing query or documents in request")
    
    query = request_data["query"]
    document_ids = [doc["id"] for doc in request_data["documents"] if not doc.get("excluded", False)]
    
    # Create context from documents
    db = SessionLocal()
    try:
        documents = db.query(Document).filter(Document.id.in_(document_ids)).all()
        
        # Apply influence scores and prepare context
        document_texts = []
        for doc in documents:
            # Find matching document from request to get influence score
            matching_req_doc = next((d for d in request_data["documents"] if d["id"] == str(doc.id)), None)
            if matching_req_doc:
                influence = matching_req_doc.get("influence", 0.5)
                if influence > 0:
                    document_texts.append(f"Document '{doc.name}' (Influence: {influence*100:.0f}%):\n{doc.content}\n")
        
        full_context = "\n".join(document_texts)
        messages = [{"role": "user", "content": f"{full_context}\n\nQuery: {query}"}]

        try:
            response = client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1024,
                messages=messages
            )
            
            # Process response for attributions
            generated_text = response.content[0].text
            
            # Mock attribution data based on input documents
            attribution_data = {
                "baseKnowledge": 40,
                "documents": [
                    {"id": str(doc.id), "name": doc.name, "contribution": matching_req_doc.get("influence", 0.5) * 100}
                    for doc in documents
                    if next((d for d in request_data["documents"] if d["id"] == str(doc.id)), None)
                ]
            }
            
            # Normalize contributions to ensure they sum up to 60%
            total_contributions = sum(doc["contribution"] for doc in attribution_data["documents"])
            if total_contributions > 0:
                ratio = 60 / total_contributions
                for doc in attribution_data["documents"]:
                    doc["contribution"] = doc["contribution"] * ratio
            
            return {
                "generated_text": generated_text,
                "attributions": [],  # We would need more advanced processing for token attributions
                "attributionData": attribution_data
            }
        except Exception as e:
            # Fallback to mock response in case of API error
            error_message = str(e)
            print(f"Anthropic API Error: {error_message}")
            return {
                "generated_text": f"I couldn't generate a response due to an API error. Please check your API key and try again later.",
                "attributions": [],
                "attributionData": {
                    "baseKnowledge": 100,
                    "documents": []
                },
                "error": error_message
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        db.close()

# Analyze sentiment
@app.post("/analyze-sentiment")
async def analyze_sentiment(data: dict):
    if "text" not in data or not data["text"]:
        return {"sentiment_score": 0, "error": "No text provided"}
    
    text = data["text"]
    sentiment = TextBlob(text).sentiment.polarity
    
    return {"sentiment_score": sentiment}

# Detect bias (simplified)
@app.post("/detect-bias")
async def detect_bias(data: dict):
    if "text" not in data or not data["text"]:
        return {"bias_scores": {"political": 0.2}, "error": "No text provided"}
    
    text = data["text"]
    
    # Simplified bias detection using simple keyword matching
    political_bias = 0.2
    if "government" in text.lower():
        political_bias = 0.6
    elif "freedom" in text.lower():
        political_bias = 0.4
    
    gender_bias = 0.1
    if "he" in text.lower() and "she" not in text.lower():
        gender_bias = 0.7
    elif "she" in text.lower() and "he" not in text.lower():
        gender_bias = 0.7
    
    return {
        "bias_scores": {
            "political": political_bias,
            "gender": gender_bias
        }
    }

# Calculate trust score
@app.post("/calculate-trust-score")
async def calculate_trust_score(data: dict):
    base_knowledge = data.get("baseKnowledgePercentage", 50) / 100
    document_contributions = data.get("documentContributions", [])
    
    # Simple trust score calculation
    if len(document_contributions) == 0:
        trust_score = base_knowledge
    else:
        # Higher trust when there's a balance between base knowledge and documents
        balance_factor = 0.7
        contribution_factor = sum(d.get("contribution", 0) for d in document_contributions) / len(document_contributions) / 100
        
        trust_score = (base_knowledge * balance_factor) + (contribution_factor * (1 - balance_factor))
    
    # Scale to 0-1
    trust_score = min(max(trust_score, 0), 1)
    
    return {"trust_score": trust_score}

# Chat session API routes to handle frontend calls
@app.post("/api/chat/sessions")
async def create_chat_session(data: dict, db: Session = Depends(get_db)):
    title = data.get("title", "New Chat")
    new_session = ChatSession(title=title)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"id": str(new_session.id)}

@app.get("/api/chat/messages")
async def get_messages(chatSessionId: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.chat_session_id == chatSessionId).order_by(Message.timestamp).all()
    return [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp
        }
        for msg in messages
    ]

@app.post("/api/chat/messages")
async def save_message(data: dict, db: Session = Depends(get_db)):
    chat_session_id = data.get("chatSessionId")
    role = data.get("role")
    content = data.get("content")
    
    if not chat_session_id or not role or not content:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Create message with timestamp here, don't rely on data
    current_time = datetime.now().isoformat()
    
    new_message = Message(
        chat_session_id=chat_session_id,
        role=role,
        content=content,
        timestamp=current_time
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return {
        "id": str(new_message.id),
        "role": new_message.role,
        "content": new_message.content,
        "timestamp": new_message.timestamp
    }

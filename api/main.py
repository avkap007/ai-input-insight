from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
import pdfplumber
import anthropic
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from textblob import TextBlob
from .database import SessionLocal, engine, Base
from .models import Document, ChatSession, Message
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()  # Create the app instance first

origins = ["http://localhost:8080"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# Initialize FastAPI app
app = FastAPI()

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
    new_doc = Document(name=file.filename, content=content, sentiment_score=sentiment)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {"filename": file.filename, "content": content, "sentiment_score": sentiment}

# Generate AI response using Anthropic API
@app.post("/generate-response")
async def generate_response(query: str, documents: list[str]):
    document_texts = "\n".join(documents)
    messages = [{"role": "user", "content": f"{document_texts}\n\nQuery: {query}"}]

    try:
        response = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1024,
            messages=messages
        )
        return {"generated_text": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI API Error: {str(e)}")

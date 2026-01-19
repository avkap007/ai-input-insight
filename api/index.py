from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os
from pydantic import BaseModel
from typing import List, Dict
import uuid

# Initialize FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment
api_key = os.environ.get("ANTHROPIC_API_KEY")

# Pydantic models
class DocumentInput(BaseModel):
    id: str
    name: str
    content: str
    influence: float = 0.5
    poisoning_level: float = 0
    excluded: bool = False

class GenerateRequest(BaseModel):
    query: str
    documents: List[DocumentInput]


# Onboarding message
ONBOARDING_MESSAGE = """👋 Welcome to AI Input Insight!

I'm an educational tool designed to help you explore how documents influence AI-generated responses.

**To get started:**

1. **Upload a document** - Use the panel on the left to upload a PDF or text file
2. **Adjust the influence slider** - Control how much that document affects my responses
3. **Ask me questions** - Watch how the response changes based on your document settings!

Upload a document and let's explore together! 📚"""


@app.get("/")
@app.get("/api")
@app.get("/api/")
def home():
    """Health check"""
    return {
        "message": "AI Input Insight API running!",
        "api_key_configured": api_key is not None,
        "status": "ok"
    }


@app.get("/api/test")
@app.get("/test")
def test():
    """Test endpoint"""
    return {"test": "working", "api_key_set": api_key is not None}


@app.post("/api/extract-text")
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file"""
    try:
        filename = file.filename or "unnamed"
        file_contents = await file.read()
        
        # For now, only handle text files (skip PDF complexity)
        try:
            content = file_contents.decode("utf-8")
        except UnicodeDecodeError:
            content = file_contents.decode("latin-1", errors="ignore")
        
        return {
            "id": str(uuid.uuid4()),
            "filename": filename,
            "content": content,
            "sentiment_score": 0,
            "influence_score": 0.5
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-response")
@app.post("/generate-response")
async def generate_response(request: GenerateRequest):
    """Generate AI response"""
    try:
        # Filter out excluded documents
        included_docs = [doc for doc in request.documents if not doc.excluded]
        
        # If no documents, return onboarding
        if not included_docs:
            return {
                "generated_text": ONBOARDING_MESSAGE,
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {
                    "sentiment": 0.3,
                    "bias": {"political": 0.0, "gender": 0.0},
                    "trustScore": 1.0
                },
                "isOnboarding": True
            }
        
        # Check if API key exists
        if not api_key:
            return {
                "generated_text": "⚠️ API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
                "error": "API key not configured"
            }
        
        # Try to use Anthropic
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            
            # Build simple prompt
            doc_context = "\n\n".join([
                f"Document: {doc.name}\nContent: {doc.content[:1000]}"
                for doc in included_docs
            ])
            
            prompt = f"""Based on the following documents, respond to the user's query.

{doc_context}

User query: {request.query}

Respond naturally, incorporating the document content where relevant."""
            
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            
            generated_text = response.content[0].text
            
            # Calculate simple attribution
            doc_contributions = [
                {"id": doc.id, "name": doc.name, "contribution": 60 / len(included_docs)}
                for doc in included_docs
            ]
            
            return {
                "generated_text": generated_text,
                "attributions": [],
                "attributionData": {
                    "baseKnowledge": 40,
                    "documents": doc_contributions
                },
                "analysisData": {
                    "sentiment": 0,
                    "bias": {"political": 0.1, "gender": 0.1},
                    "trustScore": 0.7
                }
            }
            
        except ImportError:
            return {
                "generated_text": "⚠️ Anthropic library not available. Check requirements.txt.",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
                "error": "anthropic import failed"
            }
        except Exception as api_error:
            return {
                "generated_text": f"⚠️ API Error: {str(api_error)}",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
                "error": str(api_error)
            }
            
    except Exception as e:
        return {
            "generated_text": f"⚠️ Server Error: {str(e)}",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
            "error": str(e)
        }


# Vercel serverless handler
handler = Mangum(app)

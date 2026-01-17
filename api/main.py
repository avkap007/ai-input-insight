from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import pdfplumber
import anthropic
from dotenv import load_dotenv
import os
from textblob import TextBlob
from services.analysis_service import AnalysisService
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid

# Pydantic models for request validation
class SentimentRequest(BaseModel):
    text: str

class BiasRequest(BaseModel):
    text: str

class TrustScoreRequest(BaseModel):
    baseKnowledgePercentage: float
    documentContributions: List[Dict]

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

# Initialize FastAPI app
app = FastAPI()

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# Initialize Anthropic API client (handle missing key gracefully)
api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=api_key) if api_key else None

# Initialize the analysis service
analysis_service = AnalysisService()

# Onboarding message when no documents are uploaded
ONBOARDING_MESSAGE = """👋 Welcome to AI Input Insight!

I'm an educational tool designed to help you explore how documents influence AI-generated responses.

**To get started:**

1. **Upload a document** - Use the panel on the left to upload a PDF or text file (like a writing sample, article, or any text you want to experiment with)

2. **Adjust the influence slider** - Control how much that document affects my responses (0-100%)

3. **Try the advanced controls** - Enable "Advanced Controls" to experiment with:
   - **Data Poisoning**: See how corrupted/noisy data affects AI outputs
   - **Document Exclusion**: Simulate "data strikes" by removing documents from context

4. **Ask me questions** - Once you have documents uploaded, ask me to write something or answer questions. Watch how the analysis metrics (sentiment, bias, trust score) change based on your document settings!

**The goal:** Understand that AI responses are shaped by the data they're given. This has implications for data leverage, AI transparency, and why you shouldn't blindly trust AI outputs.

Upload a document and let's explore together! 📚"""


@app.get("/")
@app.get("/api")
def home():
    return {"message": "AI Input Insight API running!", "api_key_configured": api_key is not None}


@app.post("/api/extract-text")
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file (PDF or text)"""
    try:
        content = ""
        filename = file.filename or "unnamed"
        
        if filename.endswith(".pdf"):
            with pdfplumber.open(file.file) as pdf:
                content = "\n".join([
                    page.extract_text() 
                    for page in pdf.pages 
                    if page.extract_text()
                ])
        else:
            content = (await file.read()).decode("utf-8")
        
        # Generate a unique ID for this document
        doc_id = str(uuid.uuid4())
        
        # Calculate initial sentiment
        sentiment = TextBlob(content).sentiment.polarity if content else 0
        
        return {
            "id": doc_id,
            "filename": filename,
            "content": content,
            "sentiment_score": sentiment,
            "influence_score": 0.5
        }
    except Exception as e:
        print(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


@app.post("/api/generate-response")
@app.post("/generate-response")
async def generate_response(request: GenerateRequest):
    """Generate AI response based on documents and query"""
    
    # Filter out excluded documents
    included_docs = [doc for doc in request.documents if not doc.excluded]
    
    # If no documents are uploaded, return the onboarding message
    if not included_docs:
        return {
            "generated_text": ONBOARDING_MESSAGE,
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {
                "sentiment": 0.3,  # Slightly positive (welcoming)
                "bias": {"political": 0.0, "gender": 0.0},
                "trustScore": 1.0  # High trust for system message
            },
            "isOnboarding": True
        }
    
    # Check if API key is configured
    if not client:
        return {
            "generated_text": "⚠️ The Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to the environment variables.",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {
                "sentiment": -0.2,
                "bias": {"political": 0.0, "gender": 0.0},
                "trustScore": 0.5
            },
            "error": "API key not configured"
        }
    
    # Build document context with influence weighting
    document_texts = []
    for doc in included_docs:
        if doc.influence > 0:
            # Apply poisoning if set (for educational demonstration)
            content = apply_poisoning(doc.content, doc.poisoning_level)
            document_texts.append(
                f"Document '{doc.name}' (Influence: {doc.influence*100:.0f}%):\n{content}\n"
            )
    
    context_text = "\n".join(document_texts)
    
    # Build the prompt
    if context_text:
        prompt = f"""You are helping demonstrate how document context influences AI responses. 
The user has provided the following documents with their influence levels. 
Generate a response that reflects the content and style of these documents proportionally to their influence.

{context_text}

User Query: {request.query}

Respond naturally based on the documents provided."""
    else:
        prompt = request.query
    
    try:
        # Call Anthropic API
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        generated_text = response.content[0].text
        
        # Analyze the generated response
        sentiment_score = analysis_service.analyze_sentiment(generated_text)
        bias_scores = analysis_service.detect_bias(generated_text)
        
        # Calculate attribution data
        attribution_data = calculate_attribution(included_docs)
        
        trust_score = analysis_service.calculate_trust_score(
            attribution_data["baseKnowledge"],
            attribution_data["documents"]
        )
        
        return {
            "generated_text": generated_text,
            "attributions": [],
            "attributionData": attribution_data,
            "analysisData": {
                "sentiment": sentiment_score,
                "bias": bias_scores,
                "trustScore": trust_score
            }
        }
        
    except anthropic.APIConnectionError as e:
        print(f"Anthropic connection error: {e}")
        return {
            "generated_text": "⚠️ Unable to connect to the AI service. Please check your internet connection and try again.",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {
                "sentiment": 0,
                "bias": {"political": 0, "gender": 0},
                "trustScore": 0.5
            },
            "error": f"Connection error: {str(e)}"
        }
    except anthropic.AuthenticationError as e:
        print(f"Anthropic auth error: {e}")
        return {
            "generated_text": "⚠️ API authentication failed. The API key may be invalid or expired.",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {
                "sentiment": 0,
                "bias": {"political": 0, "gender": 0},
                "trustScore": 0.5
            },
            "error": f"Authentication error: {str(e)}"
        }
    except Exception as e:
        print(f"Anthropic API error: {e}")
        return {
            "generated_text": f"⚠️ An error occurred while generating the response: {str(e)}",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {
                "sentiment": 0,
                "bias": {"political": 0, "gender": 0},
                "trustScore": 0.5
            },
            "error": str(e)
        }


@app.post("/api/analyze-sentiment")
@app.post("/analyze-sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of provided text"""
    sentiment_score = analysis_service.analyze_sentiment(request.text)
    return {"sentiment_score": sentiment_score}


@app.post("/api/detect-bias")
@app.post("/detect-bias")
async def detect_bias(request: BiasRequest):
    """Detect potential bias in provided text"""
    bias_scores = analysis_service.detect_bias(request.text)
    return {"bias_scores": bias_scores}


@app.post("/api/calculate-trust-score")
@app.post("/calculate-trust-score")
async def calculate_trust_score(request: TrustScoreRequest):
    """Calculate trust score based on attribution data"""
    trust_score = analysis_service.calculate_trust_score(
        request.baseKnowledgePercentage,
        request.documentContributions
    )
    return {"trust_score": trust_score}


# Helper functions

def apply_poisoning(content: str, poisoning_level: float) -> str:
    """
    Apply data poisoning to content for educational demonstration.
    Shows how corrupted/manipulated data affects AI outputs.
    """
    if poisoning_level <= 0:
        return content
    
    import random
    
    # Different poisoning strategies based on level
    if poisoning_level < 0.3:
        # Light poisoning: Add some typos/noise
        words = content.split()
        num_to_corrupt = int(len(words) * poisoning_level * 0.1)
        for _ in range(num_to_corrupt):
            if words:
                idx = random.randint(0, len(words) - 1)
                words[idx] = words[idx][::-1]  # Reverse random words
        return " ".join(words)
    
    elif poisoning_level < 0.6:
        # Medium poisoning: Insert contradictory statements
        contradictions = [
            "\n[Note: The above information may be incorrect.]\n",
            "\n[Warning: This data has not been verified.]\n",
            "\n[Caution: Some facts here are disputed.]\n"
        ]
        insert_pos = len(content) // 2
        return content[:insert_pos] + random.choice(contradictions) + content[insert_pos:]
    
    else:
        # Heavy poisoning: Significant content manipulation
        sentences = content.split('.')
        random.shuffle(sentences)
        shuffled = '.'.join(sentences)
        return f"[CORRUPTED DATA] {shuffled[:int(len(shuffled) * (1 - poisoning_level * 0.5))]}"


def calculate_attribution(documents: List[DocumentInput]) -> Dict:
    """Calculate how much each document contributed to the response"""
    if not documents:
        return {"baseKnowledge": 100, "documents": []}
    
    # Base knowledge gets 40%, documents share the remaining 60%
    base_knowledge = 40
    doc_share = 60
    
    # Calculate total influence
    total_influence = sum(doc.influence for doc in documents)
    
    if total_influence == 0:
        return {"baseKnowledge": 100, "documents": []}
    
    # Distribute the 60% among documents based on their influence
    doc_contributions = []
    for doc in documents:
        contribution = (doc.influence / total_influence) * doc_share
        doc_contributions.append({
            "id": doc.id,
            "name": doc.name,
            "contribution": contribution
        })
    
    return {
        "baseKnowledge": base_knowledge,
        "documents": doc_contributions
    }


# Vercel serverless handler
handler = Mangum(app)

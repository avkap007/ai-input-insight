from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid

# Try to import anthropic - it might not be available until runtime
try:
    import anthropic
except ImportError:
    anthropic = None

# Load environment variables first
load_dotenv()

# Pydantic models for request validation
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

class BiasRequest(BaseModel):
    text: str

class TrustScoreRequest(BaseModel):
    baseKnowledgePercentage: float
    documentContributions: List[Dict]

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

# Get API key from environment
api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize Anthropic API client lazily (only when needed)
client = None

def get_anthropic_client():
    """Get or initialize Anthropic client"""
    global client
    if client is None:
        try:
            import anthropic
            if api_key:
                client = anthropic.Anthropic(api_key=api_key)
        except Exception as e:
            print(f"Error initializing Anthropic client: {e}")
            client = False  # Mark as tried
    return client if client else None

# Onboarding message when no documents are uploaded
ONBOARDING_MESSAGE = """👋 Welcome to AI Input Insight!

I'm an educational tool designed to help you explore how documents influence AI-generated responses.

**To get started:**

1. **Upload a document** - Use the panel on the left to upload a PDF or text file (like a writing sample, article, or any text you want to experiment with)

2. **Adjust the influence slider** - Control how much that document affects my responses (0-100%)

3. **Try the advanced controls** - Enable "Advanced Controls" to experiment with:
   - **Data Poisoning**: See how corrupted/noisy data affects AI outputs
   - **Document Exclusion**: Simulate "data strikes" by removing documents from context

4. **Ask me questions** - Once you have documents uploaded, ask me to write something or answer questions. Watch how the response changes based on your document settings!

**The goal:** Understand that AI responses are shaped by the data they're given. This has implications for data leverage, AI transparency, and why you shouldn't blindly trust AI outputs.

Upload a document and let's explore together! 📚"""


@app.get("/")
@app.get("/api")
@app.get("/api/")
def home():
    """Health check endpoint"""
    try:
        print(f"[home] API_KEY available: {api_key is not None}")
        print(f"[home] API_KEY value (first 10 chars): {api_key[:10] if api_key else 'NONE'}")
        return {
            "message": "AI Input Insight API running!",
            "api_key_configured": api_key is not None,
            "status": "ok"
        }
    except Exception as e:
        print(f"[home] Error in home: {e}")
        import traceback
        traceback.print_exc()
        return {
            "message": "API is running but with errors",
            "error": str(e),
            "status": "error"
        }


@app.get("/test")
@app.get("/api/test")
def test_endpoint():
    """Simple test endpoint to verify function is working"""
    print("[test] Test endpoint called")
    return {"test": "working", "timestamp": str(__import__('datetime').datetime.now())}


@app.get("/api/status")
@app.get("/status")
def status_endpoint():
    """Status check with diagnostics"""
    print("[status] Checking API status...")
    
    diagnostics = {
        "api_key_set": api_key is not None,
        "anthropic_available": anthropic is not None,
    }
    
    try:
        client_status = get_anthropic_client()
        diagnostics["anthropic_client_initialized"] = client_status is not None
        print(f"[status] Diagnostics: {diagnostics}")
    except Exception as e:
        print(f"[status] Error getting client: {e}")
        diagnostics["anthropic_client_error"] = str(e)
    
    return {
        "status": "ok",
        "diagnostics": diagnostics
    }


@app.post("/api/extract-text")
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file (PDF or text)"""
    print(f"[extract_text] Starting extraction for file: {file.filename}")
    try:
        content = ""
        filename = file.filename or "unnamed"
        
        # Read file contents into memory
        print(f"[extract_text] Reading file contents...")
        file_contents = await file.read()
        print(f"[extract_text] File size: {len(file_contents)} bytes")
        
        if filename.lower().endswith(".pdf"):
            print(f"[extract_text] Processing as PDF...")
            # Lazy import pdfplumber only when needed
            import io
            try:
                import pdfplumber
                print(f"[extract_text] pdfplumber imported successfully")
            except ImportError as ie:
                print(f"[extract_text] WARNING: pdfplumber not available: {ie}")
                content = "[PDF extraction not available - returning raw content]"
                raise
            
            try:
                # Use BytesIO to create a file-like object from bytes
                pdf_file = io.BytesIO(file_contents)
                print(f"[extract_text] Opening PDF with pdfplumber...")
                with pdfplumber.open(pdf_file) as pdf:
                    print(f"[extract_text] PDF has {len(pdf.pages)} pages")
                    content = "\n".join([
                        page.extract_text() or ""
                        for page in pdf.pages
                    ])
                print(f"[extract_text] Successfully extracted {len(content)} characters from PDF")
            except Exception as pdf_error:
                print(f"[extract_text] PDF extraction error: {pdf_error}")
                import traceback
                traceback.print_exc()
                content = f"[Error extracting PDF: {str(pdf_error)}]"
        else:
            print(f"[extract_text] Processing as text file...")
            # For text files, decode the bytes
            try:
                content = file_contents.decode("utf-8")
                print(f"[extract_text] Successfully decoded as UTF-8: {len(content)} characters")
            except UnicodeDecodeError:
                print(f"[extract_text] UTF-8 decode failed, trying latin-1...")
                # Try different encoding if UTF-8 fails
                try:
                    content = file_contents.decode("latin-1")
                    print(f"[extract_text] Successfully decoded as latin-1: {len(content)} characters")
                except Exception as enc_error:
                    print(f"[extract_text] All decoding attempts failed: {enc_error}")
                    content = f"[Error decoding file: {str(enc_error)}]"
        
        # Generate a unique ID for this document
        doc_id = str(uuid.uuid4())
        print(f"[extract_text] Returning document {doc_id}")
        
        return {
            "id": doc_id,
            "filename": filename,
            "content": content,
            "sentiment_score": 0,
            "influence_score": 0.5
        }
    except Exception as e:
        print(f"[extract_text] FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


@app.post("/api/generate-response")
@app.post("/generate-response")
async def generate_response(request: GenerateRequest):
    """Generate AI response based on documents and query"""
    print(f"[generate_response] Starting with query: {request.query[:50]}...")
    print(f"[generate_response] Received {len(request.documents)} documents")
    
    try:
        # Filter out excluded documents
        included_docs = [doc for doc in request.documents if not doc.excluded]
        print(f"[generate_response] {len(included_docs)} documents included after filtering")
        
        # If no documents are uploaded, return the onboarding message
        if not included_docs:
            print(f"[generate_response] No documents, returning onboarding message")
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
        
        # Check if API key is configured
        print(f"[generate_response] Checking Anthropic client...")
        anthropic_client = get_anthropic_client()
        print(f"[generate_response] Anthropic client available: {anthropic_client is not None}")
        
        if not anthropic_client:
            print(f"[generate_response] No Anthropic client, returning error message")
            return {
                "generated_text": "⚠️ The Anthropic API key is not configured. Please contact your instructor to set up the ANTHROPIC_API_KEY.",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {
                    "sentiment": -0.2,
                    "bias": {"political": 0.0, "gender": 0.0},
                    "trustScore": 0.5
                },
                "error": "API key not configured"
            }
    except Exception as e:
        print(f"[generate_response] ERROR in early checks: {e}")
        import traceback
        traceback.print_exc()
        return {
            "generated_text": f"⚠️ Error processing request: {str(e)}",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
            "error": str(e)
        }
    
    # Build the prompt with influence-aware instructions
    print(f"[generate_response] Building prompt...")
    prompt = build_educational_prompt(included_docs, request.query)
    print(f"[generate_response] Prompt length: {len(prompt)} characters")
    
    try:
        # Call Anthropic API
        print(f"[generate_response] Calling Anthropic API...")
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        print(f"[generate_response] Got response from Anthropic")
        
        generated_text = response.content[0].text
        print(f"[generate_response] Generated text length: {len(generated_text)} characters")
        
        # Simple analysis (no NLTK dependencies)
        sentiment_score = simple_sentiment(generated_text)
        bias_scores = simple_bias_detection(generated_text)
        attribution_data = calculate_attribution(included_docs)
        trust_score = simple_trust_score(attribution_data)
        
        print(f"[generate_response] Analysis complete")
        
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
        
    except Exception as e:
        # Try to handle anthropic-specific errors
        if anthropic:
            if isinstance(e, anthropic.APIConnectionError):
                print(f"[generate_response] Anthropic connection error: {e}")
                return {
                    "generated_text": "⚠️ Unable to connect to the AI service. Please check your internet connection and try again.",
                    "attributions": [],
                    "attributionData": {"baseKnowledge": 100, "documents": []},
                    "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
                    "error": f"Connection error: {str(e)}"
                }
            elif isinstance(e, anthropic.AuthenticationError):
                print(f"[generate_response] Anthropic auth error: {e}")
                return {
                    "generated_text": "⚠️ API authentication failed. The API key may be invalid or expired.",
                    "attributions": [],
                    "attributionData": {"baseKnowledge": 100, "documents": []},
                    "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
                    "error": f"Authentication error: {str(e)}"
                }
        
        print(f"[generate_response] FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "generated_text": f"⚠️ An error occurred while generating the response: {str(e)}",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
            "error": str(e)
        }


class TextRequest(BaseModel):
    text: str

@app.post("/api/analyze-sentiment")
@app.post("/analyze-sentiment")
async def analyze_sentiment(request: TextRequest):
    """Analyze sentiment of provided text"""
    try:
        sentiment_score = simple_sentiment(request.text)
        return {"sentiment_score": sentiment_score}
    except Exception as e:
        return {"sentiment_score": 0, "error": str(e)}


@app.post("/api/detect-bias")
@app.post("/detect-bias")
async def detect_bias(request: BiasRequest):
    """Detect potential bias in provided text"""
    try:
        bias_scores = simple_bias_detection(request.text)
        return {"bias_scores": bias_scores}
    except Exception as e:
        return {"bias_scores": {"political": 0, "gender": 0}, "error": str(e)}


@app.post("/api/calculate-trust-score")
@app.post("/calculate-trust-score")
async def calculate_trust_score(request: TrustScoreRequest):
    """Calculate trust score based on attribution data"""
    try:
        trust_score = simple_trust_score({
            "baseKnowledge": request.baseKnowledgePercentage,
            "documents": request.documentContributions
        })
        return {"trust_score": trust_score}
    except Exception as e:
        return {"trust_score": 0.5, "error": str(e)}


def build_educational_prompt(documents: List[DocumentInput], user_query: str) -> str:
    """
    Build a prompt that demonstrates how source documents influence AI responses.
    """
    document_sections = []
    
    for doc in documents:
        if doc.influence <= 0:
            continue
            
        # Apply poisoning if set
        content = apply_poisoning(doc.content, doc.poisoning_level)
        
        # Describe influence level
        if doc.influence >= 0.8:
            influence_instruction = "STRONGLY adopt the writing style, tone, vocabulary, and themes from this document"
        elif doc.influence >= 0.5:
            influence_instruction = "MODERATELY incorporate the style and elements from this document"
        elif doc.influence >= 0.2:
            influence_instruction = "SLIGHTLY hint at the style from this document, mostly use neutral tone"
        else:
            influence_instruction = "BARELY reference this document, use mostly neutral baseline"
        
        document_sections.append(f"""
--- DOCUMENT: {doc.name} ---
INFLUENCE LEVEL: {doc.influence * 100:.0f}%
INSTRUCTION: {influence_instruction}
{"⚠️ DATA QUALITY WARNING: This source appears corrupted or unreliable." if doc.poisoning_level > 0.3 else ""}

CONTENT:
{content[:3000]}  
--- END DOCUMENT ---
""")
    
    context = "\n".join(document_sections)
    
    prompt = f"""You are part of an educational demonstration showing how source data influences AI responses.

Your task: Respond to the user's request while reflecting the style, tone, and themes of the provided source documents according to their influence levels.

{context}

USER REQUEST: {user_query}

Remember: Your response should demonstrably reflect the source material's influence. If influence is high, strongly adopt that writing style. If influence is low, only subtle hints should appear."""

    return prompt


def apply_poisoning(content: str, poisoning_level: float) -> str:
    """Apply data poisoning to content for educational demonstration."""
    if poisoning_level <= 0:
        return content
    
    import random
    
    if poisoning_level < 0.3:
        words = content.split()
        num_to_corrupt = int(len(words) * poisoning_level * 0.1)
        for _ in range(num_to_corrupt):
            if words:
                idx = random.randint(0, len(words) - 1)
                words[idx] = words[idx][::-1]
        return " ".join(words)
    
    elif poisoning_level < 0.6:
        contradictions = [
            "\n[Note: The above information may be incorrect.]\n",
            "\n[Warning: This data has not been verified.]\n",
            "\n[Caution: Some facts here are disputed.]\n"
        ]
        insert_pos = len(content) // 2
        return content[:insert_pos] + random.choice(contradictions) + content[insert_pos:]
    
    else:
        sentences = content.split('.')
        random.shuffle(sentences)
        shuffled = '.'.join(sentences)
        return f"[CORRUPTED DATA] {shuffled[:int(len(shuffled) * (1 - poisoning_level * 0.5))]}"


def calculate_attribution(documents: List[DocumentInput]) -> Dict:
    """Calculate how much each document contributed to the response"""
    if not documents:
        return {"baseKnowledge": 100, "documents": []}
    
    base_knowledge = 40
    doc_share = 60
    total_influence = sum(doc.influence for doc in documents)
    
    if total_influence == 0:
        return {"baseKnowledge": 100, "documents": []}
    
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


def simple_sentiment(text: str) -> float:
    """Simple keyword-based sentiment analysis."""
    text_lower = text.lower()
    
    positive_words = ['good', 'great', 'excellent', 'happy', 'joy', 'love', 'wonderful', 
                      'amazing', 'fantastic', 'beautiful', 'best', 'brilliant', 'cheerful',
                      'delightful', 'enjoy', 'excited', 'friendly', 'glad', 'grateful']
    
    negative_words = ['bad', 'terrible', 'awful', 'sad', 'hate', 'horrible', 'worst',
                      'angry', 'fear', 'pain', 'ugly', 'evil', 'dark', 'death', 'kill',
                      'destroy', 'fail', 'wrong', 'broken', 'disaster', 'tragic']
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    total = positive_count + negative_count
    if total == 0:
        return 0.0
    
    return (positive_count - negative_count) / (total + 5)


def simple_bias_detection(text: str) -> Dict[str, float]:
    """Simple keyword-based bias detection."""
    text_lower = text.lower()
    
    left_words = ['liberal', 'progressive', 'democrat', 'socialism', 'equality']
    right_words = ['conservative', 'republican', 'traditional', 'capitalism', 'freedom']
    
    left_count = sum(1 for word in left_words if word in text_lower)
    right_count = sum(1 for word in right_words if word in text_lower)
    political_total = left_count + right_count
    political_bias = abs(left_count - right_count) / (political_total + 1) if political_total > 0 else 0.1
    
    masc_words = [' he ', ' his ', ' him ', ' man ', ' men ', ' boy ']
    fem_words = [' she ', ' her ', ' hers ', ' woman ', ' women ', ' girl ']
    
    masc_count = sum(1 for word in masc_words if word in text_lower)
    fem_count = sum(1 for word in fem_words if word in text_lower)
    gender_total = masc_count + fem_count
    gender_bias = abs(masc_count - fem_count) / (gender_total + 1) if gender_total > 0 else 0.1
    
    return {
        "political": min(1.0, political_bias),
        "gender": min(1.0, gender_bias)
    }


def simple_trust_score(attribution_data: Dict) -> float:
    """Calculate trust score based on source diversity"""
    docs = attribution_data.get("documents", [])
    if not docs:
        return 0.5
    
    num_sources = len(docs)
    diversity_score = min(1.0, num_sources / 5)
    
    base_ratio = attribution_data.get("baseKnowledge", 50) / 100
    balance_score = 1 - abs(0.5 - base_ratio)
    
    return (diversity_score * 0.4) + (balance_score * 0.6)


# Vercel serverless handler
handler = Mangum(app)

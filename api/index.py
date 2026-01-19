from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid

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
        return {
            "message": "AI Input Insight API running!",
            "api_key_configured": api_key is not None,
            "status": "ok"
        }
    except Exception as e:
        print(f"Error in home: {e}")
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
    return {"test": "working", "timestamp": str(__import__('datetime').datetime.now())}


@app.post("/api/extract-text")
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file (PDF or text)"""
    try:
        content = ""
        filename = file.filename or "unnamed"
        
        # Read file contents into memory
        file_contents = await file.read()
        
        if filename.lower().endswith(".pdf"):
            # Lazy import pdfplumber only when needed
            import io
            import pdfplumber
            try:
                # Use BytesIO to create a file-like object from bytes
                pdf_file = io.BytesIO(file_contents)
                with pdfplumber.open(pdf_file) as pdf:
                    content = "\n".join([
                        page.extract_text() or ""
                        for page in pdf.pages
                    ])
            except Exception as pdf_error:
                print(f"PDF extraction error: {pdf_error}")
                content = f"[Error extracting PDF: {str(pdf_error)}]"
        else:
            # For text files, decode the bytes
            try:
                content = file_contents.decode("utf-8")
            except UnicodeDecodeError:
                # Try different encoding if UTF-8 fails
                try:
                    content = file_contents.decode("latin-1")
                except Exception as enc_error:
                    print(f"Text decoding error: {enc_error}")
                    content = f"[Error decoding file: {str(enc_error)}]"
        
        # Generate a unique ID for this document
        doc_id = str(uuid.uuid4())
        
        return {
            "id": doc_id,
            "filename": filename,
            "content": content,
            "sentiment_score": 0,
            "influence_score": 0.5
        }
    except Exception as e:
        print(f"Error extracting text: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


@app.post("/api/generate-response")
@app.post("/generate-response")
async def generate_response(request: GenerateRequest):
    """Generate AI response based on documents and query"""
    try:
        # Filter out excluded documents
        included_docs = [doc for doc in request.documents if not doc.excluded]
        
        # If no documents are uploaded, return the onboarding message
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
        
        # Check if API key is configured
        anthropic_client = get_anthropic_client()
        if not anthropic_client:
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
        print(f"Error in generate_response early checks: {e}")
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
    prompt = build_educational_prompt(included_docs, request.query)
    
    try:
        # Call Anthropic API
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        generated_text = response.content[0].text
        
        # Simple analysis (no NLTK dependencies)
        sentiment_score = simple_sentiment(generated_text)
        bias_scores = simple_bias_detection(generated_text)
        attribution_data = calculate_attribution(included_docs)
        trust_score = simple_trust_score(attribution_data)
        
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
            "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
            "error": f"Connection error: {str(e)}"
        }
    except anthropic.AuthenticationError as e:
        print(f"Anthropic auth error: {e}")
        return {
            "generated_text": "⚠️ API authentication failed. The API key may be invalid or expired.",
            "attributions": [],
            "attributionData": {"baseKnowledge": 100, "documents": []},
            "analysisData": {"sentiment": 0, "bias": {"political": 0, "gender": 0}, "trustScore": 0.5},
            "error": f"Authentication error: {str(e)}"
        }
    except Exception as e:
        print(f"Anthropic API error: {e}")
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

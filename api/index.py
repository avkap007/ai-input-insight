from http.server import BaseHTTPRequestHandler
import json
import os
import uuid
import cgi
import random

# Get API key
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Onboarding message
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


def apply_poisoning(content: str, poisoning_level: float) -> str:
    """Apply data poisoning to content for educational demonstration."""
    if poisoning_level <= 0:
        return content
    
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


class handler(BaseHTTPRequestHandler):
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path in ['/', '/api', '/api/']:
            self.send_json_response({
                "message": "AI Input Insight API running!",
                "api_key_configured": ANTHROPIC_API_KEY is not None,
                "status": "ok"
            })
        elif '/test' in self.path:
            self.send_json_response({
                "test": "working",
                "api_key_set": ANTHROPIC_API_KEY is not None
            })
        else:
            self.send_json_response({"error": "Not found"}, 404)
    
    def do_POST(self):
        path = self.path
        
        if '/extract-text' in path:
            self.handle_extract_text()
        elif '/generate-response' in path:
            self.handle_generate_response()
        else:
            self.send_json_response({"error": "Unknown endpoint"}, 404)
    
    def handle_extract_text(self):
        """Handle file upload and text extraction"""
        try:
            content_type = self.headers.get('Content-Type', '')
            
            if 'multipart/form-data' in content_type:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': content_type}
                )
                
                if 'file' in form:
                    file_item = form['file']
                    filename = file_item.filename or 'unnamed.txt'
                    file_content = file_item.file.read()
                    
                    try:
                        content = file_content.decode('utf-8')
                    except UnicodeDecodeError:
                        content = file_content.decode('latin-1', errors='ignore')
                    
                    self.send_json_response({
                        "id": str(uuid.uuid4()),
                        "filename": filename,
                        "content": content,
                        "influence_score": 0.5
                    })
                else:
                    self.send_json_response({"error": "No file provided"}, 400)
            else:
                self.send_json_response({"error": "Expected multipart/form-data"}, 400)
                
        except Exception as e:
            self.send_json_response({"error": f"Extract error: {str(e)}"}, 500)
    
    def handle_generate_response(self):
        """Handle AI response generation with document influence"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(body.decode('utf-8'))
            
            query = data.get('query', '')
            documents = data.get('documents', [])
            
            # Filter excluded documents
            included_docs = [doc for doc in documents if not doc.get('excluded', False)]
            
            # If no documents, return onboarding
            if not included_docs:
                self.send_json_response({
                    "generated_text": ONBOARDING_MESSAGE,
                    "isOnboarding": True
                })
                return
            
            # Check API key
            if not ANTHROPIC_API_KEY:
                self.send_json_response({
                    "generated_text": "⚠️ API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.",
                    "isOnboarding": False
                })
                return
            
            # Call Anthropic API
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                
                # Build prompt with document context - apply poisoning FIRST
                doc_sections = []
                for doc in included_docs:
                    influence = doc.get('influence', 0.5)
                    poisoning_level = doc.get('poisoning_level', 0)
                    
                    # Apply poisoning BEFORE including in prompt
                    raw_content = doc.get('content', '')[:1500]  # Reduced for faster processing
                    content = apply_poisoning(raw_content, poisoning_level)
                    
                    # Strong, explicit influence instructions
                    if influence >= 0.8:
                        instruction = """STRONGLY adopt this document's writing style, tone, vocabulary, and perspective.
Your response should be written AS IF by this document's author.
Replicate its characteristic phrases, mood, and worldview."""
                    elif influence >= 0.5:
                        instruction = """MODERATELY incorporate this document's style.
Use some of its vocabulary and tone, but maintain your own voice mostly."""
                    elif influence >= 0.2:
                        instruction = """SLIGHTLY hint at this document's style.
Add just a few characteristic words or phrases, but keep response mostly neutral."""
                    else:
                        instruction = """IGNORE this document's style completely.
Use your baseline neutral tone."""
                    
                    poisoning_warning = ""
                    if poisoning_level > 0.3:
                        poisoning_warning = f"\n⚠️ DATA QUALITY WARNING: This source has {poisoning_level*100:.0f}% corruption/noise."
                    
                    doc_sections.append(f"""
--- DOCUMENT: {doc.get('name', 'Unnamed')} ---
INFLUENCE LEVEL: {influence * 100:.0f}%
INSTRUCTION: {instruction}{poisoning_warning}

CONTENT:
{content}
--- END DOCUMENT ---
""")
                
                context = "\n".join(doc_sections)
                
                prompt = f"""You are demonstrating how source documents influence AI responses.

{context}

USER REQUEST: {query}

CRITICAL: Your response must DEMONSTRABLY reflect the document influence levels above.
- At 100% influence: Response should be unmistakably written in that document's style
- At 0% influence: Response should ignore that document completely  
- At intermediate levels: Blend proportionally

Students will be comparing responses at different influence levels.
Make the style/tone changes OBVIOUS so they can see the difference."""

                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=512,  # Reduced for faster responses
                    messages=[{"role": "user", "content": prompt}]
                )
                
                generated_text = response.content[0].text
                
                # Simple response - just the text
                self.send_json_response({
                    "generated_text": generated_text,
                    "isOnboarding": False
                })
                
            except ImportError:
                self.send_json_response({
                    "generated_text": "⚠️ Anthropic library not available.",
                    "isOnboarding": False
                })
            except Exception as api_error:
                self.send_json_response({
                    "generated_text": f"⚠️ API Error: {str(api_error)}",
                    "isOnboarding": False
                })
                
        except Exception as e:
            self.send_json_response({
                "generated_text": f"⚠️ Server Error: {str(e)}",
                "isOnboarding": False
            })

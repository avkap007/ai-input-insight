from http.server import BaseHTTPRequestHandler
import json
import os
import uuid
import random

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

ONBOARDING_MESSAGE = """👋 Welcome to AI Input Insight!

I'm an educational tool designed to help you explore how documents influence AI-generated responses.

**To get started:**

1. **Upload a document** - Use the panel on the left to upload a text file
2. **Adjust the influence slider** - Control how much that document affects my responses (0-100%)
3. **Ask me questions** - Watch how the response changes based on your settings!

Upload a document and let's explore together! 📚"""


def apply_poisoning(content: str, poisoning_level: float) -> str:
    if poisoning_level <= 0:
        return content
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
        ]
        insert_pos = len(content) // 2
        return content[:insert_pos] + random.choice(contradictions) + content[insert_pos:]
    else:
        sentences = content.split('.')
        random.shuffle(sentences)
        shuffled = '.'.join(sentences)
        return f"[CORRUPTED DATA] {shuffled[:int(len(shuffled) * 0.7)]}"


class handler(BaseHTTPRequestHandler):
    
    def send_json(self, data, status=200):
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
        self.send_json({"status": "ok", "api_key_set": ANTHROPIC_API_KEY is not None})
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            # Check if it's a file upload (extract-text)
            content_type = self.headers.get('Content-Type', '')
            
            if '/extract-text' in self.path:
                # Handle file upload
                if 'multipart/form-data' in content_type:
                    # Parse boundary
                    boundary = content_type.split('boundary=')[1] if 'boundary=' in content_type else None
                    if boundary:
                        # Simple multipart parsing
                        parts = body.split(f'--{boundary}'.encode())
                        for part in parts:
                            if b'filename=' in part:
                                # Extract filename
                                header_end = part.find(b'\r\n\r\n')
                                if header_end > 0:
                                    headers = part[:header_end].decode('utf-8', errors='ignore')
                                    file_content = part[header_end+4:]
                                    # Remove trailing boundary stuff
                                    if b'\r\n--' in file_content:
                                        file_content = file_content[:file_content.find(b'\r\n--')]
                                    
                                    # Get filename from headers
                                    filename = 'document.txt'
                                    if 'filename="' in headers:
                                        start = headers.find('filename="') + 10
                                        end = headers.find('"', start)
                                        filename = headers[start:end]
                                    
                                    try:
                                        text = file_content.decode('utf-8')
                                    except:
                                        text = file_content.decode('latin-1', errors='ignore')
                                    
                                    self.send_json({
                                        "id": str(uuid.uuid4()),
                                        "filename": filename,
                                        "content": text,
                                        "influence_score": 0.5
                                    })
                                    return
                    
                    self.send_json({"error": "Could not parse file"}, 400)
                else:
                    self.send_json({"error": "Expected multipart/form-data"}, 400)
                return
            
            # Handle generate-response
            if '/generate-response' in self.path:
                data = json.loads(body.decode('utf-8'))
                query = data.get('query', '')
                documents = data.get('documents', [])
                
                included_docs = [d for d in documents if not d.get('excluded', False)]
                
                if not included_docs:
                    self.send_json({"generated_text": ONBOARDING_MESSAGE, "isOnboarding": True})
                    return
                
                if not ANTHROPIC_API_KEY:
                    self.send_json({"generated_text": "⚠️ API key not configured.", "isOnboarding": False})
                    return
                
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
                    
                    # Build context from documents
                    doc_parts = []
                    for doc in included_docs:
                        influence = doc.get('influence', 0.5)
                        poisoning = doc.get('poisoning_level', 0)
                        content = apply_poisoning(doc.get('content', '')[:1500], poisoning)
                        
                        if influence >= 0.8:
                            inst = "STRONGLY mimic this document's style and tone."
                        elif influence >= 0.5:
                            inst = "MODERATELY use this document's style."
                        elif influence >= 0.2:
                            inst = "SLIGHTLY hint at this document's style."
                        else:
                            inst = "IGNORE this document's style."
                        
                        doc_parts.append(f"[{doc.get('name', 'Doc')} - {int(influence*100)}% influence]\n{inst}\n{content}")
                    
                    context = "\n\n".join(doc_parts)
                    
                    prompt = f"""Documents for context:

{context}

User request: {query}

Respond in a way that reflects the document influence levels. Higher influence = more style mimicry."""
                    
                    response = client.messages.create(
                        model="claude-3-5-haiku-20241022",
                        max_tokens=800,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    self.send_json({"generated_text": response.content[0].text, "isOnboarding": False})
                    
                except Exception as e:
                    self.send_json({"generated_text": f"⚠️ Error: {str(e)}", "isOnboarding": False})
                return
            
            self.send_json({"error": "Unknown endpoint"}, 404)
            
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

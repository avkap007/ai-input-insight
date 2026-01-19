from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        
        response = {
            "message": "API is working!",
            "path": self.path,
            "api_key_configured": api_key is not None
        }
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        
        try:
            data = json.loads(body.decode('utf-8'))
        except:
            data = {}
        
        # Handle extract-text
        if '/extract-text' in self.path:
            response = {
                "id": "test-id-123",
                "filename": "test.txt",
                "content": "This is test content - API is working!",
                "sentiment_score": 0,
                "influence_score": 0.5
            }
        # Handle generate-response
        elif '/generate-response' in self.path:
            response = {
                "generated_text": "👋 Hello! The API is working. If you see this message, the backend is functional but we need to add the full functionality back.",
                "attributions": [],
                "attributionData": {"baseKnowledge": 100, "documents": []},
                "analysisData": {
                    "sentiment": 0.3,
                    "bias": {"political": 0.0, "gender": 0.0},
                    "trustScore": 1.0
                },
                "isOnboarding": True
            }
        else:
            response = {
                "message": "POST endpoint working",
                "path": self.path,
                "api_key_configured": api_key is not None,
                "received_data": data
            }
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import random

app = Flask(__name__)
CORS(app)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

ONBOARDING = """👋 Welcome! Upload a document to get started, then ask me to write something."""


def apply_poisoning(content, level):
    if level <= 0:
        return content
    if level < 0.3:
        words = content.split()
        for i in range(int(len(words) * level * 0.1)):
            if words:
                idx = random.randint(0, len(words) - 1)
                words[idx] = words[idx][::-1]
        return " ".join(words)
    elif level < 0.6:
        mid = len(content) // 2
        return content[:mid] + "\n[Warning: Unverified data]\n" + content[mid:]
    else:
        sentences = content.split('.')
        random.shuffle(sentences)
        return "[CORRUPTED] " + '.'.join(sentences)[:int(len(content) * 0.7)]


@app.route('/api/', methods=['GET'])
@app.route('/api', methods=['GET'])
def home():
    return jsonify({"status": "ok", "api_key_set": bool(ANTHROPIC_API_KEY)})


@app.route('/api/test-anthropic', methods=['GET'])
def test_anthropic():
    """Test endpoint to isolate Anthropic issues"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        resp = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=50,
            messages=[{"role": "user", "content": "Say hello in 5 words"}]
        )
        return jsonify({"success": True, "response": resp.content[0].text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/test-post', methods=['POST'])
def test_post():
    """Test if POST works"""
    data = request.get_json() or {}
    return jsonify({"received": data, "success": True})


@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    try:
        content = file.read().decode('utf-8')
    except:
        content = file.read().decode('latin-1', errors='ignore')
    
    return jsonify({
        "id": str(uuid.uuid4()),
        "filename": file.filename or "doc.txt",
        "content": content,
        "influence_score": 0.5
    })


@app.route('/api/generate-response', methods=['POST'])
def generate_response():
    data = request.get_json() or {}
    query = data.get('query', '')
    documents = data.get('documents', [])
    
    docs = [d for d in documents if not d.get('excluded', False)]
    
    if not docs:
        return jsonify({"generated_text": ONBOARDING, "isOnboarding": True})
    
    if not ANTHROPIC_API_KEY:
        return jsonify({"generated_text": "⚠️ API key not set", "isOnboarding": False})
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        parts = []
        for d in docs:
            inf = d.get('influence', 0.5)
            content = apply_poisoning(d.get('content', '')[:1500], d.get('poisoning_level', 0))
            
            if inf >= 0.8:
                inst = "STRONGLY mimic this style"
            elif inf >= 0.5:
                inst = "MODERATELY use this style"
            else:
                inst = "SLIGHTLY reference this style"
            
            parts.append(f"[{d.get('name', 'Doc')} {int(inf*100)}%] {inst}\n{content}")
        
        prompt = f"Context:\n{chr(10).join(parts)}\n\nRequest: {query}\n\nRespond reflecting the document styles based on their influence levels."
        
        resp = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({"generated_text": resp.content[0].text, "isOnboarding": False})
        
    except Exception as e:
        return jsonify({"generated_text": f"⚠️ Error: {str(e)}", "isOnboarding": False})



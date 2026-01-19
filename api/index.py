from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import random

app = Flask(__name__)
CORS(app)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

ONBOARDING = """👋 **Welcome to AI Input Insight!**

I'm an educational tool that demonstrates how documents influence AI-generated responses.

**To get started:**
1. **Upload a document** using the panel on the left (try the sample files!)
2. **Adjust the Influence slider** to control how much the document affects my writing style
3. **Ask me to write something** - like "Write a story about a child going shopping"
4. **Compare responses** at different influence levels to see the difference!

**Advanced features:**
- **Data Poisoning**: See how corrupted/unreliable data affects AI outputs
- **Document Exclusion**: Remove a document's influence entirely (simulates "data strikes")

Upload a document and let's explore how data shapes AI! 📚"""


def apply_poisoning(content, level):
    """Apply educationally meaningful data corruption to demonstrate data quality issues."""
    if level <= 0:
        return content
    
    if level < 0.3:
        # LIGHT POISONING: Subtle word substitutions
        # Educational: Shows how small errors in training data can flip meanings
        substitutions = [
            ("good", "bad"), ("happy", "sad"), ("success", "failure"),
            ("positive", "negative"), ("bright", "dark"), ("hope", "despair"),
            ("love", "hate"), ("safe", "dangerous"), ("trust", "fear")
        ]
        result = content
        changes_made = 0
        max_changes = max(1, int(level * 5))
        for old, new in substitutions:
            if changes_made >= max_changes:
                break
            if old in result.lower():
                # Case-insensitive replacement
                import re
                result = re.sub(re.escape(old), new, result, count=1, flags=re.IGNORECASE)
                changes_made += 1
        return f"{result}\n\n⚠️ [Minor data quality issues detected]"
    
    elif level < 0.6:
        # MEDIUM POISONING: Insert contradictory information
        # Educational: Shows how conflicting data sources confuse AI reasoning
        contradictions = [
            "\n\n📛 [CONFLICTING SOURCE]: Recent studies suggest the opposite conclusion may be true.\n",
            "\n\n📛 [DISPUTED DATA]: Multiple experts have challenged these claims as misleading.\n",
            "\n\n📛 [OUTDATED INFO]: This information may no longer be accurate or relevant.\n",
            "\n\n📛 [BIAS WARNING]: This source has known ideological biases that may affect accuracy.\n"
        ]
        mid = len(content) // 2
        return content[:mid] + random.choice(contradictions) + content[mid:]
    
    else:
        # HEAVY POISONING: Severe corruption with bias markers
        # Educational: Shows how heavily corrupted data produces unreliable, confused outputs
        sentences = content.split('.')
        random.shuffle(sentences)
        corrupted = '.'.join(sentences)[:int(len(content) * 0.5)]
        
        warnings = [
            "🚨 [SEVERE DATA CORRUPTION]",
            "🚨 [POTENTIALLY FABRICATED]", 
            "🚨 [UNRELIABLE SOURCE]"
        ]
        
        return f"{random.choice(warnings)}\n{corrupted}\n\n⛔ [DATA INTEGRITY: COMPROMISED - Information may be false, misleading, or manipulated]"


def get_influence_instruction(influence):
    """Generate specific, graduated influence instructions for the AI."""
    if influence >= 0.9:
        return """COMPLETELY TRANSFORM your writing to match this document:
- Adopt its EXACT vocabulary, phrases, and expressions
- Match its sentence structure, length, and rhythm
- Replicate its emotional tone precisely (dark/bright, formal/casual, etc.)
- Write AS IF you ARE this document's original author
- The style change should be unmistakable and dramatic"""
    
    elif influence >= 0.7:
        return """HEAVILY adopt this document's style:
- Use similar vocabulary and borrow characteristic phrases
- Match its general tone and emotional register
- Follow its sentence patterns and structure
- The influence should be clearly noticeable"""
    
    elif influence >= 0.5:
        return """MODERATELY blend this document's style:
- Incorporate some distinctive words or phrases
- Lean toward its emotional tone
- Mix its style with a neutral baseline
- The influence should be subtly detectable"""
    
    elif influence >= 0.3:
        return """LIGHTLY hint at this document's style:
- Include just 2-3 characteristic words or phrases
- Slightly tilt toward its tone
- Mostly maintain a neutral voice
- The influence should be barely noticeable"""
    
    else:
        return """MINIMALLY reference this document (almost ignore):
- Use at most 1 word or subtle hint from this style
- Maintain a completely neutral, balanced tone
- The document should have nearly zero effect on your response"""


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
        
        # Build context from documents with detailed influence instructions
        doc_sections = []
        for d in docs:
            influence = d.get('influence', 0.5)
            poisoning_level = d.get('poisoning_level', 0)
            
            # Apply poisoning to content
            raw_content = d.get('content', '')[:2000]
            content = apply_poisoning(raw_content, poisoning_level)
            
            # Get graduated influence instruction
            instruction = get_influence_instruction(influence)
            
            doc_sections.append(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 DOCUMENT: {d.get('name', 'Unnamed')}
📊 INFLUENCE LEVEL: {int(influence * 100)}%

🎯 STYLE INSTRUCTION:
{instruction}

📝 DOCUMENT CONTENT:
{content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")
        
        context = "\n".join(doc_sections)
        
        prompt = f"""You are an AI assistant demonstrating how source documents influence AI-generated responses. This is an EDUCATIONAL tool for students learning about AI and data.

=== SOURCE DOCUMENTS ===
{context}

=== USER REQUEST ===
{query}

=== CRITICAL INSTRUCTIONS ===
1. Your response MUST visibly reflect each document's influence level
2. Higher influence % = MORE vocabulary, tone, phrases, and style from that document
3. Lower influence % = MORE neutral, baseline response style
4. If you see poisoning/corruption warnings in the document, reflect uncertainty or confusion in your response
5. Students will be COMPARING responses at different influence levels, so make the style differences OBVIOUS and DRAMATIC

Generate your response now, following the influence instructions carefully:"""

        resp = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({"generated_text": resp.content[0].text, "isOnboarding": False})
        
    except Exception as e:
        return jsonify({"generated_text": f"⚠️ Error: {str(e)}", "isOnboarding": False})




# AI Input Insight

A tool to explore how document inputs influence AI responses by visualizing document-level influence and attribution.

## Overview

This application allows you to:
- Upload documents (PDF, TXT) or add text directly
- Adjust influence levels of each document
- Generate AI responses based on your documents and query
- Visualize which parts of the response came from which documents
- Analyze sentiment, bias, and trustworthiness of responses

## Technical Architecture

### Frontend
- React + TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Vite for development server

### Backend
- FastAPI (Python)
- SQLite database (via SQLAlchemy)
- Anthropic Claude API for generating responses
- NLP libraries for analysis (TextBlob, VADER, HateSonar)

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- An Anthropic API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-input-insight.git
   cd ai-input-insight
   ```

2. Install frontend dependencies
   ```bash
   npm install
   ```

3. Create and activate a Python virtual environment
   ```bash
   python -m venv fastapi-env
   source fastapi-env/bin/activate  # On Windows: fastapi-env\Scripts\activate
   ```

4. Install backend dependencies
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the `api` directory with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd api
   uvicorn main:app --reload
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Features

### Document Management
- Upload PDFs and text files
- Add text snippets directly
- Adjust document influence with sliders
- Exclude documents from context
- (Advanced) Simulate poisoning of documents

### AI Response Generation
- Query the AI based on your documents
- Visualize which parts of the response are attributed to which documents
- See the relative influence of each document on the response

### Analysis
- Sentiment analysis of AI responses
- Bias detection
- Trust score calculation

## Adding New NLP Libraries

To extend the application with additional NLP capabilities:

1. Add the library to `requirements.txt`
   ```
   new_library_name==version_number
   ```

2. Import and initialize the library in `api/main.py`
   ```python
   import new_library_name
   # Initialize as needed
   ```

3. Create or modify endpoints to use the new library
   ```python
   @app.post("/new-analysis-endpoint")
   async def new_analysis(data: dict):
       text = data.get("text", "")
       result = new_library_name.analyze(text)
       return {"analysis_result": result}
   ```

4. Update the frontend to call the new endpoint

### Example: Adding HateSonar

1. Add to requirements.txt:
   ```
   hatesonar==0.0.5
   ```

2. Implement in main.py:
   ```python
   from hatesonar import Sonar
   
   sonar = Sonar()
   
   @app.post("/detect-hate-speech")
   async def detect_hate_speech(data: dict):
       text = data.get("text", "")
       if not text:
           return {"hate_speech_result": {}, "error": "No text provided"}
       
       result = sonar.ping(text)
       return {"hate_speech_result": result}
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

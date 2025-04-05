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

## Project Structure

```
ai-input-insight/
├── api/                  # Backend FastAPI application
│   ├── main.py           # Main FastAPI application
│   ├── models.py         # Database models
│   └── ...
├── src/                  # Frontend React application
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── package.json          # Frontend dependencies
└── requirements.txt      # Backend dependencies
```

## Recent Fixes

- Fixed document upload UI update issue: Documents now appear immediately after upload without requiring a page refresh
- Improved error handling for document uploads
- Enhanced state management for document processing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Developed as part of CMPT 415 directed studies under guidance of Dr. Nic Vincent and Dr. Margaret Grant at Simon Fraser University

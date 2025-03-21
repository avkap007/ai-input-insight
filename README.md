# 🧠 AI Input Insight

**AI Input Insight** is a visual debugging and transparency tool for understanding how large language models (LLMs) synthesize responses based on different document inputs.

It supports:
- 📄 Uploading PDFs or entering custom snippets  
- 🌺 Adjusting influence and data poisoning levels  
- 💬 Analyzing sentiment, bias, and trust scoring  
- 🧩 Token attribution visualization from sources  

---

## 🌐 Project Access

> **For reference (old preview link):**  

---

## 🛠️ Tech Stack

### Frontend
- [React](https://react.dev/) + TypeScript  
- [Tailwind CSS](https://tailwindcss.com/)  
- [shadcn/ui](https://ui.shadcn.com/)  
- [Vite](https://vitejs.dev/)  
- [Recharts](https://recharts.org/en-US) for data visualization  

### Backend
- [FastAPI](https://fastapi.tiangolo.com/)  
- Python 3.9  
- NLP tools:
  - **Sentiment**: NLTK / VADER  
  - **Bias Detection**: TextBlob / Biaslyze *(planned)*  
  - **Trust Score**: Custom heuristics  
- [Supabase](https://supabase.com/) (PostgreSQL) for data storage  

---

## 🚧 Local Development Setup

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_REPO_URL>
cd ai-input-insight
```

### 2. Frontend Setup

```bash
npm install
npm run dev
```

> Runs on `http://localhost:5173`

### 3. Backend Setup (FastAPI)

It’s recommended to use a virtual environment:

```bash
cd backend  # or wherever `main.py` lives
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

Run the API server:

```bash
uvicorn main:app --reload
```

> Runs on `http://localhost:8000`

---

## 📦 Project Structure

```
/src
  ├── components/       # All UI components
  ├── hooks/            # React hooks
  ├── utils/            # Utility + analysis logic
  ├── services/         # API clients
  ├── types/            # Shared types
  └── pages/            # Route views like /about

/backend
  └── main.py           # FastAPI entrypoint
```

---

## 🧪 Analysis Features

- 🔍 **Influence Slider**: Adjust how much each document affects the response  
- 🧪 **Data Poisoning**: Simulate adversarial input impact  
- 🧠 **Token Attribution**: Map generated text back to documents  
- 📈 **Charts**: Source influence and sentiment visualizations  
- ✅ **Trust Score**: Evaluate response reliability  

---

## 📟 Backend `requirements.txt`

Ensure the following are present in `requirements.txt`:

```
fastapi
uvicorn
python-multipart
nltk
textblob
vaderSentiment
# optional/planned:
# biaslyze
```

Generate the file with:

```bash
pip freeze > requirements.txt
```

---

## 🚀 Deployment Plans

The app is currently being developed locally. Due to the large size (~400+ MB with `node_modules`), deployment is temporarily paused.

**Next steps:**
- Migrate backend to a serverless deployment (e.g., Supabase Functions or Railway)  
- Optimize frontend bundle for Vercel or Netlify  
- Attach a hosted PostgreSQL DB (or Supabase instance)  

---

## 🙏 Acknowledgments

This project was developed as a part of **CMPT 415 Directed Studies** under the supervision of:

- Dr. Nicholas Vincent  
- Dr. Margaret Grant  
Simon Fraser University  

---

## 📌 Future Work

- Add Biaslyze integration for deeper bias analysis  
- Support token-level hover-to-source explanations  
- Exportable attribution reports (PDF/CSV)  
- Deploy full-stack version with persistent DB  

---

## 📬 Contact

Built with love by **Avni Kapoor**  
✉️ `avnikapooredu@email.com` 

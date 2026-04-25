# 🏛️ BAGA — Bharat Autonomous Governance Agent

BAGA is an **Agentic AI platform** designed to bridge the gap between Indian citizens and their government. It transforms unstructured, multi-language complaints into actionable, routed tasks for the correct administrative authorities—from local Gram Panchayats to State-level utility boards.

![BAGA Banner](https://img.shields.io/badge/Status-Development-orange?style=for-the-badge)
![AI-Powered](https://img.shields.io/badge/AI-LangChain%20%2B%20Llama3-blue?style=for-the-badge)
![ML](https://img.shields.io/badge/ML-Scikit--learn-green?style=for-the-badge)

---

## 🚀 Key Features

### 🧠 Intelligent Complaint Routing
BAGA doesn't just keywords; it understands context. Using **LangChain** and **LLMs (Groq/Gemini)**, it automatically determines:
- **Jurisdiction**: Urban (Municipal), Rural (Panchayat), or State-level.
- **Department**: Routes to the exact department (e.g., Municipal Water Works vs. Zilla Parishad).
- **Officer Assignment**: Identifies the responsible officer title (e.g., Ward Officer, BDO, or Junior Engineer).
- **Priority**: Categorizes urgency (Critical, High, Medium, Low).

### ⏳ Predictive Resolution Engine
Beyond routing, BAGA uses a **Random Forest ML Model** trained on historical/synthetic data to predict the exact resolution time for each complaint, moving beyond generic SLA windows.

### 🌍 Multi-Language Native
India speaks many languages. BAGA supports **English, Hindi, and Marathi** out-of-the-box, allowing citizens to report issues in their native tongue.

### ⚖️ Accountability & Escalation
- **SLA Tracking**: Real-time countdowns for every filed complaint.
- **Officer Escalation**: If an SLA is breached, citizens can file a formal "Officer Accountability" report directly to the Admin portal.
- **Interactive Clarification**: If a complaint is ambiguous (e.g., "pipe leak"), the AI proactively asks for clarification (Water vs. Sewage) before routing.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Auth & DB**: [Firebase](https://firebase.google.com/) (Firestore + Authentication)
- **i18n**: [react-i18next](https://react.i18next.com/)

### Backend (AI & ML)
- **Framework**: [Python Flask](https://flask.palletsprojects.com/)
- **AI Orchestration**: [LangChain](https://www.langchain.com/)
- **Models**: Groq (Llama 3.3) / Google Gemini 2.0 Flash
- **Machine Learning**: Scikit-learn (Random Forest)

---

## 📂 Project Structure

```text
BAGA/
├── frontend/             # Next.js Application
│   ├── components/       # UI Components (ComplaintForm, Tracker, etc.)
│   ├── lib/              # i18n, Firebase, and Utility configurations
│   └── public/           # Static assets
├── backend/              # Flask AI Server
│   ├── governance.py     # Canonical Indian Governance Rules (The Knowledge Base)
│   ├── app.py            # API Endpoints & LangChain Logic
│   ├── train_model.py    # ML training script
│   └── models/           # Trained .pkl models
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+
- Firebase Project
- Groq or Google AI API Key

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py     # Generate models
python app.py             # Start server on :5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev               # Start Next.js on :3000
```

### 4. Environment Variables
Create `.env` in `backend/` and `.env.local` in `frontend/` as specified in the repository templates.

---

## 🏛️ Governance Logic
BAGA is built on a strictly defined **Governance Knowledge Base** (`governance.py`) that maps issues to the correct Indian administrative hierarchy:
- **Urban**: Municipal Corporations (Water, Sanitation, Roads).
- **Rural**: Gram Panchayats & Zilla Parishads.
- **State**: Electricity Boards & Regional Utilities.

---

## 📝 License
Built for the **SNJB Hackathon**. 

*"Empowering citizens through autonomous governance."*

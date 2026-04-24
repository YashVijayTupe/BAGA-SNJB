"""
app.py — BAGA Flask Backend
============================
Main API server providing:
  POST /process-complaint  →  AI-powered complaint parsing, routing & ML prediction
  GET  /health             →  Health check

Uses LangChain with Groq (Llama 3) or Google Gemini for zero-shot
extraction, and a trained Random Forest model for resolution time prediction.
"""

import os
import json
import traceback
print("DEBUG: app.py is executing!")
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# ML imports
import pickle
import numpy as np

# Local governance module
from governance import (
    build_prompt_routing_table,
    get_sla_range,
    PRIORITY_ENCODING,
    CATEGORY_ENCODING,
    JURISDICTION_ENCODING,
)

# ─────────────────────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─────────────────────────────────────────────────────────────
# AI PROVIDER SETUP
# ─────────────────────────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()

def get_llm():
    """Initialize the LLM based on the configured provider."""
    if AI_PROVIDER == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0,
            max_output_tokens=512,
        )
    else:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0,
            max_tokens=512,
            max_retries=1,
            timeout=15,
        )

# ─────────────────────────────────────────────────────────────
# ML MODEL LOADING
# ─────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "resolution_model.pkl")
ml_model = None

def load_ml_model():
    """Load the trained Random Forest model for resolution time prediction."""
    global ml_model
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            ml_model = pickle.load(f)
        print(f"[OK] ML Model loaded from {MODEL_PATH}")
    else:
        print(f"[WARN] ML Model not found at {MODEL_PATH}. Run train_model.py first.")
        print("   Resolution predictions will use SLA midpoint as fallback.")

# Temporary workaround for hanging model load on Windows
# load_ml_model()
print("[WARN] ML Model loading skipped to prevent hang. Using SLA midpoint.")


# ─────────────────────────────────────────────────────────────
# LANGCHAIN SYSTEM PROMPT (The Core of BAGA)
# ─────────────────────────────────────────────────────────────

# Dynamically build the routing table from governance.py
ROUTING_TABLE = build_prompt_routing_table()

SYSTEM_PROMPT = f"""You are BAGA (Bharat Autonomous Governance Agent), an expert AI system for
classifying and routing Indian citizen complaints to the correct government
department and officer.

You are an expert in Indian municipal governance, rural panchayat systems,
and state-level utility administration.

## YOUR TASK
Analyze the citizen's complaint text and extract:
1. **issue_category** — The category of the complaint
2. **jurisdiction_level** — Whether this is Urban, Rural, or State level
3. **assigned_department** — The exact government department to handle this
4. **officer_title** — The exact officer title responsible
5. **priority_level** — Critical, High, Medium, or Low

## CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

1. You MUST ONLY output values from the routing table below. Do NOT invent
   departments, officer titles, or categories that are not listed.

2. JURISDICTION DETECTION:
   - If the complaint mentions a city, municipal corporation, nagar palika,
     ward, urban area, or city name → jurisdiction_level = "Urban"
   - If the complaint mentions a village, gram panchayat, taluka, tehsil,
     block, rural area, gaon, or hamlet → jurisdiction_level = "Rural"
   - Electricity complaints (power, bijli, streetlight, transformer) are
     ALWAYS jurisdiction_level = "State" regardless of location.

3. CATEGORY DETECTION:
   - Water issues (pipes, supply, contamination, leaks) →
     Urban: "Water Supply" | Rural: "Water & Local Sanitation"
   - Sanitation issues (garbage, drains, sewage, waste) →
     Urban: "Sanitation & Solid Waste" | Rural: "Water & Local Sanitation"
   - Road/Infrastructure (potholes, bridges, footpaths) →
     Urban: "Roads & Infrastructure" | Rural: "Major Infrastructure & Roads"
   - Electricity (power cuts, poles, streetlights, transformers) →
     Always: "Electricity"

4. When the complaint is ambiguous about Urban vs Rural, default to "Urban".

5. When the complaint mentions Hindi/regional language terms:
   - "bijli", "light", "current" → Electricity
   - "paani", "pani", "jal", "neer" → Water
   - "kachra", "gandagi", "safai" → Sanitation
   - "sadak", "rasta", "gaddha" → Roads

{ROUTING_TABLE}

## OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No explanations, no markdown,
no extra text. Just the JSON:

{{{{
  "issue_category": "<exact category from table>",
  "jurisdiction_level": "<Urban|Rural|State>",
  "assigned_department": "<exact department from table>",
  "officer_title": "<MUST EXACTLY MATCH the officer_title string from the table above for the chosen department. Do NOT use synonyms like 'City Engineer' unless it is exactly in the table.>",
  "priority_level": "<Critical|High|Medium|Low>"
}}}}

## EXAMPLES

Complaint: "There is a huge pothole on MG Road near the municipal office, very dangerous for vehicles"
Output: {{{{"issue_category": "Roads & Infrastructure", "jurisdiction_level": "Urban", "assigned_department": "Municipal Public Works Department", "officer_title": "Executive Engineer (Roads)", "priority_level": "Medium"}}}}

Complaint: "Bijli nahi aa rahi hai 3 ghante se, transformer se awaaz aa rahi hai"
Output: {{{{"issue_category": "Electricity", "jurisdiction_level": "State", "assigned_department": "State Electricity Board (MSEDCL/MSEB)", "officer_title": "Junior Engineer (JE) / Lineman", "priority_level": "Critical"}}}}

Complaint: "Hamare gaon mein handpump kharab ho gaya hai, paani nahi aa raha"
Output: {{{{"issue_category": "Water & Local Sanitation", "jurisdiction_level": "Rural", "assigned_department": "Gram Panchayat", "officer_title": "Gram Sevak / Jal Surakshak", "priority_level": "Medium"}}}}

Complaint: "Ward 15 area mein kachra collection 1 hafte se nahi hua, bahut gandagi hai"
Output: {{{{"issue_category": "Sanitation & Solid Waste", "jurisdiction_level": "Urban", "assigned_department": "Municipal Solid Waste Management", "officer_title": "Sanitary Inspector (SI)", "priority_level": "Medium"}}}}

Now analyze the following citizen complaint:
"""


# ─────────────────────────────────────────────────────────────
# LANGCHAIN CHAIN
# ─────────────────────────────────────────────────────────────

prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{complaint_text}")
])

output_parser = JsonOutputParser()


def predict_resolution_hours(issue_category, jurisdiction_level, priority_level):
    """
    Use the trained ML model to predict resolution hours.
    Falls back to SLA midpoint if model is not available.
    """
    if ml_model is not None:
        try:
            # Encode features matching training schema
            cat_encoded = CATEGORY_ENCODING.get(issue_category, 0)
            jur_encoded = JURISDICTION_ENCODING.get(jurisdiction_level, 0)
            pri_encoded = PRIORITY_ENCODING.get(priority_level, 2)

            features = np.array([[cat_encoded, jur_encoded, pri_encoded]])
            prediction = ml_model.predict(features)[0]

            # Clamp to SLA bounds
            sla_min, sla_max = get_sla_range(issue_category, jurisdiction_level)
            clamped = max(sla_min, min(sla_max, round(prediction, 1)))
            return clamped

        except Exception as e:
            print(f"⚠️  ML prediction error: {e}")

    # Fallback: calculate dynamically based on priority
    sla_min, sla_max = get_sla_range(issue_category, jurisdiction_level)
    
    if priority_level == "Critical":
        return float(sla_min)
    elif priority_level == "High":
        return round(sla_min + (sla_max - sla_min) * 0.3, 1)
    elif priority_level == "Medium":
        return round((sla_min + sla_max) / 2, 1)
    else:
        return float(sla_max)


# ─────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "BAGA Backend",
        "ai_provider": AI_PROVIDER,
        "ml_model_loaded": ml_model is not None,
        "timestamp": datetime.now().isoformat()
    })


@app.route("/process-complaint", methods=["POST"])
def process_complaint():
    print("DEBUG: Received request to /process-complaint")
    """
    Main endpoint: Process a citizen complaint using AI + ML.

    Request JSON:
      { "raw_text": "complaint text here" }

    Response JSON:
      {
        "issue_category": "...",
        "jurisdiction_level": "...",
        "assigned_department": "...",
        "officer_title": "...",
        "priority_level": "...",
        "predicted_hours": 36.0,
        "status": "Routed",
        "processed_at": "2026-04-22T21:00:00"
      }
    """
    try:
        data = request.get_json()

        if not data or "raw_text" not in data:
            return jsonify({
                "error": "Missing 'raw_text' in request body"
            }), 400

        raw_text = data["raw_text"].strip()

        if len(raw_text) < 5:
            return jsonify({
                "error": "Complaint text too short. Please provide more details."
            }), 400

        # ── Step 1: AI Classification via LangChain ──
        print("DEBUG: Getting LLM...")
        
        if AI_PROVIDER == "mock":
            import random
            print("DEBUG: Using MOCK AI Provider due to network issues.")
            
            # Clarification check for ambiguous 'pipeline'
            text_lower = raw_text.lower()
            if any(p in text_lower for p in ["pipeline", "pipleline", "pipe"]) and not any(w in text_lower for w in ["water", "paani", "drain", "sewer", "gas", "pani", "jal"]):
                return jsonify({
                    "needs_clarification": True,
                    "clarification_question": "Are you referring to a drinking water pipeline or a drainage/sewage pipeline?"
                }), 200

            ai_result = {
                "issue_category": "Roads & Infrastructure",
                "jurisdiction_level": "Urban",
                "assigned_department": "Municipal Public Works Department",
                "officer_title": "Executive Engineer (Roads)",
                "priority_level": "Medium"
            }
            # Add some randomness to the mock to make it look real
            if "water" in raw_text.lower() or "paani" in raw_text.lower():
                ai_result = {
                    "issue_category": "Water Supply",
                    "jurisdiction_level": "Urban",
                    "assigned_department": "Municipal Water Works Department",
                    "officer_title": "Ward Officer / Assistant Engineer",
                    "priority_level": "High"
                }
            elif "village" in raw_text.lower() or "gaon" in raw_text.lower():
                ai_result = {
                    "issue_category": "Water & Local Sanitation",
                    "jurisdiction_level": "Rural",
                    "assigned_department": "Gram Panchayat",
                    "officer_title": "Gram Sevak / Jal Surakshak",
                    "priority_level": "High"
                }
            elif any(kw in raw_text.lower() for kw in ["power", "electric", "rlrctricity", "elctricity", "electricity", "bijli", "light", "transformer", "pole", "mseb", "wire"]):
                ai_result = {
                    "issue_category": "Electricity",
                    "jurisdiction_level": "State",
                    "assigned_department": "State Electricity Board (MSEDCL/MSEB)",
                    "officer_title": "Junior Engineer (JE) / Lineman / Assistant Engineer (AE)",
                    "priority_level": "Critical"
                }
            
            print(f"DEBUG: AI Result (MOCKED): {ai_result}")
        else:
            try:
                llm = get_llm()
                chain = prompt_template | llm | output_parser
                print(f"DEBUG: Invoking chain with text: {raw_text[:30]}...")
                import time
                start = time.time()
                # LangChain doesn't easily accept invoke timeouts for all LLMs, so we configure it on the LLM initialization in get_llm, but for safety:
                ai_result = chain.invoke({"complaint_text": raw_text})
                print(f"DEBUG: AI Result: {ai_result} (took {time.time()-start:.1f}s)")
            except Exception as e:
                print(f"ERROR: AI Provider failed: {e}")
                return jsonify({"error": "AI classification failed. The AI provider might be unreachable or the API key is invalid."}), 503

        # Validate required fields
        required_fields = [
            "issue_category", "jurisdiction_level",
            "assigned_department", "officer_title", "priority_level"
        ]
        for field in required_fields:
            if field not in ai_result:
                return jsonify({
                    "error": f"AI response missing field: {field}",
                    "ai_raw": ai_result
                }), 500

        # ── Step 2: ML Prediction ──
        predicted_hours = predict_resolution_hours(
            ai_result["issue_category"],
            ai_result["jurisdiction_level"],
            ai_result["priority_level"]
        )

        # ── Step 3: Build final response ──
        response = {
            "issue_category": ai_result["issue_category"],
            "jurisdiction_level": ai_result["jurisdiction_level"],
            "assigned_department": ai_result["assigned_department"],
            "officer_title": ai_result["officer_title"],
            "priority_level": ai_result["priority_level"],
            "predicted_hours": predicted_hours,
            "status": "Routed",
            "processed_at": datetime.now().isoformat()
        }

        print(f"[OK] Complaint processed: {ai_result['issue_category']} -> "
              f"{ai_result['assigned_department']} ({predicted_hours}h)")

        return jsonify(response), 200

    except json.JSONDecodeError as e:
        return jsonify({
            "error": "AI returned invalid JSON. Retrying may help.",
            "details": str(e)
        }), 500

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    print("=" * 60)
    print("  BAGA Backend - Bharat Autonomous Governance Agent")
    print(f"  AI Provider : {AI_PROVIDER.upper()}")
    print(f"  ML Model    : {'Loaded [OK]' if ml_model else 'Not Found [WARN]'}")
    print(f"  Port        : {port}")
    print("=" * 60)

    app.run(host="0.0.0.0", port=port, debug=False)

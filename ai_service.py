from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")

CATEGORIES = ["sports","politics","technology","business","health","entertainment"]
category_embeddings = model.encode(CATEGORIES)

# 🔥 UPDATED STATE KEYWORDS
STATE_KEYWORDS = {
    "tamil nadu": ["tamil nadu","chennai","coimbatore","madurai","trichy","salem","vellore","tn","dmk","aiadmk"],
    "andhra pradesh": ["andhra","visakhapatnam","vizag","amaravati","vijayawada","tirupati","ap","ys jagan"],
    "karnataka": ["karnataka","bangalore","bengaluru","mysore","hubli","mangalore"],
    "kerala": ["kerala","kochi","ernakulam","trivandrum","kozhikode","calicut"],
    "telangana": ["telangana","hyderabad","warangal","karimnagar","ktr","kcr"]
}

# 🔥 WEIGHTED STATE DETECTION
def detect_state(text):
    text = text.lower()
    scores = {state: 0 for state in STATE_KEYWORDS}

    for state, words in STATE_KEYWORDS.items():
        for w in words:
            if w in text:
                scores[state] += 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "india"

def cosine(a,b):
    return np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b))

@app.post("/classify")
async def classify(data: dict):
    text = data.get("text","")

    emb = model.encode([text])[0]
    scores = [cosine(emb,c) for c in category_embeddings]

    category = CATEGORIES[int(np.argmax(scores))]
    state = detect_state(text)

    return {
        "category": category,
        "state": state,
        "summary": text[:120]
    }
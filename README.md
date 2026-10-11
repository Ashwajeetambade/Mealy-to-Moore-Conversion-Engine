# Mealy to Moore Machine Converter & TOC State Engine
Author: **Ashwajeet** | Theory of Computation Platform

A full-stack, pure Neumorphic Theory of Computation (TOC) web application that dynamically converts user-inputted Mealy machine matrices into their mathematically equivalent Moore machine matrices, complete with step-by-step educational derivations and an interactive string simulator.

---

## 🌐 Live Deployments

- **Backend API (Render):** [https://mealy-backend-4hh0.onrender.com](https://mealy-backend-4hh0.onrender.com)
- **API Health Check:** [https://mealy-backend-4hh0.onrender.com/api/health](https://mealy-backend-4hh0.onrender.com/api/health)
- **Frontend Hosting:** Vercel (Edge CDN with automatic Render API proxy rewrites)

---

## 📁 Project Structure

```text
.
├── frontend/
│   ├── index.html           # Main Neumorphic application UI
│   ├── styles.css           # Pure Neumorphic styling tokens & responsive layout
│   ├── app.js               # Dynamic UI state, matrix editor, and PWA install logic
│   ├── converter.js         # Client-side automata conversion and simulation engine
│   ├── diagram.js           # Dynamic SVG state transition visualizer
│   ├── service-worker.js    # PWA service worker with asset caching
│   ├── manifest.json        # PWA Web App Manifest (standalone mode)
│   ├── vercel.json          # Vercel deployment configuration & API rewrites
│   ├── icons/               # PWA icons (192x192, 512x512, maskable)
│   ├── favicon.svg          # Neumorphic automaton icon
│   ├── privacy.html         # Dedicated Privacy Policy page
│   └── terms.html           # Dedicated Terms and Conditions page
├── backend/
│   ├── main.py              # FastAPI application with REST endpoints & static serving
│   ├── converter_engine.py  # Pydantic schemas and TOC conversion engine
│   ├── requirements.txt     # Backend dependencies (fastapi, uvicorn, pydantic)
│   ├── test_converter.py    # Python automated unit test suite
│   ├── test_dynamic_api.py  # Automated API integration test suite
│   ├── test_presets.py      # Automated 4 Presets verification suite
│   └── test_converter.js    # Node.js automated unit test suite
├── render.yaml              # Render blueprint specification for 1-click cloud deployment
├── .gitignore               # Standard Git ignore file
└── README.md
```

---

## 🚀 How to Run Locally

### Option 1: Run Full-Stack with FastAPI Backend (Recommended)
From the root or `backend/` directory:
```powershell
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Then open: **`http://localhost:8000`** in your browser (or access from mobile on your local Wi-Fi).  
FastAPI automatically serves the API endpoints at `/api/convert` and `/api/simulate`, plus the complete `frontend/` directory.

### Option 2: Run Frontend Directly via Static Server
From the `frontend/` directory:
```powershell
cd frontend
python -m http.server 3000
```
Then open: **`http://localhost:3000`** in your browser.

---

## 🧪 Running Unit Tests

### Python Backend Tests:
```powershell
cd backend
python test_converter.py
python test_dynamic_api.py
python test_presets.py
```

### Node.js Tests:
```powershell
cd backend
node test_converter.js
```

---

## 📐 Core Algorithmic Workflow
1. **Analyze Incoming Transitions**: For each state $q \in Q$, gather $Out(q) = \{ \lambda(p, a) \mid \delta(p, a) = q \}$.
2. **State Splitting**: Split state $q$ into $k$ states based on distinct outputs: $q \to q_{y_1}, q_{y_2}, \dots$.
3. **Transition Table Reconstruction**: Inherit parent transitions and route next states to the output-specific target state.
4. **Equivalence & String Simulation**: Trace inputs through both machines to demonstrate that Moore produces an extra initial state output ($\text{length} = n + 1$) while matching Mealy outputs symbol-for-symbol.

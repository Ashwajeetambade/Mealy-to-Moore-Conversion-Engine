# Mealy to Moore Machine Converter & TOC State Engine

A full-stack, pure Neumorphic Theory of Computation (TOC) web application that dynamically converts user-inputted Mealy machine matrices into their mathematically equivalent Moore machine matrices, complete with step-by-step educational derivations and an interactive string simulator.

---

## Project Structure

```text
c:\Project\ashwajeet project\
├── frontend/
│   ├── index.html           # Main Neumorphic application UI
│   ├── styles.css           # Pure Neumorphic styling tokens & responsive layout
│   ├── app.js               # Dynamic UI state, matrix editor, and PWA install logic
│   ├── converter.js         # Client-side automata conversion and simulation engine
│   ├── diagram.js           # Dynamic SVG state transition visualizer
│   ├── service-worker.js    # PWA service worker with asset caching
│   ├── manifest.json        # PWA Web App Manifest (standalone mode)
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
└── README.md
```

---

## How to Run

### Option 1: Run Full-Stack with FastAPI Backend (Recommended)
From the root or `backend/` directory:
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```
Then open: **`http://localhost:8000`** in your browser.  
FastAPI automatically serves the API endpoints at `/api/convert` and `/api/simulate`, plus the complete `frontend/` directory.

### Option 2: Run Frontend Directly via Static Server
From the `frontend/` directory:
```powershell
cd frontend
python -m http.server 3000
```
Then open: **`http://localhost:3000`** in your browser.

---

## Running Unit Tests

### Python Backend Tests:
```powershell
cd backend
python test_converter.py
```

### Node.js Tests:
```powershell
cd backend
node test_converter.js
```

---

## Core Algorithmic Workflow
1. **Analyze Incoming Transitions**: For each state $q \in Q$, gather $Out(q) = \{ \lambda(p, a) \mid \delta(p, a) = q \}$.
2. **State Splitting**: Split state $q$ into $k$ states based on distinct outputs: $q \to q_{y_1}, q_{y_2}, \dots$.
3. **Transition Table Reconstruction**: Inherit parent transitions and route next states to the output-specific target state.
4. **Equivalence & String Simulation**: Trace inputs through both machines to demonstrate that Moore produces an extra initial state output ($\text{length} = n + 1$) while matching Mealy outputs symbol-for-symbol.

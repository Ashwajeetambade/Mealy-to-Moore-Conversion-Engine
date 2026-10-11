"""
FastAPI Server for Mealy to Moore Machine Conversion
Author: Ashwajeet | Theory of Computation Platform
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from converter_engine import (
    MealyToMooreConverter,
    MealyMachineSchema,
    MooreMachineSchema,
    ConversionResponse,
    SimulationResponse,
    PRESETS
)

app = FastAPI(
    title="TOC Mealy to Moore Converter API",
    description="Mathematical state-splitting conversion engine for automata theory",
    version="1.0.0"
)

# Enable CORS for cross-origin frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationPayload(BaseModel):
    mealy: MealyMachineSchema
    moore: MooreMachineSchema
    inputString: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Mealy to Moore Conversion Engine",
        "author": "Ashwajeet"
    }

@app.get("/api/presets")
def get_presets():
    return PRESETS

@app.get("/api/presets/{preset_id}")
def get_preset(preset_id: str):
    if preset_id not in PRESETS:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")
    return PRESETS[preset_id]

@app.post("/api/convert", response_model=ConversionResponse)
def convert_mealy_to_moore(payload: MealyMachineSchema):
    try:
        response = MealyToMooreConverter.convert(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulate", response_model=SimulationResponse)
def simulate_string(payload: SimulationPayload):
    try:
        response = MealyToMooreConverter.simulate(
            mealy=payload.mealy,
            moore=payload.moore,
            input_string=payload.inputString
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Mount frontend directory for seamless single-command serving
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

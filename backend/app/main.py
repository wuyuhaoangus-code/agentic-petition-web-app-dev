from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
import os

app = FastAPI(title="DreamCard AI API")

# Update CORS to allow your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "DreamCard AI API is running",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

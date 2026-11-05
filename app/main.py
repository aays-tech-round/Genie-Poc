import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import genie
from auth import validate_auth_config
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Refuse to start rather than serve Genie without authentication.
validate_auth_config()

app = FastAPI(
    title="Databricks Genie Integration API",
    description="Backend API to interact with Databricks Genie spaces via the SDK asynchronously.",
    version="1.0.0"
)

# Only the frontend origins listed in CORS_ORIGINS (comma-separated) may call this API from a browser.
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(genie.router, prefix="/api/v1/genie", tags=["Genie"])

@app.get("/")
def read_root():
    return {"message": "Databricks Genie Integration Backend is running."}

if __name__ == "__main__":
    import uvicorn
    # Run from this directory with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

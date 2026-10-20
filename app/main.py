from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import genie
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

app = FastAPI(
    title="Databricks Genie Integration API",
    description="Backend API to interact with Databricks Genie spaces via the SDK asynchronously.",
    version="1.0.0"
)

# Allow CORS for the custom UI to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(genie.router, prefix="/api/v1/genie", tags=["Genie"])

@app.get("/")
def read_root():
    return {"message": "Databricks Genie Integration Backend is running."}

if __name__ == "__main__":
    import uvicorn
    # Run from this directory with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# Databricks Genie Custom UI

This repository implements a production-grade, asynchronous integration between a custom React interface and the **Databricks Genie API**. It is broken into two distinct environments securely talking to each other locally.

## Architecture
- **Frontend**: A custom Next.js application styled heavily utilizing vanilla CSS modules to perfectly mirror modern, sleek "ChatGPT" glassmorphism aesthetics.
- **Backend API Layer**: A highly asynchronous Python FastAPI layer managing seamless Databricks SP OAuth handling and long-running job query polling using exponential backoff validation.

---

## 1. Environment Setup

Copy `.env.example` explicitly into a `.env` file at the root of the project to expose your Databricks API Keys.

```bash
cp .env.example .env
```

**CRITICAL: Service Principal Generation**
If using Databricks M2M OAuth, ensure your OAuth secret is explicitly generated from inside your **Databricks Workspace -> Settings -> Identity and Access -> Service principals**, *NOT* from Azure Portal!

## 2. Start the Backend API

We advise spinning the backend up efficiently leveraging a standard python isolation environment:

```bash
# Activate your VENV
source venv/bin/activate

# Install requirements mapped
pip install -r requirements.txt

# Run the backend locally
uvicorn app.main:app --port 8000 --reload
```
*The FastAPI application defaults to `http://localhost:8000`.*

---

## 3. Run the Next.js Frontend

Navigate into the UI framework directory to start the React interface:

```bash
cd ui
npm install
npm run dev -p 3001
```
*The Frontend will natively map to `http://localhost:3001`.*

## Polling & Connections
The backend automatically passes message statuses securely via REST over `.get_status()`. Timeouts operate effectively across 10-minute fallback blockers directly onto the local Network polling states without crashing your runtime environments when querying heavy Databricks SQL Warehouses.

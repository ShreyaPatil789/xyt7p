import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import DB_PATH
from app.routes import forecasts, analytics, procurement

app = FastAPI(
    title="AeroProcure UK - Day-Ahead Wind Forecasting & Procurement Cockpit",
    description="Interactive Day-Ahead decision support & forecast accuracy evaluation suite for UK Energy Utilities using Elexon BMRS datasets (FUELHH & WINDFOR).",
    version="1.0.0"
)

# Enable CORS for development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(forecasts.router)
app.include_router(analytics.router)
app.include_router(procurement.router)

@app.get("/api/health")
def health_check():
    db_exists = os.path.exists(DB_PATH)
    return {
        "status": "healthy" if db_exists else "initializing_db",
        "databasePath": DB_PATH,
        "databaseExists": db_exists
    }

# Check for production static frontend files
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not FRONTEND_DIST.exists():
    FRONTEND_DIST = Path(__file__).resolve().parent.parent / "static"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def read_root():
        return {
            "portal": "AeroProcure UK",
            "market": "UK Day-Ahead Wholesale Electricity Market",
            "period": "January 2026",
            "status": "online",
            "docsUrl": "/docs",
            "apiEndpoints": [
                "/api/forecasts/dates",
                "/api/forecasts/day",
                "/api/forecasts/evolution",
                "/api/analytics/monthly-summary",
                "/api/analytics/lead-time-curve",
                "/api/procurement/simulate"
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

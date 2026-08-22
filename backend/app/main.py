from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Dayflow HRMS API",
    description="Backend API services for Dayflow Human Resource Management System",
    version="1.0.0"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Dayflow HRMS API",
        "docs_url": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

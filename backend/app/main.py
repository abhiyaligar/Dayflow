from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, employees, attendance, leaves
from app.database import SessionLocal
from app.db.seed import seed_initial_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    async with SessionLocal() as db:
        await seed_initial_admin(db)
    yield
    # Shutdown actions (if any)


app = FastAPI(
    title="Dayflow HRMS API",
    description="Backend API services for Dayflow Human Resource Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api/v1/leaves", tags=["Leaves"])


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

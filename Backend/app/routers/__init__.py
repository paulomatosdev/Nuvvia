from fastapi import APIRouter

from app.routers import auth, users, appointments, exams, diets, meal_logs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(appointments.router)
api_router.include_router(exams.router)
api_router.include_router(diets.router)
api_router.include_router(meal_logs.router)

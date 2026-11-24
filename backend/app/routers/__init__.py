from fastapi import APIRouter

from app.routers import auth, consulta, dietas, exames, pacientes, registros_alimentares, usuarios

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(usuarios.router)
api_router.include_router(pacientes.router)
api_router.include_router(consulta.router)
api_router.include_router(exames.router)
api_router.include_router(dietas.router)
api_router.include_router(registros_alimentares.router)

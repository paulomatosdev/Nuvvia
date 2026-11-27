from fastapi import APIRouter

from app.routers import agendamento, alimentos, auth, consulta, dietas, exames, notificacoes, pacientes, questionario, registros_alimentares, usuarios

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(usuarios.router)
api_router.include_router(pacientes.router)
api_router.include_router(consulta.router)
api_router.include_router(exames.router)
api_router.include_router(dietas.router)
api_router.include_router(registros_alimentares.router)
api_router.include_router(questionario.router)
api_router.include_router(alimentos.router)
api_router.include_router(agendamento.router)
api_router.include_router(notificacoes.router)

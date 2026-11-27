import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.routers import api_router
from app.services.notificacoes import gerar_lembretes

settings = get_settings()
log = logging.getLogger("nuvvia")

INTERVALO_LEMBRETES_S = 15 * 60


async def _rodar_lembretes() -> None:
    """A cada 15 minutos, envia os lembretes da véspera das consultas."""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                enviados = await gerar_lembretes(db)
                if enviados:
                    log.info("Lembretes de consulta enviados: %s", enviados)
        except Exception:  # não derruba a API se o banco estiver fora do ar
            log.exception("Falha ao gerar lembretes de consulta")
        await asyncio.sleep(INTERVALO_LEMBRETES_S)


@asynccontextmanager
async def lifespan(_: FastAPI):
    tarefa = asyncio.create_task(_rodar_lembretes()) if settings.lembretes_automaticos else None
    yield
    if tarefa:
        tarefa.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await tarefa


app = FastAPI(
    title=settings.app_name,
    description="API do sistema de nutrição e saúde: agendamento, exames, dietas e acompanhamento de macros por IA.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["Status"])
async def health_check():
    return {"status": "ok", "app": settings.app_name}


@app.get("/", tags=["Status"])
async def root():
    return {"status": "ok", "app": settings.app_name}

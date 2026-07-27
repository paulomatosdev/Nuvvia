"""
Configuração da conexão com o banco (SQLAlchemy async) e sessão de uso
nas rotas via injeção de dependência.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Classe base para todos os modelos ORM."""
    pass


async def get_db():
    """Dependência do FastAPI: entrega uma sessão de banco por requisição."""
    async with AsyncSessionLocal() as session:
        yield session

"""
Fixtures de teste: sobe o app com um banco SQLite em memória
(não precisa de PostgreSQL rodando).
"""
import os
import tempfile

os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="nuvvia_uploads_")
os.environ["DEBUG"] = "false"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture
async def client():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    await engine.dispose()


async def criar_usuario(client, nome, email, perfil):
    r = await client.post(
        "/auth/registrar",
        json={"nome_completo": nome, "email": email, "senha": "senha-forte-123", "perfil_acesso": perfil},
    )
    assert r.status_code == 201, r.text
    r = await client.post("/auth/login", json={"email": email, "senha": "senha-forte-123"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    me = (await client.get("/usuarios/me", headers={"Authorization": f"Bearer {token}"})).json()
    return me["id"], {"Authorization": f"Bearer {token}"}

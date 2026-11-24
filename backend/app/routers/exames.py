import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import garantir_acesso_paciente, get_current_user, require_role
from app.database import get_db
from app.models.exame import Exame
from app.models.usuario import PerfilAcesso, Usuario
from app.schemas.exame import ExameLer
from app.services.uploads import EXTENSOES_EXAME, salvar_upload

router = APIRouter(prefix="/exames", tags=["Exames"])


@router.post("", response_model=ExameLer, status_code=201)
async def enviar_exame(
    paciente_id: uuid.UUID = Form(...),
    titulo: str = Form(..., max_length=150),
    data_exame: date = Form(...),
    notas: str | None = Form(None, max_length=2000),
    arquivo: UploadFile = File(...),
    current_user: Usuario = Depends(
        require_role(PerfilAcesso.NUTRICIONISTA, PerfilAcesso.PACIENTE)
    ),
    db: AsyncSession = Depends(get_db),
):
    await garantir_acesso_paciente(db, current_user, paciente_id)
    caminho, _ = await salvar_upload(arquivo, "exames", EXTENSOES_EXAME)

    exame = Exame(
        paciente_id=paciente_id,
        enviado_por_id=current_user.id,
        titulo=titulo,
        data_exame=data_exame,
        arquivo_url=str(caminho),
        notas=notas,
    )
    db.add(exame)
    await db.commit()
    await db.refresh(exame)
    return exame


@router.get("/paciente/{paciente_id}", response_model=list[ExameLer])
async def listar_exames_do_paciente(
    paciente_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await garantir_acesso_paciente(db, current_user, paciente_id)
    stmt = (
        select(Exame).where(Exame.paciente_id == paciente_id).order_by(Exame.data_exame.desc())
    )
    return (await db.scalars(stmt)).all()

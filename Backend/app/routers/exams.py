import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.config import get_settings
from app.database import get_db
from backend.app.models.exame import Exam
from Backend.app.models.usuario import User, UserRole
from app.schemas.exam import ExamRead

router = APIRouter(prefix="/exams", tags=["Exames"])
settings = get_settings()


@router.post("", response_model=ExamRead, status_code=201)
async def upload_exam(
    patient_id: uuid.UUID = Form(...),
    title: str = Form(...),
    exam_date: str = Form(...),
    notes: str | None = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.NUTRITIONIST, UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    upload_dir = Path(settings.upload_dir) / "exams"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    exam = Exam(
        patient_id=patient_id,
        uploaded_by_id=current_user.id,
        title=title,
        exam_date=exam_date,
        file_url=str(file_path),
        notes=notes,
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return exam


@router.get("/patient/{patient_id}", response_model=list[ExamRead])
async def list_patient_exams(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # paciente só vê os próprios exames; nutricionista pode ver de qualquer paciente
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    result = await db.execute(
        select(Exam).where(Exam.patient_id == patient_id).order_by(Exam.exam_date.desc())
    )
    return result.scalars().all()

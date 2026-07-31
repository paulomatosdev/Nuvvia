import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.config import get_settings
from app.database import get_db
from backend.app.models.registro_alimentar import MealLog, MealLogSource
from Backend.app.models.usuario import User, UserRole
from app.schemas.meal_log import MealLogRead, MealLogManualCreate, DailyMacroSummary
from app.services.ai_macro_service import estimate_macros_from_photo

router = APIRouter(prefix="/meal-logs", tags=["Diário de refeições"])
settings = get_settings()


@router.post("/photo", response_model=MealLogRead, status_code=201)
async def log_meal_from_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await file.read()

    upload_dir = Path(settings.upload_dir) / "meal_photos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(image_bytes)

    ai_result = await estimate_macros_from_photo(image_bytes)

    meal_log = MealLog(
        patient_id=current_user.id,
        source=MealLogSource.PHOTO_AI,
        photo_url=str(file_path),
        description=ai_result.description,
        calories=ai_result.calories,
        protein_g=ai_result.protein_g,
        carbs_g=ai_result.carbs_g,
        fat_g=ai_result.fat_g,
        ai_confidence=ai_result.ai_confidence,
    )
    db.add(meal_log)
    await db.commit()
    await db.refresh(meal_log)
    return meal_log


@router.post("/manual", response_model=MealLogRead, status_code=201)
async def log_meal_manually(
    payload: MealLogManualCreate,
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    meal_log = MealLog(
        patient_id=current_user.id,
        source=MealLogSource.MANUAL,
        **payload.model_dump(),
    )
    db.add(meal_log)
    await db.commit()
    await db.refresh(meal_log)
    return meal_log


@router.get("/today", response_model=list[MealLogRead])
async def list_today_logs(
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = (
        select(MealLog)
        .where(MealLog.patient_id == current_user.id, MealLog.logged_at >= today_start)
        .order_by(MealLog.logged_at)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/summary/today", response_model=DailyMacroSummary)
async def daily_summary(
    current_user: User = Depends(require_role(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = select(
        func.coalesce(func.sum(MealLog.calories), 0),
        func.coalesce(func.sum(MealLog.protein_g), 0),
        func.coalesce(func.sum(MealLog.carbs_g), 0),
        func.coalesce(func.sum(MealLog.fat_g), 0),
    ).where(MealLog.patient_id == current_user.id, MealLog.logged_at >= today_start)

    result = await db.execute(stmt)
    calories, protein, carbs, fat = result.one()

    profile = current_user.patient_profile
    return DailyMacroSummary(
        date=today_start,
        calories_consumed=calories,
        protein_consumed_g=protein,
        carbs_consumed_g=carbs,
        fat_consumed_g=fat,
        calorie_target=profile.daily_calorie_target if profile else None,
        protein_target_g=profile.daily_protein_target_g if profile else None,
        carbs_target_g=profile.daily_carbs_target_g if profile else None,
        fat_target_g=profile.daily_fat_target_g if profile else None,
    )

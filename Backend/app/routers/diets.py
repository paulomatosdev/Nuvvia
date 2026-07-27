import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.diet import DietPlan, PlannedMeal
from app.models.user import User, UserRole
from app.schemas.diet import DietPlanCreate, DietPlanRead

router = APIRouter(prefix="/diets", tags=["Dietas"])


@router.post("", response_model=DietPlanRead, status_code=201)
async def create_diet_plan(
    payload: DietPlanCreate,
    current_user: User = Depends(require_role(UserRole.NUTRITIONIST)),
    db: AsyncSession = Depends(get_db),
):
    diet_plan = DietPlan(
        patient_id=payload.patient_id,
        nutritionist_id=current_user.id,
        title=payload.title,
        goal=payload.goal,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    diet_plan.meals = [PlannedMeal(**meal.model_dump()) for meal in payload.meals]

    db.add(diet_plan)
    await db.commit()
    await db.refresh(diet_plan, attribute_names=["meals"])
    return diet_plan


@router.get("/patient/{patient_id}", response_model=list[DietPlanRead])
async def list_patient_diet_plans(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    stmt = (
        select(DietPlan)
        .where(DietPlan.patient_id == patient_id)
        .options(selectinload(DietPlan.meals))
        .order_by(DietPlan.start_date.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

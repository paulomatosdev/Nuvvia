from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.usuario import NutricionistaPerfil, PacientePerfil, PerfilAcesso, Usuario
from app.schemas.usuario import LoginRequest, Token, UsuarioCriar, UsuarioLer

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar", response_model=UsuarioLer, status_code=status.HTTP_201_CREATED)
async def registrar(payload: UsuarioCriar, db: AsyncSession = Depends(get_db)):
    if payload.perfil_acesso == PerfilAcesso.ADMIN:
        raise HTTPException(status_code=403, detail="Não é possível se cadastrar como admin")

    email = payload.email.lower()
    existente = await db.scalar(select(Usuario).where(Usuario.email == email))
    if existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    usuario = Usuario(
        nome_completo=payload.nome_completo,
        email=email,
        senha_hashed=hash_password(payload.senha),
        perfil_acesso=payload.perfil_acesso,
    )
    if payload.perfil_acesso == PerfilAcesso.PACIENTE:
        usuario.paciente_perfil = PacientePerfil()
    else:
        # CRN é preenchido depois em PUT /usuarios/me/nutricionista-perfil
        usuario.nutricionista_perfil = NutricionistaPerfil()

    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def _autenticar(db: AsyncSession, email: str, senha: str) -> Token:
    usuario = await db.scalar(select(Usuario).where(Usuario.email == email.lower()))
    if not usuario or not verify_password(senha, usuario.senha_hashed):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Usuário desativado")
    return Token(access_token=create_access_token(subject=str(usuario.id)))


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login via JSON, usado pelo frontend."""
    return await _autenticar(db, payload.email, payload.senha)


@router.post("/token", response_model=Token, include_in_schema=False)
async def login_formulario(
    form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    """Login via formulário OAuth2, usado pelo botão "Authorize" do /docs."""
    return await _autenticar(db, form.username, form.password)

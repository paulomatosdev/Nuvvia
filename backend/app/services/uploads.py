"""Gravação segura de arquivos enviados (exames, fotos de refeição)."""
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import get_settings

settings = get_settings()

EXTENSOES_IMAGEM = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
EXTENSOES_EXAME = EXTENSOES_IMAGEM | {".pdf"}


async def salvar_upload(
    arquivo: UploadFile, subpasta: str, extensoes: set[str]
) -> tuple[Path, bytes]:
    """
    Valida extensão e tamanho e grava o arquivo com um nome gerado
    (o nome enviado pelo cliente nunca entra no caminho).
    """
    extensao = Path(arquivo.filename or "").suffix.lower()
    if extensao not in extensoes:
        permitidas = ", ".join(sorted(extensoes))
        raise HTTPException(
            status_code=400, detail=f"Tipo de arquivo não permitido. Use: {permitidas}"
        )

    limite = settings.max_upload_size_mb * 1024 * 1024
    conteudo = await arquivo.read(limite + 1)
    if len(conteudo) > limite:
        raise HTTPException(
            status_code=413, detail=f"Arquivo maior que {settings.max_upload_size_mb} MB"
        )
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    pasta = Path(settings.upload_dir) / subpasta
    pasta.mkdir(parents=True, exist_ok=True)
    caminho = pasta / f"{uuid.uuid4()}{extensao}"
    caminho.write_bytes(conteudo)
    return caminho, conteudo

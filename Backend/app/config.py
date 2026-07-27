"""
Configurações centrais da aplicação.
Lê variáveis de ambiente (ou arquivo .env) e expõe como objeto único.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Geral
    app_name: str = "Sistema de Nutrição e Saúde"
    environment: str = "development"
    debug: bool = True

    # Banco de dados
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nutricao_db"

    # Autenticação (JWT)
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h

    # Armazenamento de arquivos (fotos de refeição, exames, etc.)
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    # Serviço de IA (visão computacional para cálculo de macros)
    ai_provider_api_key: str = ""
    ai_provider_base_url: str = "https://api.anthropic.com/v1"

    # CORS - origens permitidas (app mobile/web, painel do nutricionista)
    allowed_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

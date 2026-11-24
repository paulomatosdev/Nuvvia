"""Tipos compartilhados entre os schemas."""
from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def _para_utc(valor: datetime) -> datetime:
    """
    Garante data/hora sempre em UTC e com fuso explícito.
    Datas sem fuso (ex: lidas do SQLite) são tratadas como UTC; datas com
    outro fuso são convertidas. Assim o frontend nunca interpreta errado.
    """
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc)


DataHoraUTC = Annotated[datetime, AfterValidator(_para_utc)]

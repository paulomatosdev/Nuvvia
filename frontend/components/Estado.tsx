import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "./ui/Button";

/** Esqueleto de linhas do painel enquanto carrega. */
export function LinhasCarregando({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-4">
          <div className="h-5 w-14 animate-pulse rounded bg-line" />
          <div className="h-5 flex-1 animate-pulse rounded bg-line" style={{ maxWidth: `${60 - i * 8}%` }} />
          <div className="h-5 w-20 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

/** Carregando / erro / vazio, no idioma do painel. */
export function Estado({
  loading,
  error,
  vazio,
  mensagemVazio,
  onRetry,
  linhas,
  children,
}: {
  loading: boolean;
  error: string | null;
  vazio?: boolean;
  mensagemVazio?: React.ReactNode;
  onRetry?: () => void;
  linhas?: number;
  children: React.ReactNode;
}) {
  if (loading) return <LinhasCarregando linhas={linhas} />;
  if (error) {
    return (
      <div role="alert" className="flex items-center gap-4 px-4 py-5">
        <AlertCircle className="size-5 shrink-0 text-alert" strokeWidth={2} aria-hidden />
        <p className="flex-1 text-base text-ink">{error}</p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Tentar de novo
          </Button>
        )}
      </div>
    );
  }
  if (vazio) return <div className="px-4 py-8 text-base text-muted">{mensagemVazio}</div>;
  return <>{children}</>;
}

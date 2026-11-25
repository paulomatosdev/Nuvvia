"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { TipoConsulta } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { Button } from "./ui/Button";

const campo = "campo";
const rotulo = "rotulo mb-1.5 block text-muted";

/**
 * Agendamento de consulta. A nutricionista escolhe o paciente; o paciente
 * (paraPaciente) escolhe a nutricionista.
 */
export function NovaConsultaForm({
  onCreated,
  onCancel,
  paraPaciente = false,
}: {
  onCreated: () => void;
  onCancel: () => void;
  paraPaciente?: boolean;
}) {
  const pacientes = useApi<{ id: string; nome_completo: string }[]>(
    paraPaciente ? api.nutricionistas : api.pacientes,
    [paraPaciente]
  );
  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState<TipoConsulta>("online");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [duracao, setDuracao] = useState(45);
  const [local, setLocal] = useState("");
  const [notas, setNotas] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const quando = new Date(`${data}T${horario}`);
    if (Number.isNaN(quando.getTime())) {
      setErro("Informe data e horário válidos.");
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        tipo_consulta: tipo,
        agendamento_data: quando.toISOString(),
        duracao_minutos: duracao,
        local: tipo === "pessoal" ? local : null,
        notas: notas || null,
      };
      if (paraPaciente) await api.agendarComNutricionista({ ...dados, nutricionista_id: pacienteId });
      else await api.criarConsulta({ ...dados, paciente_id: pacienteId });
      onCreated();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível agendar");
    } finally {
      setSalvando(false);
    }
  }

  const semPacientes = !pacientes.loading && (pacientes.data ?? []).length === 0;

  return (
    <form onSubmit={salvar} className="rounded-lg border border-line bg-surface p-6">
      <h2 className="mb-5 text-xl font-bold text-ink">{paraPaciente ? "Agendar consulta" : "Nova consulta"}</h2>

      {semPacientes ? (
        <p className="text-base text-muted">
          {paraPaciente
            ? "Ainda não há nutricionistas cadastradas para agendar."
            : "Você ainda não tem pacientes vinculados. O paciente aparece aqui depois de agendar a primeira consulta."}
        </p>
      ) : (
        <div className="grid grid-cols-6 gap-x-4 gap-y-5">
          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="paciente" className={rotulo}>
              {paraPaciente ? "Nutricionista" : "Paciente"}
            </label>
            <select
              id="paciente"
              required
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className={campo}
              disabled={pacientes.loading}
            >
              <option value="">{pacientes.loading ? "Carregando…" : "Selecione"}</option>
              {(pacientes.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_completo}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="col-span-6 sm:col-span-3">
            <legend className={rotulo}>Tipo</legend>
            <div className="flex gap-2">
              {(
                [
                  ["online", "Online"],
                  ["pessoal", "Presencial"],
                ] as [TipoConsulta, string][]
              ).map(([valor, label]) => (
                <label
                  key={valor}
                  className={`flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-base text-center transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gate ${
                    tipo === valor ? "border-ink bg-ink text-bg font-semibold" : "border-line bg-surface text-muted hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={valor}
                    checked={tipo === valor}
                    onChange={() => setTipo(valor)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="col-span-6 sm:col-span-2">
            <label htmlFor="data" className={rotulo}>
              Data
            </label>
            <input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} className={campo} />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <label htmlFor="horario" className={rotulo}>
              Horário
            </label>
            <input
              id="horario"
              type="time"
              required
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className={campo}
            />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <label htmlFor="duracao" className={rotulo}>
              Duração (min)
            </label>
            <input
              id="duracao"
              type="number"
              min={10}
              max={240}
              step={5}
              required
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className={campo}
            />
          </div>

          {tipo === "pessoal" && (
            <div className="col-span-6">
              <label htmlFor="local" className={rotulo}>
                Local
              </label>
              <input
                id="local"
                required
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Endereço do consultório"
                className={campo}
              />
            </div>
          )}

          <div className="col-span-6">
            <label htmlFor="notas" className={rotulo}>
              Observações (opcional)
            </label>
            <textarea id="notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} className={campo} />
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-4 text-base text-alert">
          {erro}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {!semPacientes && (
          <Button type="submit" disabled={salvando}>
            {salvando ? "Agendando…" : "Agendar"}
          </Button>
        )}
      </div>
    </form>
  );
}

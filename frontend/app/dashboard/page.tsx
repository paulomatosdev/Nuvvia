import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { AppointmentRow } from "@/components/AppointmentRow";
import { PatientCard } from "@/components/PatientCard";
import { mockAppointments, mockPatients } from "@/lib/mock-data";

export default function DashboardPage() {
  const todayAppointments = mockAppointments.filter((a) => a.date === "Hoje");
  const attentionPatients = [...mockPatients].sort((a, b) => a.adherence - b.adherence).slice(0, 2);

  return (
    <AppShell>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-ink/50">Terça-feira, 25 de julho</p>
        <h1 className="font-display text-3xl text-ink mt-1">Boa tarde, Dra. Karoline Gomes</h1>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Consultas hoje" value={String(todayAppointments.length)} />
        <StatCard label="Pacientes ativos" value={String(mockPatients.length)} />
        <StatCard label="Adesão média" value="81%" hint="últimos 7 dias" />
      </section>

      <div className="grid grid-cols-5 gap-8">
        <section className="col-span-3">
          <h2 className="font-display text-xl text-ink mb-4">Agenda de hoje</h2>
          <div className="rounded-xl border border-line bg-card px-5">
            {todayAppointments.map((a) => (
              <AppointmentRow key={a.id} appointment={a} />
            ))}
          </div>
        </section>

        <section className="col-span-2">
          <h2 className="font-display text-xl text-ink mb-4">Precisam de atenção</h2>
          <div className="flex flex-col gap-3">
            {attentionPatients.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

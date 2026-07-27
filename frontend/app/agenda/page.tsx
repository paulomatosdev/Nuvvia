import { AppShell } from "@/components/AppShell";
import { AppointmentRow } from "@/components/AppointmentRow";
import { Button } from "@/components/ui/Button";
import { mockAppointments } from "@/lib/mock-data";

export default function AgendaPage() {
  const byDate = mockAppointments.reduce<Record<string, typeof mockAppointments>>((acc, a) => {
    acc[a.date] = acc[a.date] ? [...acc[a.date], a] : [a];
    return acc;
  }, {});

  return (
    <AppShell>
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">Agenda</p>
          <h1 className="font-display text-3xl text-ink mt-1">Consultas</h1>
        </div>
        <Button>Nova consulta</Button>
      </header>

      <div className="flex flex-col gap-8">
        {Object.entries(byDate).map(([date, appointments]) => (
          <section key={date}>
            <h2 className="font-display text-lg text-ink/70 mb-3">{date}</h2>
            <div className="rounded-xl border border-line bg-card px-5">
              {appointments.map((a) => (
                <AppointmentRow key={a.id} appointment={a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

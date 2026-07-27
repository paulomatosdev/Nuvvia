import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlateRing } from "@/components/PlateRing";
import { mockPatients } from "@/lib/mock-data";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = mockPatients.find((p) => p.id === params.id);
  if (!patient) notFound();

  return (
    <AppShell>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-ink/50">{patient.goal}</p>
        <h1 className="font-display text-3xl text-ink mt-1">{patient.name}</h1>
        <p className="text-sm text-ink/50 mt-1">Última consulta em {patient.lastVisit}</p>
      </header>

      <div className="grid grid-cols-5 gap-8">
        <section className="col-span-2 rounded-xl border border-line bg-card p-6 flex flex-col items-center">
          <PlateRing macros={patient.macros} size={160} />
          <p className="text-sm text-ink/50 mt-4">Consumo de hoje vs. meta</p>
        </section>

        <section className="col-span-3">
          <h2 className="font-display text-xl text-ink mb-4">Macros de hoje</h2>
          <div className="rounded-xl border border-line bg-card divide-y divide-line">
            {patient.macros.map((m) => (
              <div key={m.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-ink">{m.label}</span>
                <span className="text-sm text-ink/60">
                  {m.consumed} / {m.target} {m.label === "Calorias" ? "kcal" : "g"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

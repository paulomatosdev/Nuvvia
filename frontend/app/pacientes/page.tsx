import { AppShell } from "@/components/AppShell";
import { PatientCard } from "@/components/PatientCard";
import { mockPatients } from "@/lib/mock-data";

export default function PatientsPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-ink/50">Pacientes</p>
        <h1 className="font-display text-3xl text-ink mt-1">Seus pacientes</h1>
      </header>

      <div className="flex flex-col gap-3 max-w-3xl">
        {mockPatients.map((p) => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>
    </AppShell>
  );
}

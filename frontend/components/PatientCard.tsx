import Link from "next/link";
import { Patient } from "@/lib/types";
import { PlateRing } from "./PlateRing";

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Link
      href={`/pacientes/${patient.id}`}
      className="flex items-center gap-5 rounded-xl border border-line bg-card px-5 py-4 hover:border-forest/40 transition-colors"
    >
      <PlateRing macros={patient.macros} size={72} />

      <div className="flex-1 min-w-0">
        <p className="font-display text-lg text-ink truncate">{patient.name}</p>
        <p className="text-xs text-ink/50 mt-0.5">{patient.goal} · última consulta {patient.lastVisit}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-display text-xl text-forest">{patient.adherence}%</p>
        <p className="text-xs text-ink/50">adesão na semana</p>
      </div>
    </Link>
  );
}

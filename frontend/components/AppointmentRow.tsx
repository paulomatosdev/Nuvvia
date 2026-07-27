import { Appointment } from "@/lib/types";

const STATUS_STYLE: Record<Appointment["status"], string> = {
  Agendada: "bg-mustard/15 text-mustard",
  Confirmada: "bg-forest/10 text-forest",
  Concluída: "bg-ink/10 text-ink/60",
};

export function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-14 text-sm font-medium text-ink/70">{appointment.time}</div>
        <div>
          <p className="text-sm font-medium text-ink">{appointment.patientName}</p>
          <p className="text-xs text-ink/50">{appointment.type} · {appointment.date}</p>
        </div>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[appointment.status]}`}>
        {appointment.status}
      </span>
    </div>
  );
}

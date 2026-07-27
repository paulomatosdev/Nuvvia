export type MacroGoal = {
  label: string;
  consumed: number;
  target: number;
  colorVar: "forest" | "plum" | "mustard" | "teal";
};

export type Patient = {
  id: string;
  name: string;
  goal: "Emagrecimento" | "Hipertrofia" | "Manutenção" | "Condição de saúde";
  lastVisit: string;
  macros: MacroGoal[];
  adherence: number; // % de dias com meta batida na última semana
};

export type Appointment = {
  id: string;
  patientName: string;
  type: "Presencial" | "Online";
  time: string;
  date: string;
  status: "Agendada" | "Confirmada" | "Concluída";
};

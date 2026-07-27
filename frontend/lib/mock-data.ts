import { Patient, Appointment } from "./types";

export const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Marina Souza",
    goal: "Emagrecimento",
    lastVisit: "18 jul",
    adherence: 86,
    macros: [
      { label: "Calorias", consumed: 1450, target: 1700, colorVar: "forest" },
      { label: "Proteína", consumed: 92, target: 110, colorVar: "plum" },
      { label: "Carboidrato", consumed: 130, target: 160, colorVar: "mustard" },
      { label: "Gordura", consumed: 42, target: 55, colorVar: "teal" },
    ],
  },
  {
    id: "2",
    name: "Rafael Nogueira",
    goal: "Hipertrofia",
    lastVisit: "22 jul",
    adherence: 63,
    macros: [
      { label: "Calorias", consumed: 2100, target: 2900, colorVar: "forest" },
      { label: "Proteína", consumed: 140, target: 190, colorVar: "plum" },
      { label: "Carboidrato", consumed: 210, target: 320, colorVar: "mustard" },
      { label: "Gordura", consumed: 60, target: 80, colorVar: "teal" },
    ],
  },
  {
    id: "3",
    name: "Beatriz Lima",
    goal: "Condição de saúde",
    lastVisit: "10 jul",
    adherence: 94,
    macros: [
      { label: "Calorias", consumed: 1580, target: 1600, colorVar: "forest" },
      { label: "Proteína", consumed: 78, target: 85, colorVar: "plum" },
      { label: "Carboidrato", consumed: 140, target: 150, colorVar: "mustard" },
      { label: "Gordura", consumed: 48, target: 50, colorVar: "teal" },
    ],
  },
];

export const mockAppointments: Appointment[] = [
  { id: "a1", patientName: "Marina Souza", type: "Online", time: "09:00", date: "Hoje", status: "Confirmada" },
  { id: "a2", patientName: "João Pedro Alves", type: "Presencial", time: "10:30", date: "Hoje", status: "Agendada" },
  { id: "a3", patientName: "Rafael Nogueira", type: "Online", time: "14:00", date: "Hoje", status: "Confirmada" },
  { id: "a4", patientName: "Beatriz Lima", type: "Presencial", time: "08:30", date: "Amanhã", status: "Agendada" },
];

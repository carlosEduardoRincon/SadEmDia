import { Patient, PatientPriority, ProfessionalType } from '../types';
import { differenceInDays } from 'date-fns';

export type AdmissionPhase = 'recent' | 'second_week' | 'after_two_weeks';

/** Recém-admitido: < 7 dias. Segunda semana: 7–13 dias. Após duas semanas: >= 14 dias. */
export function getAdmissionPhase(
  createdAt: Date,
  currentDate: Date = new Date()
): AdmissionPhase {
  const days = differenceInDays(currentDate, createdAt instanceof Date ? createdAt : new Date(createdAt));
  if (days < 7) return 'recent';
  if (days < 14) return 'second_week';
  return 'after_two_weeks';
}

/** Opções para enriquecer prioridade com regras de visita por fase de admissão. */
export interface VisitCountsForPriority {
  visitsToday: number;
  visitsThisWeek: number;
}

export function patientNeedsPrescription(
  patient: Patient,
  currentDate: Date = new Date()
): boolean {
  if (!patient.needsPrescription) return false;
  if (!patient.nextPrescriptionDue) return true;
  // Exibir apenas se a data passou ou está a 7 dias ou menos da próxima entrega
  const daysUntilDue = differenceInDays(patient.nextPrescriptionDue, currentDate);
  return daysUntilDue <= 7;
}

/**
 * Escala de prioridade (0–100):
 * 1. Recém admitido (< 1 semana): 40 pts
 * 2. Terminal: 30 pts
 * 3. Ventilação Mecânica: 20 pts
 * 4. Oncológico: 10 pts
 */
const MAX_SCORE = 100;

const PRIORITY_WEIGHTS: Record<string, number> = {
  'Terminal': 30,
  'Ventilação Mecânica': 20,
  'Oncológico': 10,
};

export function calculatePatientPriority(
  patient: Patient,
  currentDate: Date = new Date(),
  visitCounts?: VisitCountsForPriority
): PatientPriority {
  let priorityScore = 0;
  const reasons: string[] = [];

  // 1. Recém admitido (< 1 semana): maior prioridade
  const admissionRef = patient.admissionDate ?? patient.createdAt;
  if (admissionRef) {
    const phase = getAdmissionPhase(admissionRef, currentDate);
    if (phase === 'recent') {
      priorityScore += 40;
      reasons.push('Recém admitido (< 1 semana)');
    }
  }

  // 2–4. Comorbidades na ordem: Terminal, Ventilação Mecânica, Oncológico
  if (patient.comorbidities && patient.comorbidities.length > 0) {
    for (const c of patient.comorbidities) {
      const weight = PRIORITY_WEIGHTS[c];
      if (weight !== undefined) {
        priorityScore += weight;
        reasons.push(c);
      }
    }
  }

  const clampedScore = Math.round(Math.min(MAX_SCORE, Math.max(0, priorityScore)));

  return {
    patient,
    priorityScore: clampedScore,
    reasons,
  };
}

export function sortPatientsByPriority(patients: Patient[]): PatientPriority[] {
  const priorities = patients.map(patient => calculatePatientPriority(patient));
  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function filterPatientsByProfessionalType(
  priorities: PatientPriority[],
  professionalType: ProfessionalType
): PatientPriority[] {
  return priorities.filter(() => true);
}

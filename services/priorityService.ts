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
 * 5. Sem visita hoje: +70 pts (quem não recebeu nenhuma visita fica à frente de quem já recebeu)
 * 6. Com visita hoje: -25 pts por visita
 */
const MAX_SCORE = 100;
const NO_VISIT_TODAY_BONUS = 70; // Garante que 0 visitas > qualquer paciente com 1+ visita
const VISIT_TODAY_PENALTY = 25;

const PRIORITY_WEIGHTS: Record<string, number> = {
  'Terminal': 30,
  'Ventilação Mecânica': 20,
  'Oncológico': 10,
};

/** Retorna quantas visitas são necessárias hoje (ou esta semana para após 2 sem). */
function getRequiredVisits(
  admissionRef: Date | undefined,
  currentDate: Date,
  visitCounts?: VisitCountsForPriority
): { required: number; met: boolean } {
  if (!admissionRef || !visitCounts) return { required: 1, met: false };
  const phase = getAdmissionPhase(admissionRef, currentDate);
  if (phase === 'recent') {
    const met = visitCounts.visitsToday >= 2;
    return { required: 2, met };
  }
  if (phase === 'second_week') {
    const met = visitCounts.visitsToday >= 1;
    return { required: 1, met };
  }
  const met = visitCounts.visitsThisWeek >= 1;
  return { required: 1, met };
}

export function calculatePatientPriority(
  patient: Patient,
  currentDate: Date = new Date(),
  visitCounts?: VisitCountsForPriority
): PatientPriority {
  const reasons: string[] = [];
  const admissionRef = patient.admissionDate ?? patient.createdAt;

  // Se já recebeu todos os atendimentos necessários do dia/semana → prioridade 0
  if (visitCounts && admissionRef) {
    const { met } = getRequiredVisits(admissionRef, currentDate, visitCounts);
    if (met) {
      return {
        patient,
        priorityScore: 0,
        reasons: ['Atendimentos do dia concluídos'],
      };
    }
  }

  let priorityScore = 0;

  // 1. Recém admitido (< 1 semana): maior prioridade
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

  // 5–6. Sem visita hoje: bônus grande (fica à frente). Com visita: penalidade.
  if (visitCounts) {
    if (visitCounts.visitsToday === 0) {
      priorityScore += NO_VISIT_TODAY_BONUS;
      reasons.push('Sem atendimento no dia');
    } else {
      const penalty = visitCounts.visitsToday * VISIT_TODAY_PENALTY;
      priorityScore -= penalty;
      reasons.push(`${visitCounts.visitsToday} visita(s) hoje`);
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

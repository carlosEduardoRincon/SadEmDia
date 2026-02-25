import { Patient, PatientPriority, ProfessionalType } from '../types';
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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

export function calculatePatientPriority(
  patient: Patient,
  currentDate: Date = new Date(),
  visitCounts?: VisitCountsForPriority
): PatientPriority {
  let priorityScore = 0;
  const reasons: string[] = [];

  const admissionRef = patient.admissionDate ?? patient.createdAt;
  if (admissionRef && visitCounts) {
    const phase = getAdmissionPhase(admissionRef, currentDate);
    const { visitsToday, visitsThisWeek } = visitCounts;
    if (phase === 'recent') {
      const required = 2;
      if (visitsToday < required) {
        const deficit = required - visitsToday;
        priorityScore += deficit * 15;
        reasons.push(`Recém-admitido: ${visitsToday}/${required} visitas hoje`);
      }
    } else if (phase === 'second_week') {
      const required = 1;
      if (visitsToday < required) {
        priorityScore += 15;
        reasons.push(`Segunda semana: precisa 1 visita/dia (${visitsToday} hoje)`);
      }
    } else {
      const required = 1;
      if (visitsThisWeek < required) {
        priorityScore += 20;
        reasons.push(`Após 2 semanas: precisa 1 visita/semana (${visitsThisWeek} esta semana)`);
      }
    }
  }

  if (patient.comorbidities && patient.comorbidities.length > 0) {
    const comorbidityScore = patient.comorbidities.length * 10;
    priorityScore += comorbidityScore;
    reasons.push(`${patient.comorbidities.length} comorbidade(s)`);
  }

  const needsPrescriptionNow = patientNeedsPrescription(patient, currentDate);

  if (needsPrescriptionNow) {
    priorityScore += 30;
    reasons.push('Precisa de receita médica');
  }

  if (patient.lastVisit) {
    const daysSinceLastVisit = differenceInDays(currentDate, patient.lastVisit);
    
    if (daysSinceLastVisit >= 3) {
      priorityScore += daysSinceLastVisit * 5;
      reasons.push(`${daysSinceLastVisit} dias sem visita`);
    }

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    if (isWeekend && !isWithinInterval(patient.lastVisit, { start: weekStart, end: weekEnd })) {
      priorityScore += 25;
      reasons.push('Sem visita nesta semana');
    }
  } else {
    priorityScore += 50;
    reasons.push('Nunca recebeu visita');
  }

  if (patient.visitRequests && patient.visitRequests.length > 0) {
    priorityScore += patient.visitRequests.length * 15;
    reasons.push(`${patient.visitRequests.length} solicitação(ões) pendente(s)`);
  }

  return {
    patient,
    priorityScore,
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

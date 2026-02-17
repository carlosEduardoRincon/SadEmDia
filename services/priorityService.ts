import { Patient, PatientPriority, ProfessionalType } from '../types';
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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
  currentDate: Date = new Date()
): PatientPriority {
  let priorityScore = 0;
  const reasons: string[] = [];

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

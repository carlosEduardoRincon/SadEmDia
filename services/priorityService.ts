import { Patient, PatientPriority, ProfessionalType } from '../types';
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

/**
 * Calcula a prioridade de um paciente baseado em:
 * - Comorbidades
 * - Necessidade de receita médica
 * - Tempo sem visita (especialmente próximo ao fim da semana)
 */
export function calculatePatientPriority(
  patient: Patient,
  currentDate: Date = new Date()
): PatientPriority {
  let priorityScore = 0;
  const reasons: string[] = [];

  // Prioridade por comorbidades (cada comorbidade adiciona pontos)
  if (patient.comorbidities && patient.comorbidities.length > 0) {
    const comorbidityScore = patient.comorbidities.length * 10;
    priorityScore += comorbidityScore;
    reasons.push(`${patient.comorbidities.length} comorbidade(s)`);
  }

  // Prioridade por necessidade de receita médica
  if (patient.needsPrescription) {
    priorityScore += 30;
    reasons.push('Precisa de receita médica');
  }

  // Prioridade por tempo sem visita
  if (patient.lastVisit) {
    const daysSinceLastVisit = differenceInDays(currentDate, patient.lastVisit);
    
    // Se não teve visita há mais de 3 dias, aumenta prioridade
    if (daysSinceLastVisit >= 3) {
      priorityScore += daysSinceLastVisit * 5;
      reasons.push(`${daysSinceLastVisit} dias sem visita`);
    }

    // Prioridade extra se estamos no fim da semana e não teve visita
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; // Sábado ou Domingo
    
    if (isWeekend && !isWithinInterval(patient.lastVisit, { start: weekStart, end: weekEnd })) {
      priorityScore += 25;
      reasons.push('Sem visita nesta semana');
    }
  } else {
    // Nunca teve visita - alta prioridade
    priorityScore += 50;
    reasons.push('Nunca recebeu visita');
  }

  // Prioridade por solicitações pendentes de outros profissionais
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

/**
 * Ordena pacientes por prioridade (maior prioridade primeiro)
 */
export function sortPatientsByPriority(patients: Patient[]): PatientPriority[] {
  const priorities = patients.map(patient => calculatePatientPriority(patient));
  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Filtra pacientes por tipo de profissional necessário
 */
export function filterPatientsByProfessionalType(
  priorities: PatientPriority[],
  professionalType: ProfessionalType
): PatientPriority[] {
  return priorities.filter(priority => {
    // Se o paciente tem solicitações pendentes para este tipo de profissional
    // ou se não tem nenhuma solicitação específica (visita geral)
    return true; // Por enquanto retorna todos, pode ser refinado depois
  });
}

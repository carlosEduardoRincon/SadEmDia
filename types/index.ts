// Tipos de profissionais
export type ProfessionalType = 'medico' | 'fisioterapeuta' | 'fonoaudiologo';

// Status de solicitação de visita
export type VisitRequestStatus = 'pending' | 'completed' | 'cancelled';

// Solicitação de visita de outro profissional
export interface VisitRequest {
  id: string;
  patientId: string;
  requestedBy: string; // ID do profissional que solicitou
  requestedByType: ProfessionalType;
  requestedFor: ProfessionalType; // Tipo de profissional necessário
  reason: string;
  status: VisitRequestStatus;
  createdAt: Date;
  completedAt?: Date;
}

// Visita realizada
export interface Visit {
  id: string;
  patientId: string;
  professionalId: string;
  professionalType: ProfessionalType;
  date: Date;
  notes?: string;
  visitRequestId?: string; // Se foi uma visita solicitada
}

// Paciente
export interface Patient {
  id: string;
  name: string;
  age: number;
  comorbidities: string[]; // Lista de comorbidades
  needsPrescription: boolean; // Precisa de receita médica
  lastVisit?: Date; // Data da última visita
  lastVisitBy?: ProfessionalType; // Quem fez a última visita
  visits: string[]; // IDs das visitas
  visitRequests: string[]; // IDs das solicitações pendentes
  createdAt: Date;
  updatedAt: Date;
}

// Usuário/Profissional
export interface User {
  id: string;
  email: string;
  name: string;
  professionalType: ProfessionalType;
  createdAt: Date;
}

// Cálculo de prioridade do paciente
export interface PatientPriority {
  patient: Patient;
  priorityScore: number;
  reasons: string[];
}

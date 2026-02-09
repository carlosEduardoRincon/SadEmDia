export type ProfessionalType = 'medico' | 'fisioterapeuta' | 'fonoaudiologo';

export type VisitRequestStatus = 'pending' | 'completed' | 'cancelled';

export interface VisitRequest {
  id: string;
  patientId: string;
  requestedBy: string;
  requestedByType: ProfessionalType;
  requestedFor: ProfessionalType;
  reason: string;
  status: VisitRequestStatus;
  createdAt: Date;
  completedAt?: Date;
}

export interface Visit {
  id: string;
  patientId: string;
  professionalId: string;
  professionalType: ProfessionalType;
  date: Date;
  notes?: string;
  visitRequestId?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  comorbidities: string[];
  needsPrescription: boolean;
  lastVisit?: Date;
  lastVisitBy?: ProfessionalType;
  visits: string[];
  visitRequests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  professionalType: ProfessionalType;
  createdAt: Date;
}

export interface PatientPriority {
  patient: Patient;
  priorityScore: number;
  reasons: string[];
}

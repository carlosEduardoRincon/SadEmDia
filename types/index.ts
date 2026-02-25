import type { ProfessionalType } from '../utils/professionalType';
import type { Zone } from '../utils/zone';
export type { ProfessionalType };
export type { Zone };

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
  prescriptionDelivered?: boolean;
  nextPrescriptionDue?: Date;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  address?: string;
  zone?: Zone;
  comorbidities: string[];
  needsPrescription: boolean;
  nextPrescriptionDue?: Date;
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

export type PrescriptionRequestStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface PrescriptionRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestedBy: string;
  requestedByName: string;
  status: PrescriptionRequestStatus;
  createdAt: Date;
  fulfilledAt?: Date;
}

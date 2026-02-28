import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { startOfWeek, endOfWeek } from 'date-fns';
import { getDb } from '../firebase.config';
import { Patient, Visit, VisitRequest, ProfessionalType } from '../types';
import { calculatePatientPriority, sortPatientsByPriority } from './priorityService';

const PATIENTS_COLLECTION = 'patients';
const VISITS_COLLECTION = 'visits';
const VISIT_REQUESTS_COLLECTION = 'visitRequests';

function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

function dateToTimestamp(date: Date | undefined): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

/** Semana Segunda–Domingo (weekStartsOn: 1). */
export function getStartOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** Semana Segunda–Domingo; retorna fim do domingo. */
export function getEndOfWeek(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export async function getVisitsInPeriod(startDate: Date, endDate: Date): Promise<Visit[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, VISITS_COLLECTION),
      where('date', '>=', dateToTimestamp(startDate)),
      where('date', '<=', dateToTimestamp(endDate)),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    const visits: Visit[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      visits.push({
        id: docSnap.id,
        patientId: data.patientId,
        professionalId: data.professionalId,
        professionalType: data.professionalType,
        date: timestampToDate(data.date) || new Date(),
        notes: data.notes,
        visitRequestId: data.visitRequestId,
        prescriptionDelivered: data.prescriptionDelivered,
        nextPrescriptionDue: timestampToDate(data.nextPrescriptionDue),
      });
    });
    return visits;
  } catch (error) {
    console.error('Erro ao buscar visitas no período:', error);
    throw error;
  }
}

export async function getAllPatientsOrderedByPriority(): Promise<Array<{
  patient: Patient;
  priorityScore: number;
  reasons: string[];
}>> {
  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
    const patients: Patient[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      patients.push({
        id: doc.id,
        name: data.name,
        age: data.age,
        address: data.address,
        zone: data.zone,
        comorbidities: data.comorbidities || [],
        needsPrescription: data.needsPrescription || false,
        nextPrescriptionDue: timestampToDate(data.nextPrescriptionDue),
        lastVisit: timestampToDate(data.lastVisit),
        lastVisitBy: data.lastVisitBy,
        visits: data.visits || [],
        visitRequests: data.visitRequests || [],
        admissionDate: timestampToDate(data.admissionDate),
        createdAt: timestampToDate(data.createdAt) || new Date(),
        updatedAt: timestampToDate(data.updatedAt) || new Date(),
      });
    });

    return sortPatientsByPriority(patients);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    throw error;
  }
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  try {
    const db = getDb();
    const docRef = doc(db, PATIENTS_COLLECTION, patientId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      age: data.age,
      address: data.address,
      zone: data.zone,
      comorbidities: data.comorbidities || [],
      needsPrescription: data.needsPrescription || false,
      nextPrescriptionDue: timestampToDate(data.nextPrescriptionDue),
      lastVisit: timestampToDate(data.lastVisit),
      lastVisitBy: data.lastVisitBy,
      visits: data.visits || [],
      visitRequests: data.visitRequests || [],
      admissionDate: timestampToDate(data.admissionDate),
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
}

export async function createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'visits' | 'visitRequests'>): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patientData,
      visits: [],
      visitRequests: [],
      admissionDate: patientData.admissionDate ? dateToTimestamp(patientData.admissionDate) : null,
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now),
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    throw error;
  }
}

export async function deletePatient(patientId: string): Promise<void> {
  try {
    const db = getDb();
    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    await deleteDoc(patientRef);
  } catch (error) {
    console.error('Erro ao remover paciente:', error);
    throw error;
  }
}

export async function registerVisit(
  patientId: string,
  professionalId: string,
  professionalType: ProfessionalType,
  notes?: string,
  visitRequestId?: string,
  prescriptionDelivered?: boolean,
  nextPrescriptionDue?: Date
): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    
    const visitRef = await addDoc(collection(db, VISITS_COLLECTION), {
      patientId,
      professionalId,
      professionalType,
      date: dateToTimestamp(now),
      notes: notes || null,
      visitRequestId: visitRequestId || null,
      prescriptionDelivered: prescriptionDelivered ?? null,
      nextPrescriptionDue: nextPrescriptionDue ? dateToTimestamp(nextPrescriptionDue) : null,
    });

    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    const patient = await getPatientById(patientId);
    
    if (patient) {
      const patientUpdate: Record<string, any> = {
        lastVisit: dateToTimestamp(now),
        lastVisitBy: professionalType,
        visits: [...patient.visits, visitRef.id],
        updatedAt: dateToTimestamp(now),
      };

      if (prescriptionDelivered && nextPrescriptionDue) {
        patientUpdate.nextPrescriptionDue = dateToTimestamp(nextPrescriptionDue);
      }

      if (visitRequestId) {
        patientUpdate.visitRequests = patient.visitRequests.filter(id => id !== visitRequestId);
        const visitRequestRef = doc(db, VISIT_REQUESTS_COLLECTION, visitRequestId);
        await updateDoc(visitRequestRef, {
          status: 'completed',
          completedAt: dateToTimestamp(now),
        });
      }

      await updateDoc(patientRef, patientUpdate);
    }

    return visitRef.id;
  } catch (error) {
    console.error('Erro ao registrar visita:', error);
    throw error;
  }
}

export async function requestVisitFromProfessional(
  patientId: string,
  requestedBy: string,
  requestedByType: ProfessionalType,
  requestedFor: ProfessionalType,
  reason: string,
  requestedByName?: string
): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    
    const requestRef = await addDoc(collection(db, VISIT_REQUESTS_COLLECTION), {
      patientId,
      requestedBy,
      requestedByType,
      requestedFor,
      reason,
      status: 'pending',
      createdAt: dateToTimestamp(now),
    });

    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    const patient = await getPatientById(patientId);
    
    if (patient) {
      await updateDoc(patientRef, {
        visitRequests: [...patient.visitRequests, requestRef.id],
        updatedAt: dateToTimestamp(now),
      });
    }

    return requestRef.id;
  } catch (error) {
    console.error('Erro ao solicitar visita:', error);
    throw error;
  }
}

export async function getPendingVisitRequestsForProfessional(
  professionalType: ProfessionalType
): Promise<VisitRequest[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, VISIT_REQUESTS_COLLECTION),
      where('requestedFor', '==', professionalType),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const requests: VisitRequest[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        patientId: data.patientId,
        requestedBy: data.requestedBy,
        requestedByName: data.requestedByName,
        requestedByType: data.requestedByType,
        requestedFor: data.requestedFor,
        reason: data.reason,
        status: data.status,
        createdAt: timestampToDate(data.createdAt) || new Date(),
        completedAt: timestampToDate(data.completedAt),
      });
    });

    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return requests;
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    throw error;
  }
}

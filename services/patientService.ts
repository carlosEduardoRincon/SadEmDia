import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase.config';
import { Patient, Visit, VisitRequest, ProfessionalType } from '../types';
import { calculatePatientPriority, sortPatientsByPriority } from './priorityService';

const PATIENTS_COLLECTION = 'patients';
const VISITS_COLLECTION = 'visits';
const VISIT_REQUESTS_COLLECTION = 'visitRequests';

/**
 * Converte Firestore Timestamp para Date
 */
function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

/**
 * Converte Date para Firestore Timestamp
 */
function dateToTimestamp(date: Date | undefined): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

/**
 * Busca todos os pacientes ordenados por prioridade
 */
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
        comorbidities: data.comorbidities || [],
        needsPrescription: data.needsPrescription || false,
        lastVisit: timestampToDate(data.lastVisit),
        lastVisitBy: data.lastVisitBy,
        visits: data.visits || [],
        visitRequests: data.visitRequests || [],
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

/**
 * Busca um paciente por ID
 */
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
      comorbidities: data.comorbidities || [],
      needsPrescription: data.needsPrescription || false,
      lastVisit: timestampToDate(data.lastVisit),
      lastVisitBy: data.lastVisitBy,
      visits: data.visits || [],
      visitRequests: data.visitRequests || [],
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
}

/**
 * Cria um novo paciente
 */
export async function createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'visits' | 'visitRequests'>): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patientData,
      visits: [],
      visitRequests: [],
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now),
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    throw error;
  }
}

/**
 * Registra uma visita realizada
 */
export async function registerVisit(
  patientId: string,
  professionalId: string,
  professionalType: ProfessionalType,
  notes?: string,
  visitRequestId?: string
): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    
    // Criar registro da visita
    const visitRef = await addDoc(collection(db, VISITS_COLLECTION), {
      patientId,
      professionalId,
      professionalType,
      date: dateToTimestamp(now),
      notes: notes || null,
      visitRequestId: visitRequestId || null,
    });

    // Atualizar paciente
    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    const patient = await getPatientById(patientId);
    
    if (patient) {
      await updateDoc(patientRef, {
        lastVisit: dateToTimestamp(now),
        lastVisitBy: professionalType,
        visits: [...patient.visits, visitRef.id],
        updatedAt: dateToTimestamp(now),
      });

      // Se foi uma visita solicitada, marcar como completa
      if (visitRequestId) {
        const visitRequestRef = doc(db, VISIT_REQUESTS_COLLECTION, visitRequestId);
        await updateDoc(visitRequestRef, {
          status: 'completed',
          completedAt: dateToTimestamp(now),
        });

        // Remover da lista de solicitações pendentes do paciente
        await updateDoc(patientRef, {
          visitRequests: patient.visitRequests.filter(id => id !== visitRequestId),
        });
      }
    }

    return visitRef.id;
  } catch (error) {
    console.error('Erro ao registrar visita:', error);
    throw error;
  }
}

/**
 * Cria uma solicitação de visita de outro profissional
 */
export async function requestVisitFromProfessional(
  patientId: string,
  requestedBy: string,
  requestedByType: ProfessionalType,
  requestedFor: ProfessionalType,
  reason: string
): Promise<string> {
  try {
    const db = getDb();
    const now = new Date();
    
    // Criar solicitação
    const requestRef = await addDoc(collection(db, VISIT_REQUESTS_COLLECTION), {
      patientId,
      requestedBy,
      requestedByType,
      requestedFor,
      reason,
      status: 'pending',
      createdAt: dateToTimestamp(now),
    });

    // Adicionar à lista de solicitações do paciente
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

/**
 * Busca solicitações pendentes para um tipo de profissional
 */
export async function getPendingVisitRequestsForProfessional(
  professionalType: ProfessionalType
): Promise<VisitRequest[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, VISIT_REQUESTS_COLLECTION),
      where('requestedFor', '==', professionalType),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const requests: VisitRequest[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        patientId: data.patientId,
        requestedBy: data.requestedBy,
        requestedByType: data.requestedByType,
        requestedFor: data.requestedFor,
        reason: data.reason,
        status: data.status,
        createdAt: timestampToDate(data.createdAt) || new Date(),
        completedAt: timestampToDate(data.completedAt),
      });
    });

    return requests;
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    throw error;
  }
}

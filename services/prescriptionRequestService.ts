import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase.config';
import type { PrescriptionRequest } from '../types';

const PRESCRIPTION_REQUESTS_COLLECTION = 'prescriptionRequests';

function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export async function createPrescriptionRequest(
  patientId: string,
  patientName: string,
  requestedBy: string,
  requestedByName: string
): Promise<string> {
  const db = getDb();
  const now = new Date();
  const docRef = await addDoc(collection(db, PRESCRIPTION_REQUESTS_COLLECTION), {
    patientId,
    patientName,
    requestedBy,
    requestedByName,
    status: 'pending',
    createdAt: dateToTimestamp(now),
  });
  return docRef.id;
}

export async function getAllPrescriptionRequests(): Promise<PrescriptionRequest[]> {
  const db = getDb();
  const q = query(
    collection(db, PRESCRIPTION_REQUESTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const requests: PrescriptionRequest[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    requests.push({
      id: docSnap.id,
      patientId: data.patientId,
      patientName: data.patientName || '',
      requestedBy: data.requestedBy,
      requestedByName: data.requestedByName || '',
      status: data.status || 'pending',
      createdAt: timestampToDate(data.createdAt) || new Date(),
      fulfilledAt: timestampToDate(data.fulfilledAt),
    });
  });
  return requests;
}

export async function fulfillPrescriptionRequest(requestId: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, PRESCRIPTION_REQUESTS_COLLECTION, requestId);
  await updateDoc(ref, {
    status: 'fulfilled',
    fulfilledAt: dateToTimestamp(new Date()),
  });
}

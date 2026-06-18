import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

export interface Meeting {
  id?: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  organizerId: string;
  expectedParticipantCount: number;
  departmentId?: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  qrCodeUrl?: string;
  uniqueUrlSlug: string;
  requireLocation: boolean;
  requirePhoto: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "meetings";

export const getMeetings = async (): Promise<Meeting[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
};

export const getMeetingById = async (id: string): Promise<Meeting | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Meeting;
  }
  return null;
};

export const getMeetingBySlug = async (slug: string): Promise<Meeting | null> => {
  const q = query(collection(db, COLLECTION_NAME), where("uniqueUrlSlug", "==", slug));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Meeting;
  }
  return null;
};

export const createMeeting = async (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...meeting,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateMeeting = async (id: string, meeting: Partial<Meeting>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...meeting,
    updatedAt: Timestamp.now()
  });
};

export const deleteMeeting = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

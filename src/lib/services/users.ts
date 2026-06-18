import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

export interface Employee {
  id: string; // This will map to Firebase Auth UID
  name: string;
  email: string;
  employeeId: string;
  departmentId: string;
  designation: string;
  role: "SUPER_ADMIN" | "MEETING_ADMIN" | "USER";
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "users";

export const getEmployees = async (): Promise<Employee[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const createEmployeeRecord = async (uid: string, employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, uid);
  await setDoc(docRef, {
    ...employee,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateEmployee = async (id: string, employee: Partial<Employee>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...employee,
    updatedAt: Timestamp.now()
  });
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

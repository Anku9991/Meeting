import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

export interface Department {
  id?: string;
  name: string;
  description: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "departments";

export const getDepartments = async (): Promise<Department[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
};

export const createDepartment = async (department: Omit<Department, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...department,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateDepartment = async (id: string, department: Partial<Department>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...department,
    updatedAt: Timestamp.now()
  });
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

"use client";

const DB_NAME = "yohaku_logs";
const DB_VERSION = 2;
const STORE_NAME = "personal_logs";
const PREFS_STORE_NAME = "preferences";

export type PersonalLog = {
  id: string;
  road: string;
  content: string;
  mood: number;
  tags: string[];
  created_at: number;
  updated_at: number;
};

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PREFS_STORE_NAME)) {
        db.createObjectStore(PREFS_STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPersonalLog(log: Omit<PersonalLog, "id" | "created_at" | "updated_at">): Promise<PersonalLog> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  const newLog: PersonalLog = { ...log, id, created_at: now, updated_at: now };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.add(newLog);
    transaction.oncomplete = () => resolve(newLog);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getPersonalLogs(): Promise<PersonalLog[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const logs = request.result as PersonalLog[];
        logs.sort((a, b) => b.created_at - a.created_at); // Descending order
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

export async function deletePersonalLog(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCurrentRoad(): Promise<string> {
  if (typeof window === 'undefined') return "beginner";
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([PREFS_STORE_NAME], "readonly");
      const store = transaction.objectStore(PREFS_STORE_NAME);
      const request = store.get("current_road");
      request.onsuccess = () => {
        resolve(request.result?.value || "beginner");
      };
      request.onerror = () => resolve("beginner");
    });
  } catch (e) {
    return "beginner";
  }
}

export async function setCurrentRoad(roadId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PREFS_STORE_NAME], "readwrite");
    const store = transaction.objectStore(PREFS_STORE_NAME);
    store.put({ key: "current_road", value: roadId });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function importPersonalLogs(logs: PersonalLog[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const log of logs) {
      store.put(log);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

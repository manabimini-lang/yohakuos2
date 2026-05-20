"use client";

const DB_NAME = "yohaku_secure";
const DB_VERSION = 1;
const STORE_NAME = "ai_keys";

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "provider" });
      }
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEncryptionKey(db: IDBDatabase): Promise<CryptoKey> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["keys"], "readwrite");
    const store = transaction.objectStore("keys");
    const request = store.get("master_key");

    request.onsuccess = async () => {
      if (request.result) {
        resolve(request.result.key);
      } else {
        const key = await window.crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false, // extractable
          ["encrypt", "decrypt"]
        );
        store.put({ id: "master_key", key });
        resolve(key);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function saveSecureApiKey(provider: string, apiKey: string) {
  const db = await initDB();
  const key = await getEncryptionKey(db);
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const ivBase64 = arrayBufferToBase64(iv);
  const dataBase64 = arrayBufferToBase64(encrypted);
  const encrypted_key = `${ivBase64}:${dataBase64}`;

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put({
      provider,
      encrypted_key,
      created_at: Date.now()
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSecureApiKeyStatus(provider: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(provider);
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function getDecryptedApiKey(provider: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await initDB();
    const record = await new Promise<any>((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(provider);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    if (!record || !record.encrypted_key) return null;

    const key = await getEncryptionKey(db);
    const [ivBase64, dataBase64] = record.encrypted_key.split(":");
    
    if (!ivBase64 || !dataBase64) return null;

    const iv = base64ToArrayBuffer(ivBase64);
    const data = base64ToArrayBuffer(dataBase64);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return null;
  }
}

export async function deleteSecureApiKey(provider: string) {
  if (typeof window === 'undefined') return;
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(provider);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.error("Failed to delete secure API key:", e);
  }
}

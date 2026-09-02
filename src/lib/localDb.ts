export interface NfcPayment {
  id: string;
  card_id: string;
  card_number: string;
  card_holder: string;
  card_brand: string;
  amount: number;
  currency: string;
  merchant: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}

const DB_NAME = 'nfc-card-db';
const DB_VERSION = 1;
const STORE_PAYMENTS = 'payments';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
        const store = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id' });
        store.createIndex('card_id', 'card_id', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function savePayment(
  payment: Omit<NfcPayment, 'id' | 'created_at'>
): Promise<NfcPayment> {
  const db = await openDB();
  const fullPayment: NfcPayment = {
    ...payment,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAYMENTS, 'readwrite');
    const store = tx.objectStore(STORE_PAYMENTS);
    const request = store.add(fullPayment);
    request.onsuccess = () => resolve(fullPayment);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getAllPayments(): Promise<NfcPayment[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAYMENTS, 'readonly');
    const store = tx.objectStore(STORE_PAYMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result as NfcPayment[]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getPaymentsByCard(cardId: string): Promise<NfcPayment[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAYMENTS, 'readonly');
    const store = tx.objectStore(STORE_PAYMENTS);
    const index = store.index('card_id');
    const request = index.getAll(cardId);
    request.onsuccess = () => {
      const results = (request.result as NfcPayment[]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function deleteAllPayments(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PAYMENTS, 'readwrite');
    const store = tx.objectStore(STORE_PAYMENTS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

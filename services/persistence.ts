/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const DB_NAME = 'PixshopDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

// Helper: Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper: Base64 to File
const base64ToFile = (dataurl: string, filename: string, mimeType: string, lastModified: number): File => {
    // Basic validation to prevent crashes on empty data
    if (!dataurl || !dataurl.includes(',')) {
        return new File([""], filename, {type: mimeType || 'application/octet-stream', lastModified: lastModified});
    }

    const arr = dataurl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mimeType, lastModified: lastModified});
}

// Fix: Define the SerializedFile interface.
interface SerializedFile {
    name: string;
    type: string;
    lastModified: number;
    data: string; // Base64 for Files, URL for strings
    isUrl?: boolean;
}

// Internal storage format
interface StoredAppState {
    id: string; // 'current'
    history: SerializedFile[];
    historyIndex: number;
    activeTab: string;
    hakiEnabled?: boolean;
    hakiColor?: string;
    hakiSize?: number;
    hakiSpeed?: number;
    isPlatinumTier?: boolean; // New Platinum flag
    timestamp: number;
}

// Public Interface used by the App
interface AppState {
    history: (File | string)[];
    historyIndex: number;
    activeTab: string;
    hakiEnabled?: boolean;
    hakiColor?: string;
    hakiSize?: number;
    hakiSpeed?: number;
    isPlatinumTier?: boolean; // New Platinum flag
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveState = async (
    history: (File | string)[], 
    historyIndex: number, 
    activeTab: string, 
    hakiEnabled: boolean,
    hakiColor: string = '#DB24E3',
    hakiSize: number = 1,
    hakiSpeed: number = 1,
    isPlatinumTier: boolean = true // New Platinum flag
): Promise<void> => {
    try {
        // Serialize history items. Files become Base64, strings (URLs) are stored as-is.
        const serializedHistory: SerializedFile[] = await Promise.all(history.map(async (item) => {
            if (typeof item === 'string') {
                return {
                    name: 'remote-video.mp4',
                    type: 'video/mp4',
                    lastModified: Date.now(),
                    data: item, // Store the URL directly
                    isUrl: true,
                };
            }
            // It's a File
            return {
                name: item.name,
                type: item.type,
                lastModified: item.lastModified,
                data: await blobToBase64(item), // Store as Base64
                isUrl: false,
            };
        }));

        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        const state: StoredAppState = {
            id: 'current',
            history: serializedHistory,
            historyIndex,
            activeTab,
            hakiEnabled,
            hakiColor,
            hakiSize,
            hakiSpeed,
            isPlatinumTier, // Save new flag
            timestamp: Date.now()
        };

        store.put(state);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Failed to save state persistence:", e);
    }
};

export const loadState = async (): Promise<AppState | null> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('current');

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result as StoredAppState | undefined;
                if (result) {
                    // Deserialize based on the isUrl flag.
                    const history = result.history.map(f => {
                        if (f.isUrl) {
                            return f.data; // It's a URL string
                        }
                        // It's a File
                        return base64ToFile(f.data, f.name, f.type, f.lastModified);
                    });

                    resolve({
                        history: history,
                        historyIndex: result.historyIndex,
                        activeTab: result.activeTab,
                        hakiEnabled: result.hakiEnabled,
                        hakiColor: result.hakiColor ?? '#DB24E3',
                        hakiSize: result.hakiSize ?? 1,
                        hakiSpeed: result.hakiSpeed ?? 1,
                        isPlatinumTier: result.isPlatinumTier ?? true // Load new flag, default true
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Failed to load state persistence:", e);
        return null;
    }
};

export const clearState = async (): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('current');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
         console.error("Failed to clear state persistence:", e);
         throw e;
    }
};

export const nukeDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => {
            console.error("Failed to delete DB", req.error);
            resolve(); // Proceed anyway
        };
        req.onblocked = () => {
            console.warn("Delete DB blocked");
            resolve(); // Proceed anyway
        };
    });
};